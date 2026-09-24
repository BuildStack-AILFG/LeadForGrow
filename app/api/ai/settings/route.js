import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withAuth } from '@/lib/auth';
import { getAiSettings, updateAiSettings } from '@/lib/ai/settings';
import { isAiConfigured } from '@/lib/ai/providers';

export const GET = withAuth()(async (req) => {
  try {
    await dbConnect();
    const settings = await getAiSettings(req.user.businessId);
    // Configured = platform provider available, OR the client wired up their
    // own OpenAI key (BYOK). Either way AI reply can run.
    const configured = isAiConfigured() || (settings.provider === 'openai' && settings.hasApiKey);
    return NextResponse.json({
      success: true,
      data: { ...settings, configured },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const PUT = withAuth()(async (req) => {
  try {
    await dbConnect();
    const body = await req.json();
    await updateAiSettings(req.user.businessId, body);
    // Return the client-safe view (never the encrypted key).
    const settings = await getAiSettings(req.user.businessId);
    const configured = isAiConfigured() || (settings.provider === 'openai' && settings.hasApiKey);
    return NextResponse.json({ success: true, data: { ...settings, configured } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
