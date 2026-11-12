import AutomationRule from '@/models/automation/AutomationRule';
import AutomationSequence from '@/models/automation/AutomationSequence';
import SequenceExecution from '@/models/sequences/SequenceExecution';
import Lead from '@/models/automation/Lead';
import Business from '@/models/Business';
import { TRIGGER_TO_ENGINE } from './constants';
import { executeNode, getOutgoingEdges, findStartNode } from './executor';
import { adjustDelayForBusinessHours } from '@/lib/automation/businessHours';
import { pickAbVariant } from '@/lib/automation/approvalGate';

function getWorkflowGraph(sequence, execution) {
  if (execution?.context?.workflowNodes?.length) {
    return { nodes: execution.context.workflowNodes, edges: execution.context.workflowEdges };
  }
  const picked = pickAbVariant(sequence);
  return { nodes: picked.nodes || sequence.nodes || [], edges: picked.edges || sequence.edges || [], variantId: picked.variantId };
}

/**
 * Optional enrolment filters on a sequence (triggerConfig):
 *   sources        — only leads whose source is in this list
 *   excludeSources — never leads whose source is in this list
 *   stages         — for stage_changed sequences: only when the lead moved into one of these stages
 */
export function sequenceMatchesLead(sequence, lead) {
  const cfg = sequence?.triggerConfig || {};
  const source = String(lead?.source || '').toLowerCase();
  const list = (v) => (Array.isArray(v) ? v.map((x) => String(x).toLowerCase()).filter(Boolean) : []);
  const only = list(cfg.sources);
  if (only.length && !only.includes(source)) return false;
  if (list(cfg.excludeSources).includes(source)) return false;
  const stages = list(cfg.stages);
  if (stages.length && !stages.includes(String(lead?.status || '').toLowerCase())) return false;
  return true;
}

