import Lead from '@/models/automation/Lead';
import Contact from '@/models/automation/Contact';
import Company from '@/models/automation/Company';
import Deal from '@/models/automation/Deal';
import { findDuplicateContacts } from '@/lib/crm/duplicateDetection';

function normalizePhone(phone) {
  if (!phone) return null;
  return String(phone).replace(/\D/g, '');
}

function last10(phone) {
  const n = normalizePhone(phone);
  return n && n.length >= 10 ? n.slice(-10) : n;
}

/**
 * Resolve CRM records for an inbound message participant.
 * Priority: phone → email → instagram → contact → lead → company → create lead
 */
export async function matchCustomer(businessId, {
  phone,
  email,
  instagramId,
  instagramUsername,
  name,
  channel = 'whatsapp',
  createIfMissing = true,
}) {
  const result = {
    lead: null,
    contact: null,
    company: null,
    deal: null,
    isNew: false,
  };

  const phoneNorm = normalizePhone(phone);
  const emailNorm = email?.trim()?.toLowerCase();

  // 1. Phone match → Lead
  if (phoneNorm) {
    const l10 = last10(phoneNorm);
    const lead = await Lead.findOne({
      businessId,
      archived: { $ne: true },
      $or: [
        { phone: phoneNorm },
        { whatsappId: phoneNorm },
        ...(l10 ? [{ phone: { $regex: `${l10}$` } }, { whatsappId: { $regex: `${l10}$` } }] : []),
      ],
    });
    if (lead) {
      result.lead = lead;
      if (lead.contactId) result.contact = await Contact.findById(lead.contactId);
      if (lead.companyId) result.company = await Company.findById(lead.companyId);
    }
  }

  // 2. Email match → Contact or Lead
  if (!result.lead && emailNorm) {
    const dupes = await findDuplicateContacts(businessId, { emails: [emailNorm] });
    if (dupes.length) {
      result.contact = dupes[0];
      if (result.contact.leadId) {
        result.lead = await Lead.findById(result.contact.leadId);
      }
    }
    if (!result.lead) {
      const leadByEmail = await Lead.findOne({ businessId, email: emailNorm, archived: { $ne: true } });
      if (leadByEmail) result.lead = leadByEmail;
    }
  }

  // 3. Instagram account
  if (!result.lead && instagramId) {
    const leadByIg = await Lead.findOne({
      businessId,
      archived: { $ne: true },
      $or: [
        { 'metadata.instagramId': instagramId },
        { 'customFields.instagramId': instagramId },
      ],
    });
    if (leadByIg) result.lead = leadByIg;
  }

  // 4. Existing contact without lead link
  if (!result.lead && result.contact) {
    const phones = result.contact.phones || [];
    if (phones.length) {
      result.lead = await Lead.findOne({
        businessId,
        phone: { $in: phones.map((p) => normalizePhone(p)).filter(Boolean) },
        archived: { $ne: true },
      });
    }
  }

  // 5. Open deal for contact/lead
  if (result.lead || result.contact) {
    const dealQuery = { businessId, archived: false, stage: { $nin: ['won', 'lost', 'closed_won', 'closed_lost'] } };
    if (result.lead?._id) dealQuery.leadId = result.lead._id;
    else if (result.contact?._id) dealQuery.contactId = result.contact._id;
    result.deal = await Deal.findOne(dealQuery).sort({ updatedAt: -1 });
    if (result.lead?.companyId && !result.company) {
      result.company = await Company.findById(result.lead.companyId);
    }
  }

  // 6. Create new lead if needed
  if (!result.lead && createIfMissing) {
    const sourceMap = { whatsapp: 'whatsapp', instagram: 'instagram_ad', email: 'website' };
    const leadData = {
      businessId,
      name: name || instagramUsername || emailNorm?.split('@')[0] || 'New Contact',
      phone: phoneNorm || undefined,
      email: emailNorm || undefined,
      source: sourceMap[channel] || 'other',
      status: 'new_lead',
      receivedAt: new Date(),
    };
    if (instagramId) {
      leadData.metadata = { instagramId, instagramUsername };
    }
    if (channel === 'whatsapp' && phoneNorm) {
      leadData.whatsappId = phoneNorm;
    }
    result.lead = await Lead.create(leadData);
    result.isNew = true;

    // Real-time: notify the workspace (sound + toast) that a new lead just
    // landed. Centralized here since WhatsApp/Instagram/Email inbound
    // messages all create leads through this one function — fixes the gap
    // where only WhatsApp used to fire this via its own caller.
    try {
      const { emitLeadUpdated } = await import('@/lib/realtime/publish');
      emitLeadUpdated(businessId, {
        leadId: result.lead._id,
        action: 'created',
        source: leadData.source,
      }).catch(() => {});
    } catch (err) {
      console.warn('[matchCustomer] emitLeadUpdated failed:', err.message);
    }
  }

  return result;
}

export default { matchCustomer };
