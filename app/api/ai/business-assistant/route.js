import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withAuth } from '@/lib/auth';
import { buildBusinessAssistantContext, generateLocalAnswer } from '@/lib/server/businessAssistantContext';
import { detectCopilotIntent, executeCopilotTool } from '@/lib/ai/copilotTools';
import { chatCompletion } from '@/lib/ai/providers';
import { getAiSettings } from '@/lib/ai/settings';

const AI_BACKEND = process.env.AI_BACKEND_URL || 'https://lfg-v2.onrender.com';

export const POST = withAuth()(async (req) => {
  try {
    await dbConnect();
    const user = req.user;
    const body = await req.json();
    const { question, history = [] } = body;

    if (!question?.trim()) {
      return NextResponse.json({ success: false, error: 'Question required' }, { status: 400 });
    }

    const ctx = await buildBusinessAssistantContext(user.businessId, user.userId);
    if (!ctx) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    const metricsPayload = {
      businessName: ctx.businessName,
      totalLeads: ctx.metrics.totalLeads,
      activeLeads: ctx.metrics.activeLeads,
      totalPipelineValue: ctx.metrics.totalPipelineValue,
      revenueAtRisk: ctx.metrics.revenueAtRisk,
      recoveredRevenue: ctx.metrics.recoveredRevenue,
      slaCompliance: ctx.metrics.slaCompliance,
      topSource: ctx.topSource,
      avgDeal: ctx.dealValue,
      plan: ctx.plan,
      activeAutomations: ctx.operations.activeAutomationRules,
      activeSequences: ctx.operations.activeSequences,
    };

    let answer;
    let source = 'local';
    let toolResult = null;

    const intent = detectCopilotIntent(question.trim());
    if (intent) {
      toolResult = await executeCopilotTool(intent.tool, intent.params, user.businessId);
    }

    const aiSettings = await getAiSettings(user.businessId);

    try {
      const aiRes = await fetch(`${AI_BACKEND}/ai/copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          metrics: metricsPayload,
          history: history.slice(-6),
          context: {
            businessName: ctx.businessName,
            integrations: ctx.integrations,
            hotLeads: ctx.hotLeads,
            operations: ctx.operations,
          },
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (aiRes.ok) {
        const data = await aiRes.json();
        if (data.answer) {
          answer = data.answer;
          source = 'ai';
        }
      }
    } catch (err) {
      console.warn('[BusinessAssistant] AI backend fallback:', err.message);
    }

    if (!answer && toolResult && !toolResult.error) {
      const llm = await chatCompletion({
        messages: [
          { role: 'system', content: `You are Grovia, CRM copilot for ${ctx.businessName}. Summarize CRM tool results clearly for the sales team. Be concise.` },
          { role: 'user', content: `Question: ${question}\n\nTool data:\n${JSON.stringify(toolResult, null, 2)}` },
        ],
        temperature: 0.3,
      });
      if (llm.content) {
        answer = llm.content.trim();
        source = 'copilot';
      }
    }

    // Any question that didn't match a "tool" intent and wasn't answered by the
    // (possibly unreachable) external AI_BACKEND_URL still deserves a real, question-specific
    // answer rather than a static canned response — route it to the configured LLM with the
    // full business context. generateLocalAnswer is now only the last-resort fallback if the
    // LLM call itself errors (no provider configured / network failure).
    if (!answer) {
      const llm = await chatCompletion({
        messages: [
          {
            role: 'system',
            content: `You are Grovia, ${ctx.businessName}'s private CRM growth copilot. Answer the team's question directly and specifically using the business context below — never give a generic, one-size-fits-all reply. Be concise (2-5 sentences unless the question needs a list). If the context doesn't contain what's needed to answer precisely, say so and suggest what to check instead of guessing.\n\nBusiness context:\n${JSON.stringify(metricsPayload, null, 2)}`,
          },
          ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: question },
        ],
        temperature: 0.4,
      });
      if (llm.content) {
        answer = llm.content.trim();
        source = 'ai';
      }
    }

    if (!answer) {
      answer = generateLocalAnswer(question, ctx);
      if (toolResult && !toolResult.error) {
        answer += `\n\n**CRM data:** ${JSON.stringify(toolResult.data || toolResult, null, 2).slice(0, 800)}`;
      }
      source = 'local';
    }

    return NextResponse.json({
      success: true,
      answer,
      source,
      tool: toolResult?.tool || null,
      context: {
        businessName: ctx.businessName,
        metrics: ctx.metrics,
        aiEnabled: aiSettings.enabled !== false,
      },
    });
  } catch (error) {
    console.error('[BusinessAssistant] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process question' }, { status: 500 });
  }
});

export const GET = withAuth()(async (req) => {
  try {
    await dbConnect();
    const ctx = await buildBusinessAssistantContext(req.user.businessId, req.user.userId);
    if (!ctx) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      data: {
        businessName: ctx.businessName,
        plan: ctx.plan,
        metrics: ctx.metrics,
        operations: ctx.operations,
        integrations: ctx.integrations,
        topSource: ctx.topSource,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