export const sequenceEngine = {
  /**
   * Start a graph-based workflow for a lead
   */
  async startWorkflow(lead, sequenceId, automationRuleId = null, options = {}) {
    const sequence = await AutomationSequence.findById(sequenceId);
    if (!sequence || sequence.status === 'archived' || sequence.enabled === false) return null;

    const business = await Business.findById(lead.businessId);
    if (!business) return null;

    const picked = pickAbVariant(sequence);
    const workflowNodes = picked.nodes || sequence.nodes || [];
    const startNode = findStartNode({ ...(sequence.toObject ? sequence.toObject() : sequence), nodes: workflowNodes });
    if (!startNode && (!sequence.steps || sequence.steps.length === 0)) return null;

    const execution = await SequenceExecution.create({
      businessId: lead.businessId,
      sequenceId: sequence._id,
      leadId: lead._id,
      automationRuleId,
      status: 'running',
      currentNodeId: startNode?.id || null,
      logs: [],
      testMode: options.testMode || false,
      debugMode: options.debugMode || false,
      variantId: picked.variantId || null,
      context: {
        ...(options.context || {}),
        workflowNodes: picked.nodes,
        workflowEdges: picked.edges,
        loopCounts: {},
        parallel: {},
      },
    });

    if (!options.testMode) {
      await Lead.findByIdAndUpdate(lead._id, {
        $set: { activeSequenceId: sequence._id, sequenceStepIndex: 0, activeExecutionId: execution._id },
      });
    }

    if (sequence.workflowMode === 'graph' && workflowNodes.length) {
      await sequenceEngine.processNode(execution._id, startNode.id);
    } else if (sequence.steps?.length) {
      const { automationEngine } = await import('@/lib/automationEngine');
      await automationEngine.executeSequenceStep(lead._id, sequence._id, 0);
    }

    if (!options.testMode) {
      await AutomationSequence.updateOne(
        { _id: sequence._id },
        { $inc: { 'analytics.enrolled': 1, 'analytics.activeRuns': 1 } }
      );
    }

    return execution;
  },

  /**
   * Process a workflow node and queue/trigger next
   */
  async processNode(executionId, nodeId) {
    const execution = await SequenceExecution.findById(executionId);
    if (!execution || ['completed', 'failed', 'cancelled'].includes(execution.status)) return;

    const sequence = await AutomationSequence.findById(execution.sequenceId);
    const lead = await Lead.findById(execution.leadId);
    const business = await Business.findById(execution.businessId);
    if (!sequence || !lead || !business) return;

    const graph = getWorkflowGraph(sequence, execution);
    const node = (graph.nodes || []).find((n) => n.id === nodeId);
    if (!node) {
      await sequenceEngine.completeExecution(execution, 'failed', 'Node not found');
      return;
    }

    await SequenceExecution.updateOne(
      { _id: executionId },
      { $set: { currentNodeId: nodeId, status: 'running' } }
    );

    const EVENT_WAIT_TYPES = { wait_reply: 'reply', wait_payment: 'payment', wait_meeting: 'meeting', wait_deal_won: 'deal_won' };
    const isEventWait = Object.prototype.hasOwnProperty.call(EVENT_WAIT_TYPES, node.type);

    if (isEventWait && execution.context?.activeWait?.nodeId === nodeId) {
      // Re-entry via the queued delayed job. `resolved` distinguishes a stale
      // wakeup (resolveWait() already fired early and flagged it) from a
      // genuine timeout (still unresolved) — we can't just check whether
      // activeWait exists, since clearing it outright would make a stale
      // wakeup indistinguishable from a brand-new first entry to this node.
      if (execution.context.activeWait.resolved) {
        await SequenceExecution.updateOne({ _id: executionId }, { $unset: { 'context.activeWait': 1 } });
        return;
      }
      const target = getOutgoingEdges({ edges: graph.edges }, nodeId, 'timeout')[0]?.target
        || getOutgoingEdges({ edges: graph.edges }, nodeId)[0]?.target;
      await SequenceExecution.updateOne(
        { _id: executionId },
        {
          $unset: { 'context.activeWait': 1 },
          $push: { logs: { nodeId, nodeType: node.type, status: 'success', message: 'Wait timed out — no event received', executedAt: new Date() } },
        }
      );
      if (target) {
        await sequenceEngine.processNode(executionId, target);
      } else {
        await sequenceEngine.completeExecution(execution, 'completed');
      }
      return;
    }

    if (node.type === 'delay' || node.type === 'wait_until' || node.type?.startsWith('wait_')) {
      let delayMs = node.type === 'delay'
        ? ((node.data?.delayHours || 0) * 3600000) + ((node.data?.delayMinutes || 0) * 60000)
        : node.type === 'wait_until'
          ? Math.max(0, new Date(node.data?.datetime || Date.now()).getTime() - Date.now())
          : (node.data?.timeoutHours || 72) * 3600000;
      delayMs = adjustDelayForBusinessHours(business, delayMs);

      if (isEventWait) {
        // Re-enter THIS node after the delay (rather than jumping straight to
        // the next node) so we can tell a real timeout apart from an early
        // resolution that already happened in the meantime.
        await SequenceExecution.updateOne(
          { _id: executionId },
          {
            $set: { 'context.activeWait': { nodeId, waitType: EVENT_WAIT_TYPES[node.type], resolved: false, startedAt: new Date() }, status: 'waiting' },
            $push: { logs: { nodeId, nodeType: node.type, status: 'success', message: `Waiting for ${EVENT_WAIT_TYPES[node.type]} (or timeout)`, executedAt: new Date() } },
          }
        );
        await sequenceEngine.queueNode(executionId, nodeId, delayMs || 60000);
        return;
      }

      const nextEdges = getOutgoingEdges({ edges: graph.edges }, nodeId);
      const nextId = nextEdges[0]?.target;
      if (nextId) {
        await sequenceEngine.queueNode(executionId, nextId, delayMs || 60000);
        await SequenceExecution.updateOne(
          { _id: executionId },
          { $push: { logs: { nodeId, nodeType: node.type, status: 'success', message: 'Delay scheduled', executedAt: new Date() } }, $set: { status: 'waiting' } }
        );
      }
      return;
    }

    const execOpts = { testMode: execution.testMode, approved: execution.context?.approved };
    const { log, complete, error, pendingApproval, approval } = await executeNode(node, lead, business, execution, execOpts);

    if (pendingApproval) {
      await SequenceExecution.updateOne(
        { _id: executionId },
        {
          $push: { logs: log },
          $set: {
            status: 'pending_approval',
            pendingApproval: {
              nodeId,
              reason: approval?.reason || log.message,
              requestedAt: new Date(),
              approverRoles: approval?.approverRoles || ['admin', 'owner'],
            },
          },
        }
      );
      return;
    }

    await SequenceExecution.updateOne(
      { _id: executionId },
      { $push: { logs: log }, $set: { lastError: error || null } }
    );

    if (complete || node.type === 'end') {
      await sequenceEngine.completeExecution(execution, 'completed');
      return;
    }

    if (log.status === 'failed') {
      const updated = await SequenceExecution.findByIdAndUpdate(
        executionId,
        { $inc: { retryCount: 1 } },
        { new: true }
      );
      if ((updated?.retryCount || 0) >= 3) {
        await sequenceEngine.completeExecution(execution, 'failed', log.message);
        return;
      }
    }

    let branch;
    if (node.type === 'condition' || node.type === 'split') {
      branch = log.metadata?.branch === 'true' ? 'true' : 'false';
    }

    if (log.metadata?.goto) {
      await sequenceEngine.queueNode(executionId, log.metadata.goto, 0);
      return;
    }

    if (node.type === 'loop') {
      const ctx = execution.context || {};
      const loopCounts = { ...(ctx.loopCounts || {}) };
      const count = (loopCounts[node.id] || 0) + 1;
      loopCounts[node.id] = count;
      await SequenceExecution.updateOne({ _id: executionId }, { $set: { 'context.loopCounts': loopCounts } });
      const max = node.data?.maxIterations || node.data?.max || 10;
      if (count < max && !log.metadata?.breakLoop) {
        const loopEdge = getOutgoingEdges({ edges: graph.edges }, nodeId, 'loop')[0]
          || getOutgoingEdges({ edges: graph.edges }, nodeId)[0];
        if (loopEdge?.target) {
          await sequenceEngine.queueNode(executionId, loopEdge.target, 0);
          return;
        }
      }
    }

    if (log.metadata?.breakLoop) {
      const exitEdges = getOutgoingEdges({ edges: graph.edges }, nodeId, 'exit');
      const nextId = exitEdges[0]?.target;
      if (nextId) {
        await sequenceEngine.queueNode(executionId, nextId, 0);
        return;
      }
    }

    if (node.type === 'parallel_branch') {
      const branches = getOutgoingEdges({ edges: graph.edges }, nodeId);
      const parallelKey = nodeId;
      const ctx = execution.context || {};
      await SequenceExecution.updateOne(
        { _id: executionId },
        { $set: { [`context.parallel.${parallelKey}`]: { total: branches.length, completed: 0, branches: branches.map((b) => b.target) } } }
      );
      for (const edge of branches) {
        if (edge.target) await sequenceEngine.queueNode(executionId, edge.target, 0);
      }
      return;
    }

    if (node.type === 'merge' || node.type === 'wait_for_all') {
      const ctx = execution.context?.parallel || {};
      const keys = Object.keys(ctx);
      if (keys.length) {
        const key = keys[keys.length - 1];
        const state = { ...ctx[key], completed: (ctx[key]?.completed || 0) + 1 };
        await SequenceExecution.updateOne({ _id: executionId }, { $set: { [`context.parallel.${key}`]: state } });
        if (state.completed < state.total) {
          await SequenceExecution.updateOne({ _id: executionId }, { $set: { status: 'waiting' } });
          return;
        }
      }
    }

    const nextEdges = getOutgoingEdges({ edges: graph.edges }, nodeId, branch);
    const nextId = nextEdges[0]?.target;
    if (nextId) {
      await sequenceEngine.queueNode(executionId, nextId, 0);
    } else {
      await sequenceEngine.completeExecution(execution, 'completed');
    }
  },

  /**
   * Call when a real event happens for a lead (a reply, a payment, a booked
   * meeting, a won deal) so any sequence paused at the matching wait_* node
   * resumes immediately down its event branch instead of sitting through the
   * full timeout. This is what makes sequences adaptive to engagement rather
   * than running on a fixed schedule regardless of what the lead actually did.
   */
  async resolveWait(leadId, eventType) {
    // Atomic find+flip so a duplicate/concurrent event can't resolve the same
    // wait twice (e.g. two inbound messages arriving close together).
    const execution = await SequenceExecution.findOneAndUpdate(
      {
        leadId,
        status: 'waiting',
        'context.activeWait.waitType': eventType,
        'context.activeWait.resolved': false,
      },
      { $set: { 'context.activeWait.resolved': true } },
    );
    if (!execution) return null;

    const sequence = await AutomationSequence.findById(execution.sequenceId);
    if (!sequence) return null;

    const graph = getWorkflowGraph(sequence, execution);
    const nodeId = execution.context.activeWait.nodeId;
    // 'event' is the universal label for "the awaited thing happened" across all
    // wait_* types (reply, payment, meeting, deal_won) — 'replied' also accepted
    // for sequences built before this was generalized beyond wait_reply.
    const target = getOutgoingEdges({ edges: graph.edges }, nodeId, 'event')[0]?.target
      || getOutgoingEdges({ edges: graph.edges }, nodeId, 'replied')[0]?.target
      || getOutgoingEdges({ edges: graph.edges }, nodeId)[0]?.target;

    await SequenceExecution.updateOne(
      { _id: execution._id },
      {
        $push: { logs: { nodeId, nodeType: 'event_received', status: 'success', message: `Event received: ${eventType} — resuming early`, executedAt: new Date() } },
      }
    );

    if (target) {
      await sequenceEngine.processNode(execution._id, target);
    } else {
      await sequenceEngine.completeExecution(execution, 'completed');
    }
    return execution._id;
  },

  async queueNode(executionId, nodeId, delayMs = 0) {
    const { queueWorkflowNode } = await import('@/lib/queue');
    await queueWorkflowNode(executionId, nodeId, delayMs);
  },

  async completeExecution(execution, status, error = null) {
    const started = execution.startedAt || execution.createdAt;
    const durationMs = started ? Date.now() - new Date(started).getTime() : 0;

    await SequenceExecution.updateOne(
      { _id: execution._id },
      {
        $set: {
          status,
          completedAt: status === 'completed' ? new Date() : undefined,
          failedAt: status === 'failed' ? new Date() : undefined,
          lastError: error,
          currentNodeId: null,
          durationMs,
        },
      }
    );

    if (!execution.testMode) {
      await Lead.findByIdAndUpdate(execution.leadId, {
        $unset: { activeSequenceId: 1, sequenceStepIndex: 1, activeExecutionId: 1 },
      });

      const inc = { 'analytics.activeRuns': -1 };
      if (status === 'completed') inc['analytics.completed'] = 1;
      if (status === 'failed') inc['analytics.failed'] = 1;

      await AutomationSequence.updateOne({ _id: execution.sequenceId }, { $inc: inc });
    }
  },

  /**
   * Called from automationEngine when sequence_runner rule matches trigger
   */
  async tryStartFromRule(lead, trigger) {
    const rules = await AutomationRule.find({
      businessId: lead.businessId,
      type: 'sequence_runner',
      enabled: true,
      [`triggers.${trigger}`]: true,
    });

    for (const rule of rules) {
      const sequenceId = rule.config?.sequenceId;
      if (!sequenceId) continue;
      const sequence = await AutomationSequence.findById(sequenceId);
      if (!sequence || sequence.status !== 'active' || sequence.enabled === false) continue;
      const expectedTrigger = TRIGGER_TO_ENGINE[sequence.triggerType];
      if (expectedTrigger && expectedTrigger !== trigger) continue;
      await sequenceEngine.startWorkflow(lead, sequenceId, rule._id);
      await AutomationRule.updateOne(
        { _id: rule._id },
        { $inc: { executionCount: 1 }, $set: { lastExecutedAt: new Date() } }
      );
    }
  },

  /** Start active sequences matching a sequence triggerType directly */
  async tryStartByTriggerType(lead, triggerType) {
    const sequences = await AutomationSequence.find({
      businessId: lead.businessId,
      triggerType,
      status: 'active',
      enabled: { $ne: false },
    }).lean();

    for (const sequence of sequences) {
      if (lead.activeSequenceId?.toString() === sequence._id.toString()) continue;
      if (!sequenceMatchesLead(sequence, lead)) continue;
      // Never enrol the same lead twice in the same sequence (re-enquiries, retries).
      const already = await SequenceExecution.exists({ sequenceId: sequence._id, leadId: lead._id, testMode: { $ne: true } });
      if (already) continue;
      await sequenceEngine.startWorkflow(lead, sequence._id);
    }
  },

  /** Run workflow in test mode — dry-run without side effects */
  async runTestWorkflow(leadId, sequenceId, options = {}) {
    const lead = await Lead.findById(leadId);
    const sequence = await AutomationSequence.findById(sequenceId);
    if (!lead || !sequence) return null;
    return sequenceEngine.startWorkflow(lead, sequenceId, null, {
      testMode: true,
      debugMode: options.debugMode !== false,
      context: options.context || {},
    });
  },

  /**
   * Handle an inbound customer reply for a lead that may be enrolled in a
   * linear sequence, applying smart branching rules on the step that was
   * last sent to them.
   *
   * Called from leadManager after each inbound WhatsApp message. Silent
   * no-op if the lead isn't enrolled or their execution isn't in a state
   * that should react to replies. Never throws — errors log and swallow so
   * ingestion isn't blocked.
   *
   * Priority order when a rule matches:
   *   1. exit keyword hit → EXIT (opted out / cancelled)
   *   2. isGoal + reply    → mark goal + EXIT
   *   3. pauseOnReply      → PAUSE for human agent
   *   4. exitOnAnyReply    → EXIT (generic "stop chasing" step)
   */
  async handleInboundReply({ leadId, businessId, body }) {
    try {
      if (!leadId) return;
      const lead = await Lead.findById(leadId).select('activeExecutionId activeSequenceId sequenceStepIndex').lean();
      if (!lead?.activeExecutionId || !lead?.activeSequenceId) return;

      const [execution, sequence] = await Promise.all([
        SequenceExecution.findById(lead.activeExecutionId),
        AutomationSequence.findById(lead.activeSequenceId).lean(),
      ]);
      if (!execution || !sequence) return;
      // Only react while the execution is still in play — completed /
      // cancelled / already-paused executions shouldn't re-branch on stray
      // replies days later.
      if (!['running', 'waiting', 'pending'].includes(execution.status)) return;

      // Linear sequences use sequence.steps + Lead.sequenceStepIndex.
      // Graph sequences would need node-level branching — that's Bet #1.5,
      // deferred until we see it needed in real customer usage.
      const steps = sequence.steps || [];
      if (!steps.length) return;
      const idx = Math.max(0, Math.min(steps.length - 1, lead.sequenceStepIndex || 0));
      const currentStep = steps[idx];
      if (!currentStep) return;

      const reply = String(body || '').trim();
      const replyLower = reply.toLowerCase();
      const matchedKeyword = (currentStep.exitKeywords || [])
        .map((k) => String(k || '').trim().toLowerCase())
        .filter(Boolean)
        .find((k) => replyLower === k || replyLower.includes(k));

      let action = null;
      if (matchedKeyword) action = 'exit_keyword';
      else if (currentStep.isGoal && reply) action = 'goal_reached';
      else if (currentStep.pauseOnReply && reply) action = 'pause';
      else if (currentStep.exitOnAnyReply && reply) action = 'exit_any_reply';

      if (!action) return;

      const analyticsInc = { 'analytics.responded': 1 };
      let newStatus = execution.status;
      let logMessage = '';

      if (action === 'exit_keyword') {
        newStatus = 'cancelled';
        analyticsInc['analytics.activeRuns'] = -1;
        analyticsInc['analytics.optedOut'] = 1;
        logMessage = `Exited on keyword "${matchedKeyword}"`;
      } else if (action === 'goal_reached') {
        newStatus = 'completed';
        analyticsInc['analytics.activeRuns'] = -1;
        analyticsInc['analytics.goalReached'] = 1;
        analyticsInc['analytics.completed'] = 1;
        logMessage = `Goal reached — customer replied to goal step`;
      } else if (action === 'pause') {
        newStatus = 'paused';
        analyticsInc['analytics.pausedForAgent'] = 1;
        logMessage = 'Paused — customer replied, routed to human agent';
      } else if (action === 'exit_any_reply') {
        newStatus = 'cancelled';
        analyticsInc['analytics.activeRuns'] = -1;
        logMessage = 'Exited — customer replied (exitOnAnyReply)';
      }

      await SequenceExecution.updateOne(
        { _id: execution._id },
        {
          $set: {
            status: newStatus,
            ...(newStatus === 'completed' || newStatus === 'cancelled' ? { completedAt: new Date() } : {}),
          },
          $push: {
            logs: {
              nodeId: currentStep._id?.toString() || `step_${idx}`,
              nodeType: 'branch',
              status: 'success',
              message: logMessage,
              metadata: { action, matchedKeyword: matchedKeyword || null, reply: reply.slice(0, 200) },
              executedAt: new Date(),
            },
          },
        }
      );

      await AutomationSequence.updateOne({ _id: sequence._id }, { $inc: analyticsInc });

      // Clear the lead's active sequence pointers only if we exited / completed.
      // Pause keeps them attached so the agent can see + resume.
      if (newStatus === 'cancelled' || newStatus === 'completed') {
        await Lead.updateOne(
          { _id: leadId },
          { $set: { activeSequenceId: null, activeExecutionId: null, sequenceStepIndex: 0 } }
        );
      }
    } catch (err) {
      console.error('[sequenceEngine] handleInboundReply error:', err.message);
    }
  },
};

export default sequenceEngine;
