/**
 * Edge routing rules shared by the sequence engine (server) and the builder canvas (client).
 * Pure functions: no models, no DOM.
 *
 * A condition / split node has two exits. The engine follows the "Yes" exit when the condition passes
 * (branch 'true') and the "No" exit when it fails (branch 'false'). An exit is identified by the edge label
 * ('Yes' / 'No', case-insensitive; 'true' / 'false' are accepted too) or by sourceHandle. An UNLABELLED edge
 * has always meant the Yes exit, and still does.
 */

const norm = (label) => String(label ?? '').trim().toLowerCase();

export const isYesEdge = (e) => {
  const l = norm(e?.label);
  return l === 'yes' || l === 'true' || e?.sourceHandle === 'true';
};

export const isNoEdge = (e) => {
  const l = norm(e?.label);
  return l === 'no' || l === 'false' || e?.sourceHandle === 'false';
};

/** Nodes with a Yes / No exit. */
export const isBranchNode = (node) => node?.type === 'condition' || node?.type === 'split';

/** Outgoing edges of `nodeId` that apply for `branch` ('true' / 'false' after a condition, 'timeout' / 'loop' / … otherwise). */
export function getOutgoingEdges(sequence, nodeId, branch) {
  const edges = sequence.edges || [];
  return edges.filter((e) => {
    if (e.source !== nodeId) return false;
    if (branch === 'true') return isYesEdge(e) || (!isNoEdge(e) && !norm(e.label));
    if (branch === 'false') return isNoEdge(e);
    if (branch && e.label) return norm(e.label) === norm(branch);
    return true;
  });
}

/**
 * Label for the next edge drawn out of a condition / split node: 'Yes' first, then 'No', then null
 * (both exits are taken). An existing unlabelled edge counts as the Yes exit.
 */
export function nextBranchLabel(outgoing = []) {
  const hasYes = outgoing.some((e) => isYesEdge(e) || (!isNoEdge(e) && !norm(e.label)));
  const hasNo = outgoing.some(isNoEdge);
  if (!hasYes) return 'Yes';
  if (!hasNo) return 'No';
  return null;
}

/**
 * Flip an edge between Yes and No. If the node's other exit has the opposite label the two swap, so the
 * node never ends up with two Yes or two No exits.
 */
export function flipBranchLabel(edges = [], edgeId) {
  const edge = edges.find((e) => e.id === edgeId);
  if (!edge) return edges;
  const wasYes = isYesEdge(edge) || (!isNoEdge(edge) && !norm(edge.label));
  const to = wasYes ? 'No' : 'Yes';
  return edges.map((e) => {
    if (e.id === edgeId) return { ...e, label: to, sourceHandle: undefined };
    if (e.source === edge.source && e.id !== edgeId) {
      const otherIsYes = isYesEdge(e) || (!isNoEdge(e) && !norm(e.label));
      if (otherIsYes !== wasYes) return { ...e, label: wasYes ? 'Yes' : 'No', sourceHandle: undefined };
    }
    return e;
  });
}
