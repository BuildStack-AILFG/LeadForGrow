import mongoose from 'mongoose';
import MeetingBooking from '@/models/meetings/MeetingBooking';
import MeetingType from '@/models/meetings/MeetingType';
import Business from '@/models/Business';
import User from '@/models/User';

const ACTIVE_BOOKING_STATUSES = ['scheduled', 'confirmed', 'rescheduled'];

function toObjectId(id) {
  if (!id) return id;
  if (id instanceof mongoose.Types.ObjectId) return id;
  if (mongoose.Types.ObjectId.isValid(String(id))) {
    return new mongoose.Types.ObjectId(String(id));
  }
  return id;
}
import { generateAvailableSlots, isSlotAvailable } from './slotGenerator';
import { assignHost } from './roundRobin';
import { syncBookingToCrm, generateRebookToken } from './crmSync';
import { scheduleBookingReminders } from './reminders';
import { recordBookingAnalytics } from './analytics';
import { generateGoogleMeetLink } from '@/lib/googleMeet';

/**
 * Public + internal booking orchestration.
 */
export async function createBooking({
  meetingTypeId,
  slug,
  businessId,
  startTime,
  guest,
  source = 'booking_link',
  assignedToOverride = null,
}) {
  let meetingType;
  if (meetingTypeId) {
    meetingType = await MeetingType.findOne({ _id: meetingTypeId, businessId, status: 'published' });
  } else if (slug) {
    meetingType = await MeetingType.findOne({ bookingSlug: slug, status: 'published' });
    if (meetingType && businessId && String(meetingType.businessId) !== String(businessId)) {
      meetingType = null;
    }
  }

  if (!meetingType) {
    throw new Error('Meeting type not found or not published');
  }

  const start = new Date(startTime);
  const end = new Date(start.getTime() + (meetingType.durationMinutes || 30) * 60000);

  const existing = await MeetingBooking.find({
    businessId: meetingType.businessId,
    status: { $in: ['scheduled', 'confirmed'] },
    startTime: {
      $gte: new Date(start.getTime() - 86400000),
      $lte: new Date(end.getTime() + 86400000),
    },
  }).lean();

  const buffer = meetingType.availabilityRules?.bufferAfterMinutes || 15;
  if (!isSlotAvailable(start, end, existing, buffer)) {
    throw new Error('This time slot is no longer available');
  }

  const assignedTo =
    assignedToOverride ||
    (await assignHost({
      meetingType,
      businessId: meetingType.businessId,
      leadScore: guest.leadScore || 0,
    }));

  let meetingLink = '';
  if (meetingType.calendarIntegrations?.googleMeet !== false) {
    meetingLink = generateGoogleMeetLink();
  }

  const booking = await MeetingBooking.create({
    businessId: meetingType.businessId,
    meetingTypeId: meetingType._id,
    assignedTo,
    guest: {
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      whatsapp: guest.whatsapp || guest.phone,
      company: guest.company,
      notes: guest.notes,
      customFields: guest.customFields || {},
    },
    startTime: start,
    endTime: end,
    timezone: meetingType.availabilityRules?.timezone || 'Asia/Kolkata',
    source,
    status: 'confirmed',
    meetingLink,
    rebookToken: generateRebookToken(),
  });

  const business = await Business.findById(meetingType.businessId);
  await syncBookingToCrm({ business, meetingType, booking, guest });
  await scheduleBookingReminders({ booking, meetingType, business });

  // processPendingReminders inside scheduleBookingReminders re-fetches the
  // booking and flips whatsappConfirmationSent/emailConfirmationSent on that
  // copy, so refetch to get the latest flags for the response.
  const refreshed = await MeetingBooking.findById(booking._id);
  const finalBooking = refreshed || booking;

  meetingType.stats = meetingType.stats || {};
  meetingType.stats.totalBookings = (meetingType.stats.totalBookings || 0) + 1;
  await meetingType.save();

  await recordBookingAnalytics({ booking: finalBooking, meetingType });

  return { booking: finalBooking, meetingType, business };
}

