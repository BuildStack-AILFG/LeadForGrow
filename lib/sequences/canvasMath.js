/**
 * Pure geometry / rules for the sequence builder canvas (no React, no DOM), so they can be unit tested.
 */
import { isBranchNode, nextBranchLabel } from './edges';
import { getNodeDef } from './constants';

export const NODE_W = 220;
export const NODE_H = 72;
/** MIME type used when dragging a node type from the library onto the canvas. */
export const NODE_DRAG_MIME = 'application/x-lfg-sequence-node';
/** Pointer must travel this many px before a press on a node becomes a drag (a plain click must not move it). */
export const DRAG_THRESHOLD_PX = 4;

const GAP_Y = 60;

/** Screen (client) point -> canvas coordinates, undoing the canvas pan and zoom. */
export function screenToCanvas({ clientX, clientY }, rect, pan, zoom) {
  const z = zoom || 1;
  return { x: (clientX - rect.left - pan.x) / z, y: (clientY - rect.top - pan.y) / z };
}

/** Top-left position for a node dropped so that its centre is under the cursor. */
export function dropPosition(point, rect, pan, zoom) {
  const p = screenToCanvas(point, rect, pan, zoom);
  return { x: Math.max(0, Math.round(p.x - NODE_W / 2)), y: Math.max(0, Math.round(p.y - NODE_H / 2)) };
}

export function hasDragged(start, current, threshold = DRAG_THRESHOLD_PX) {
  return Math.hypot(current.x - start.x, current.y - start.y) >= threshold;
}

const isTrigger = (n) => String(n?.type || '').startsWith('trigger_');

/**
 * Where a node added with a click goes: directly below the selected node, else below the lowest node,
 * else at the default start. Never on top of another node.
 */
export function nextNodePosition(nodes = [], selectedId = null) {
  const list = nodes.filter((n) => n?.position);
  const selected = list.find((n) => n.id === selectedId);
  const anchor = selected || list.reduce((low, n) => (!low || n.position.y > low.position.y ? n : low), null);
  if (!anchor) return { x: 280, y: 80 };

  const x = anchor.position.x;
  let y = anchor.position.y + NODE_H + GAP_Y;
  const overlaps = (yy) => list.some((n) => Math.abs(n.position.x - x) < NODE_W && Math.abs(n.position.y - yy) < NODE_H + 10);
  let guard = 0;
  while (overlaps(y) && guard < 50) { y += NODE_H + GAP_Y; guard += 1; }
  return { x, y };
}

/**
 * Which node a library click should attach to when nothing is selected: the step that currently leads into
 * the End node (so the new step lands just before End), else the lowest non-End node, else null.
 */
export function defaultAnchorId(nodes = [], edges = []) {
  const end = nodes.find((n) => n.type === 'end');
  if (end) {
    const incoming = edges.filter((e) => e.target === end.id);
    if (incoming.length === 1 && nodes.some((n) => n.id === incoming[0].source)) return incoming[0].source;
  }
  const candidates = nodes.filter((n) => n.type !== 'end' && n.position);
  if (!candidates.length) return null;
  return candidates.reduce((low, n) => (n.position.y > low.position.y ? n : low)).id;
}

/**
 * Plan for "add this node after the selected one" (a click in the node library).
 *  - the node goes right below `sourceId`; everything below it moves down to make room
 *  - when the source has exactly ONE outgoing edge the new node is inserted INTO that path
 *    (source -> new -> old target). Without this, the default Trigger -> End link stays the first edge out of
 *    the trigger and the workflow ends before any added step runs.
 *  - End nodes and triggers are never chained (nothing leaves End, nothing enters a trigger).
 * Returns null when the source is unknown.
 */
export function planAddAfter({ nodes = [], edges = [], sourceId, newType }) {
  const source = nodes.find((n) => n.id === sourceId);
  if (!source?.position) return null;
  const step = NODE_H + GAP_Y;
  const position = { x: source.position.x, y: source.position.y + step };
  const shiftIds = nodes.filter((n) => n.id !== sourceId && n.position && n.position.y > source.position.y).map((n) => n.id);
  const chains = source.type !== 'end' && newType !== 'end' && !String(newType || '').startsWith('trigger_');
  const outgoing = edges.filter((e) => e.source === sourceId);
  return { position, shiftIds, shiftBy: step, chains, rewireEdgeId: chains && outgoing.length === 1 ? outgoing[0].id : null };
}

/**
 * Whether an edge source -> target is allowed: no self loops or duplicates, nothing flows INTO a trigger
 * (triggers have no input handle) and nothing flows OUT of an End node.
 */
export function canConnect(args) {
  return connectBlock(args) === null;
}

const nodeLabel = (node) => node?.data?.label || getNodeDef(node?.type)?.label || node?.type || 'This step';

/**
 * Why source -> target is NOT allowed, or null when it is. `message` is what to tell the user (null for
 * silent cases such as dropping a line back onto its own node) so a refused connection never just vanishes.
 */
export function connectBlock({ nodes = [], edges = [], source, target }) {
  if (!source || !target || source === target) return { code: 'invalid', message: null };
  const src = nodes.find((n) => n.id === source);
  const tgt = nodes.find((n) => n.id === target);
  if (!src || !tgt) return { code: 'unknown', message: null };
  if (isTrigger(tgt)) {
    return {
      code: 'into_trigger',
      message: `"${nodeLabel(tgt)}" is a trigger. A trigger starts a workflow, so nothing can be connected into it. To add a step, use an action instead (Actions → Send Email, Send WhatsApp…).`,
    };
  }
  if (src.type === 'end') return { code: 'from_end', message: 'End Workflow is the last step, so nothing can come out of it.' };
  if (edges.some((e) => e.source === source && e.target === target)) {
    return { code: 'duplicate', message: 'These two steps are already connected.' };
  }
  // An If / Else has exactly two exits (Yes, No).
  if (isBranchNode(src) && nextBranchLabel(edges.filter((e) => e.source === source)) === null) {
    return { code: 'branch_full', message: 'An If / Else has only two exits: Yes and No.' };
  }
  return null;
}

/** A workflow starts from exactly one trigger (the engine only reads the first one). */
export function hasTrigger(nodes = []) {
  return nodes.some(isTrigger);
}

export const TRIGGER_EXISTS_MESSAGE = (nodes = []) => {
  const t = nodes.find(isTrigger);
  return `This workflow already starts with the trigger "${nodeLabel(t)}". A workflow has one trigger: delete it first to use a different one, or add an action such as "Send Email" instead.`;
};

/** Cubic bezier from the bottom of one node to the top of the next. */
export function bezierPath(x1, y1, x2, y2) {
  const mid = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`;
}

/** Midpoint of that bezier (for a delete button); for this curve shape it is the plain average. */
export function edgeMidpoint(from, to) {
  return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
}

/** Point at parameter t (0..1) on the bezier above (used to put the Yes / No pill near the start of an edge). */
export function bezierPoint(from, to, t) {
  const mid = (from.y + to.y) / 2;
  const u = 1 - t;
  return {
    x: u * u * u * from.x + 3 * u * u * t * from.x + 3 * u * t * t * to.x + t * t * t * to.x,
    y: u * u * u * from.y + 3 * u * u * t * mid + 3 * u * t * t * mid + t * t * t * to.y,
  };
}
