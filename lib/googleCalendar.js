import { google } from 'googleapis';

/**
 * Initialize Google Calendar API client
 */
const getCalendarClient = () => {
  const credentials = {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
};

/**
 * Generate a Google Meet link by creating a calendar event
 * @param {string} userName - Name of the user
 * @param {string} userEmail - Email of the user
 * @returns {Promise<string>} - Google Meet link
 */
export const generateGoogleMeetLink = async (userName, userEmail) => {
  try {
    const calendar = getCalendarClient();
    
    // Schedule meeting for 24 hours from now
    const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 5 * 60 * 1000); // 5 minutes

    const event = {
      summary: 'LeadForGrow – Quick Setup Walkthrough',
      description: `Setup call with ${userName}.\n\nNo payment required. Quick chat about lead flow and system setup.`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      attendees: [
        { email: userEmail },
        { email: 'sales@leadforgrow.com' },
      ],
      conferenceData: {
        createRequest: {
          requestId: `lfg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all', // Send calendar invites to attendees
    });

    const meetLink = response.data.hangoutLink;
    console.log(`[Google Calendar] Meet link generated: ${meetLink}`);
    
    return meetLink;
  } catch (error) {
    console.error('[Google Calendar] Failed to generate meet link:', error);
    
    // Fallback to instant.google.com/meet if Calendar API fails
    const fallbackLink = `https://meet.google.com/${Math.random().toString(36).substring(2, 15)}`;
    console.log(`[Google Calendar] Using fallback link: ${fallbackLink}`);
    return fallbackLink;
  }
};