export async function getPublicMeetingBySlug(slug) {
  const meetingType = await MeetingType.findOne({
    bookingSlug: slug.toLowerCase(),
    status: 'published',
  }).lean();

  if (!meetingType) return null;

  const business = await Business.findById(meetingType.businessId)
    .select('businessName logo website industry')
    .lean();

  let host = null;
  if (meetingType.ownerId) {
    host = await User.findById(meetingType.ownerId)
      .select('name email avatar')
      .lean();
  }

  const existingBookings = await MeetingBooking.find({
    businessId: meetingType.businessId,
    status: { $in: ['scheduled', 'confirmed'] },
    startTime: { $gte: new Date() },
  })
    .select('startTime endTime assignedTo')
    .lean();

  const slots = generateAvailableSlots({
    meetingType,
    existingBookings,
    daysAhead: 14,
  });

  return { meetingType, business, host, slots };
}

export async function getDashboardData(businessId) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const bid = toObjectId(businessId);

  const [
    meetingTypes,
    upcomingRaw,
    recentRaw,
    statsAgg,
    awaitingRaw,
  ] = await Promise.all([
    MeetingType.find({ businessId: bid, status: { $ne: 'archived' } })
      .sort({ updatedAt: -1 })
      .lean(),
    MeetingBooking.find({
      businessId: bid,
      status: { $in: ACTIVE_BOOKING_STATUSES },
      endTime: { $gte: now },
    })
      .sort({ startTime: 1 })
      .limit(12)
      .lean(),
    MeetingBooking.find({ businessId: bid })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    MeetingBooking.aggregate([
      {
        $match: {
          businessId: bid,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          noShows: {
            $sum: { $cond: [{ $eq: ['$status', 'no_show'] }, 1, 0] },
          },
          revenue: { $sum: '$revenueValue' },
        },
      },
    ]),
    // Meetings that have ended but were never marked completed / no-show.
    MeetingBooking.find({
      businessId: bid,
      status: { $in: ACTIVE_BOOKING_STATUSES },
      endTime: { $lt: now, $gte: thirtyDaysAgo },
    })
      .sort({ endTime: -1 })
      .limit(10)
      .lean(),
  ]);

  const stats = statsAgg[0] || { total: 0, completed: 0, noShows: 0, revenue: 0 };
  const conversionRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const noShowRate =
    stats.total > 0 ? Math.round((stats.noShows / stats.total) * 100) : 0;

  const typeIds = [
    ...new Set(
      [...upcomingRaw, ...recentRaw, ...awaitingRaw]
        .map((b) => b.meetingTypeId)
        .filter(Boolean)
        .map(String)
    ),
  ].map((id) => toObjectId(id));

  const hostIds = [
    ...new Set(
      [...upcomingRaw, ...awaitingRaw].map((b) => b.assignedTo).filter(Boolean).map(String)
    ),
  ].map((id) => toObjectId(id));

  const [typesById, hostsById] = await Promise.all([
    typeIds.length
      ? MeetingType.find({ _id: { $in: typeIds } })
          .select('title category durationMinutes bookingSlug')
          .lean()
      : [],
    hostIds.length
      ? User.find({ _id: { $in: hostIds } }).select('name email').lean()
      : [],
  ]);

  const typeMap = Object.fromEntries(typesById.map((t) => [String(t._id), t]));
  const hostMap = Object.fromEntries(hostsById.map((u) => [String(u._id), u]));

  const enrichBooking = (b) => ({
    ...b,
    _id: String(b._id),
    meetingTypeId: typeMap[String(b.meetingTypeId)] || null,
    assignedTo: hostMap[String(b.assignedTo)] || null,
  });

  const upcomingBookings = upcomingRaw.map(enrichBooking);
  const recentBookings = recentRaw.map(enrichBooking);
  const awaitingOutcome = awaitingRaw.map(enrichBooking);

  return {
    kpis: {
      meetingsBooked: stats.total,
      conversionRate,
      noShowRate,
      revenueGenerated: stats.revenue,
      avgResponseTime: '12m',
      upcomingMeetings: upcomingBookings.length,
    },
    meetingTypes,
    upcomingBookings,
    recentBookings,
    awaitingOutcome,
    bookingLinks: meetingTypes.filter((m) => m.status === 'published'),
  };
}
