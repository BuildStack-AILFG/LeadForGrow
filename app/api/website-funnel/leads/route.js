import { NextResponse } from 'next/server';
import { dbConnect } from "@/lib/mongodb";
import Website from "@/models/Website";
import Lead from "@/models/automation/Lead";
import LeadSource from "@/models/automation/LeadSource";
import Activity from "@/models/automation/Activity";
import Business from "@/models/Business";
import { automationEngine } from "@/lib/automationEngine";

export async function POST(request) {
  try {
    await dbConnect();
    const data = await request.json();
    const { websiteId, businessId, name, email, phone, message } = data;

    if (!websiteId || !businessId || !name || !phone) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // The claimed business must exist and the website must belong to it —
    // otherwise anyone could inject leads into an arbitrary tenant.
    const [business, website] = await Promise.all([
      Business.findById(businessId).select('_id').lean(),
      Website.findById(websiteId).select('businessId owner').lean(),
    ]);
    if (!business || !website) {
      return NextResponse.json({ success: false, error: 'Invalid website or business' }, { status: 404 });
    }
    if (website.businessId && String(website.businessId) !== String(businessId)) {
      return NextResponse.json({ success: false, error: 'Website does not belong to this business' }, { status: 403 });
    }

    // 1. Create the lead
    const lead = await Lead.create({
      businessId,
      name,
      email,
      phone,
      serviceInterest: message,
      source: 'Website Funnel',
      websiteId,
      status: 'new',
      priority: 'high'
    });

    // 2. Log activity
    await Activity.create({
      businessId,
      leadId: lead._id,
      type: 'lead_captured',
      text: `Lead captured from website funnel (ID: ${websiteId})`,
      metadata: {
        websiteId,
        message
      }
    });

    // 3. Trigger Automation (Existing System)
    try {
      if (automationEngine && typeof automationEngine.processLeadTrigger === 'function') {
        console.log(`[API:WebsiteLeads] Triggering automation for new lead: ${lead._id}`);
        await automationEngine.processLeadTrigger(lead, 'onLeadReceived');
      }
    } catch (autoError) {
      console.error('Automation engine error:', autoError);
      // Don't fail the lead capture if automation fails
    }

    // 4. Real-time: notify the workspace (sound + toast) of the new lead.
    try {
      const { emitLeadUpdated } = await import('@/lib/realtime/publish');
      emitLeadUpdated(businessId, { leadId: lead._id, action: 'created', source: 'Website Funnel' }).catch(() => {});
    } catch (err) {
      console.warn('[API:WebsiteLeads] emitLeadUpdated failed:', err.message);
    }

    return NextResponse.json({ success: true, leadId: lead._id });
  } catch (error) {
    console.error('Error submitting lead from website:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
