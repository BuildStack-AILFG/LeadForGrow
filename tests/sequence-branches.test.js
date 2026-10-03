/**
 * If / Else routing: the engine must follow a labelled "Yes" edge when the condition passes, and the builder
 * must be able to draw / label the two exits.
 * Run: node --test tests/sequence-branches.test.js
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

let E, M, T;
before(async () => {
  E = await import('../lib/sequences/edges.js');
  M = await import('../lib/sequences/canvasMath.js');
  T = await import('../lib/sequences/templates.js');
});

const edge = (id, source, target, extra = {}) => ({ id, source, target, ...extra });
const targets = (edges, id, branch) => E.getOutgoingEdges({ edges }, id, branch).map((e) => e.target);

// The routing the engine had before this fix (label compared with the branch name BEFORE the yes/no mapping).
const legacyGetOutgoingEdges = (sequence, nodeId, branch) => (sequence.edges || []).filter((e) => {
  if (e.source !== nodeId) return false;
  if (branch && e.label) return e.label.toLowerCase() === branch.toLowerCase();
  if (branch === 'false') return e.label?.toLowerCase() === 'no' || e.sourceHandle === 'false';
  if (branch === 'true') return !e.label || e.label?.toLowerCase() === 'yes' || e.sourceHandle === 'true';
  return true;
});

describe('getOutgoingEdges after a condition', () => {
  const labelled = [edge('a', 'c', 'yesNode', { label: 'Yes' }), edge('b', 'c', 'noNode', { label: 'No' })];

  it('follows the Yes edge when the condition passes and the No edge when it fails', () => {
    assert.deepEqual(targets(labelled, 'c', 'true'), ['yesNode']);
    assert.deepEqual(targets(labelled, 'c', 'false'), ['noNode']);
  });

  it('the old routing dropped both exits (proves the test catches the bug)', () => {
    assert.deepEqual(legacyGetOutgoingEdges({ edges: labelled }, 'c', 'true').map((e) => e.target), []);
    assert.deepEqual(legacyGetOutgoingEdges({ edges: labelled }, 'c', 'false').map((e) => e.target), []);
  });

  it('labels are case-insensitive and true / false labels still work', () => {
    const edges = [edge('a', 'c', 'y', { label: 'YES' }), edge('b', 'c', 'n', { label: 'false' })];
    assert.deepEqual(targets(edges, 'c', 'true'), ['y']);
    assert.deepEqual(targets(edges, 'c', 'false'), ['n']);
  });

  it('an unlabelled edge is still the Yes exit (existing sequences keep working)', () => {
    const edges = [edge('a', 'c', 'only')];
    assert.deepEqual(targets(edges, 'c', 'true'), ['only']);
    assert.deepEqual(targets(edges, 'c', 'false'), []);
  });

  it('sourceHandle still identifies an exit', () => {
    const edges = [edge('a', 'c', 'y', { sourceHandle: 'true' }), edge('b', 'c', 'n', { sourceHandle: 'false' })];
    assert.deepEqual(targets(edges, 'c', 'true'), ['y']);
    assert.deepEqual(targets(edges, 'c', 'false'), ['n']);
  });

  it('other branches and plain nodes behave as before', () => {
    const edges = [edge('a', 'w', 'onTimeout', { label: 'timeout' }), edge('b', 'w', 'next')];
    assert.deepEqual(targets(edges, 'w', 'timeout').sort(), ['next', 'onTimeout']);
    assert.deepEqual(targets(edges, 'w').sort(), ['next', 'onTimeout']);
    assert.deepEqual(targets(edges, 'other'), []);
  });

  it('a real template that branches now routes both ways', () => {
    const tpl = T.SEQUENCE_TEMPLATES.find((t) => {
      const g = t.build?.();
      return g?.nodes?.some((n) => n.type === 'condition') && g.edges.some((e) => e.label === 'Yes') && g.edges.some((e) => e.label === 'No');
    });
    assert.ok(tpl, 'a template with a Yes / No condition exists');
    const g = tpl.build();
    const cond = g.nodes.find((n) => n.type === 'condition');
    const yes = targets(g.edges, cond.id, 'true');
    const no = targets(g.edges, cond.id, 'false');
    assert.equal(yes.length, 1);
    assert.equal(no.length, 1);
    assert.notEqual(yes[0], no[0]);
  });

  it('the executor re-exports the shared routing', () => {
    assert.ok(/export \{ getOutgoingEdges \} from '\.\/edges'/.test(read('lib/sequences/executor.js')));
  });
});

describe('labelling the exits from the builder', () => {
  it('the first exit is Yes, the second No, then both are taken', () => {
    assert.equal(E.nextBranchLabel([]), 'Yes');
    assert.equal(E.nextBranchLabel([edge('a', 'c', 'x', { label: 'Yes' })]), 'No');
    assert.equal(E.nextBranchLabel([edge('a', 'c', 'x', { label: 'No' })]), 'Yes');
    assert.equal(E.nextBranchLabel([edge('a', 'c', 'x')]), 'No', 'an existing unlabelled edge counts as Yes');
    assert.equal(E.nextBranchLabel([edge('a', 'c', 'x', { label: 'Yes' }), edge('b', 'c', 'y', { label: 'No' })]), null);
  });

  it('an If / Else cannot get a third exit; other nodes can branch freely', () => {
    const nodes = [{ id: 'c', type: 'condition' }, { id: 'a', type: 'send_whatsapp' }, { id: 'b', type: 'send_whatsapp' }, { id: 'd', type: 'send_whatsapp' }];
    const two = [edge('1', 'c', 'a', { label: 'Yes' }), edge('2', 'c', 'b', { label: 'No' })];
    assert.equal(M.canConnect({ nodes, edges: two, source: 'c', target: 'd' }), false);
    assert.equal(M.canConnect({ nodes, edges: [two[0]], source: 'c', target: 'b' }), true);
    const plain = [{ id: 'p', type: 'send_whatsapp' }, ...nodes.slice(1)];
    assert.equal(M.canConnect({ nodes: plain, edges: [edge('1', 'p', 'a'), edge('2', 'p', 'b')], source: 'p', target: 'd' }), true);
  });

  it('flipping an exit swaps it with the other exit, so there are never two Yes or two No', () => {
    const edges = [edge('1', 'c', 'a', { label: 'Yes' }), edge('2', 'c', 'b', { label: 'No' })];
    const flipped = E.flipBranchLabel(edges, '1');
    assert.equal(flipped.find((x) => x.id === '1').label, 'No');
    assert.equal(flipped.find((x) => x.id === '2').label, 'Yes');
    const alone = E.flipBranchLabel([edge('1', 'c', 'a')], '1');
    assert.equal(alone[0].label, 'No');
    assert.equal(E.flipBranchLabel(edges, 'missing'), edges);
  });

  it('the pill position is on the bezier between the two nodes', () => {
    const from = { x: 100, y: 100 };
    const to = { x: 300, y: 400 };
    const p = M.bezierPoint(from, to, 0.5);
    assert.deepEqual(p, M.edgeMidpoint(from, to));
    assert.deepEqual(M.bezierPoint(from, to, 0), from);
    assert.deepEqual(M.bezierPoint(from, to, 1), to);
  });

  it('the hook labels new exits and the canvas shows the pills', () => {
    const hook = read('app/automation/hooks/useSequencesWorkspace.js');
    assert.ok(/nextBranchLabel\(draftEdges\.filter/.test(hook) && hook.includes('flipEdgeLabel'));
    const canvas = read('app/automation/components/sequences/WorkflowCanvas.jsx');
    assert.ok(canvas.includes('data-branch-pill') && canvas.includes('onFlipEdgeLabel'));
  });
});
