/**
 * Sequence builder canvas: pure geometry / connection rules + real rendering of the canvas.
 * Run: node --test tests/sequence-canvas.test.js
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));
register(new URL('../scripts/test-jsx-hooks.mjs', import.meta.url));

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

let M, C, React, renderToStaticMarkup, WorkflowCanvas;
before(async () => {
  M = await import('../lib/sequences/canvasMath.js');
  C = await import('../lib/sequences/constants.js');
  ({ default: React } = await import('react'));
  ({ renderToStaticMarkup } = await import('react-dom/server'));
  ({ default: WorkflowCanvas } = await import('../app/automation/components/sequences/WorkflowCanvas.jsx'));
});

const n = (id, type, x, y) => ({ id, type, position: { x, y }, data: {} });
const e = (source, target, id = `e_${source}_${target}`) => ({ id, source, target });

// What the "blank" wizard template creates: trigger and End in the same column, joined by one edge.
const blank = () => ({
  nodes: [n('t', 'trigger_new_lead', 280, 80), n('end', 'end', 280, 280)],
  edges: [e('t', 'end')],
});

describe('coordinates', () => {
  const rect = { left: 100, top: 50 };
  it('screenToCanvas undoes pan and zoom', () => {
    assert.deepEqual(M.screenToCanvas({ clientX: 100, clientY: 50 }, rect, { x: 0, y: 0 }, 1), { x: 0, y: 0 });
    assert.deepEqual(M.screenToCanvas({ clientX: 400, clientY: 250 }, rect, { x: 40, y: 20 }, 1), { x: 260, y: 180 });
    assert.deepEqual(M.screenToCanvas({ clientX: 400, clientY: 250 }, rect, { x: 0, y: 0 }, 2), { x: 150, y: 100 });
  });

  it('a dropped node is centred on the cursor and never goes negative', () => {
    const p = M.dropPosition({ clientX: 500, clientY: 300 }, rect, { x: 0, y: 0 }, 1);
    assert.deepEqual(p, { x: 400 - M.NODE_W / 2, y: 250 - M.NODE_H / 2 });
    const corner = M.dropPosition({ clientX: 101, clientY: 51 }, rect, { x: 0, y: 0 }, 1);
    assert.ok(corner.x >= 0 && corner.y >= 0);
  });

  it('a click is not a drag until the pointer has travelled a few pixels', () => {
    assert.equal(M.hasDragged({ x: 10, y: 10 }, { x: 11, y: 11 }), false);
    assert.equal(M.hasDragged({ x: 10, y: 10 }, { x: 10, y: 20 }), true);
  });
});

describe('canConnect', () => {
  const { nodes, edges } = blank();
  const all = [...nodes, n('wa', 'send_whatsapp', 280, 180)];
  it('allows a normal connection', () => assert.equal(M.canConnect({ nodes: all, edges, source: 'wa', target: 'end' }), true));
  it('rejects self loops and duplicates', () => {
    assert.equal(M.canConnect({ nodes: all, edges, source: 'wa', target: 'wa' }), false);
    assert.equal(M.canConnect({ nodes: all, edges, source: 't', target: 'end' }), false);
  });
  it('nothing flows into a trigger, nothing flows out of End', () => {
    assert.equal(M.canConnect({ nodes: all, edges, source: 'wa', target: 't' }), false);
    assert.equal(M.canConnect({ nodes: all, edges, source: 'end', target: 'wa' }), false);
  });
  it('rejects unknown nodes', () => assert.equal(M.canConnect({ nodes: all, edges, source: 'x', target: 'wa' }), false));
});

describe('refused connections explain themselves', () => {
  // The reported case: dragging a line from "Lead Created" onto the "Email Sent" TRIGGER (meant: the Send Email action).
  const nodes = [n('t', 'trigger_new_lead', 280, 80), n('es', 'trigger_email_sent', 140, 230), n('end', 'end', 280, 430), n('se', 'send_email', 280, 230)];

  it('a line into a trigger is refused with a message that names it and points to the action', () => {
    const b = M.connectBlock({ nodes, edges: [], source: 't', target: 'es' });
    assert.equal(b.code, 'into_trigger');
    assert.ok(b.message.includes('"Email Sent"') && b.message.includes('trigger'));
    assert.ok(b.message.includes('Send Email'));
  });

  it('the Send Email action is accepted', () => assert.equal(M.connectBlock({ nodes, edges: [], source: 't', target: 'se' }), null));

  it('every refusal has a code, and only the silent cases have no message', () => {
    const edges = [e('t', 'se')];
    assert.equal(M.connectBlock({ nodes, edges, source: 'end', target: 'se' }).code, 'from_end');
    assert.equal(M.connectBlock({ nodes, edges, source: 't', target: 'se' }).code, 'duplicate');
    assert.ok(M.connectBlock({ nodes, edges, source: 't', target: 'se' }).message);
    assert.equal(M.connectBlock({ nodes, edges, source: 't', target: 't' }).message, null, 'dropping a line back on its own node is silent');
    const cond = [{ id: 'c', type: 'condition', position: { x: 0, y: 0 } }, ...nodes];
    const full = [e('c', 'se', 'a', { label: 'Yes' }), e('c', 'end', 'b', { label: 'No' })].map((x, i) => ({ ...x, label: i ? 'No' : 'Yes' }));
    assert.equal(M.connectBlock({ nodes: cond, edges: full, source: 'c', target: 'es' }).code, 'into_trigger');
    assert.equal(M.connectBlock({ nodes: [...cond, n('x', 'delay', 0, 0)], edges: full, source: 'c', target: 'x' }).code, 'branch_full');
  });

  it('canConnect is exactly "no block"', () => {
    assert.equal(M.canConnect({ nodes, edges: [], source: 't', target: 'se' }), true);
    assert.equal(M.canConnect({ nodes, edges: [], source: 't', target: 'es' }), false);
  });

  it('a second trigger is detected and explained', () => {
    assert.equal(M.hasTrigger(nodes), true);
    assert.equal(M.hasTrigger([n('end', 'end', 0, 0)]), false);
    assert.ok(M.TRIGGER_EXISTS_MESSAGE([n('t', 'trigger_new_lead', 0, 0)]).includes('Lead Created'));
  });

  it('the hook shows the reason, and refuses a second trigger however it is added', () => {
    const hook = read('app/automation/hooks/useSequencesWorkspace.js');
    assert.ok(/connectBlock\(\{[^}]*\}\);\s*if \(block\) \{\s*if \(block\.message\) toast\.error/.test(hook));
    assert.ok(hook.includes('const refuseSecondTrigger = '));
    const calls = hook.match(/if \(refuseSecondTrigger\(/g) || [];
    assert.equal(calls.length, 4, 'addNode + addNodeAfter + duplicateNode + pasteSelection');
  });

  it('while a line is dragged, nodes that cannot receive it fade', () => {
    assert.ok(read('app/automation/components/sequences/WorkflowCanvas.jsx').includes('dimmed={Boolean(preview)'));
    assert.ok(read('app/automation/components/sequences/SequenceNode.jsx').includes('opacity: dimmed ? 0.4 : 1'));
  });

  it('the library says which section starts a workflow and which does the work', () => {
    const side = read('app/automation/components/sequences/NodeSidebar.jsx');
    assert.ok(side.includes('one per workflow') && side.includes("hint: 'what it does'"));
  });
});

describe('adding from the library', () => {
  it('with nothing selected the default anchor is the step leading into End', () => {
    const { nodes, edges } = blank();
    assert.equal(M.defaultAnchorId(nodes, edges), 't');
    const three = [...nodes, n('wa', 'send_whatsapp', 280, 180)];
    assert.equal(M.defaultAnchorId(three, [e('t', 'wa'), e('wa', 'end')]), 'wa');
    assert.equal(M.defaultAnchorId([n('a', 'send_whatsapp', 0, 0), n('b', 'delay', 0, 300)], []), 'b');
    assert.equal(M.defaultAnchorId([], []), null);
  });

  it('inserts INTO the Trigger -> End path and makes room (the default flow must not end before the new step)', () => {
    const { nodes, edges } = blank();
    const plan = M.planAddAfter({ nodes, edges, sourceId: 't', newType: 'send_whatsapp' });
    assert.equal(plan.rewireEdgeId, 'e_t_end');
    assert.equal(plan.chains, true);
    assert.deepEqual(plan.shiftIds, ['end']);
    assert.deepEqual(plan.position, { x: 280, y: 80 + M.NODE_H + 60 });

    // Apply the plan the way the hook does and check the resulting graph.
    const node = { id: 'new', type: 'send_whatsapp', position: plan.position };
    const movedNodes = [...nodes.map((x) => (plan.shiftIds.includes(x.id) ? { ...x, position: { ...x.position, y: x.position.y + plan.shiftBy } } : x)), node];
    let next = edges.map((x) => (x.id === plan.rewireEdgeId ? { ...x, id: `e_new_${x.target}`, source: 'new' } : x));
    next = [...next, { id: 'e_t_new', source: 't', target: 'new' }];
    assert.deepEqual(next.map((x) => `${x.source}>${x.target}`).sort(), ['new>end', 't>new']);
    const byId = Object.fromEntries(movedNodes.map((x) => [x.id, x]));
    assert.ok(byId.end.position.y > byId.new.position.y + M.NODE_H, 'End sits below the new node, not on top of it');
  });

  it('does not chain into a trigger or after End, and leaves branching nodes alone', () => {
    const { nodes, edges } = blank();
    assert.equal(M.planAddAfter({ nodes, edges, sourceId: 't', newType: 'end' }).chains, false);
    assert.equal(M.planAddAfter({ nodes, edges, sourceId: 't', newType: 'trigger_lead_updated' }).chains, false);
    assert.equal(M.planAddAfter({ nodes, edges, sourceId: 'end', newType: 'delay' }).chains, false);
    const branching = [e('t', 'end'), e('t', 'x')];
    assert.equal(M.planAddAfter({ nodes, edges: branching, sourceId: 't', newType: 'delay' }).rewireEdgeId, null);
    assert.equal(M.planAddAfter({ nodes, edges, sourceId: 'missing', newType: 'delay' }), null);
  });

  it('nextNodePosition never lands on another node', () => {
    const { nodes } = blank();
    const p = M.nextNodePosition(nodes, 't');
    assert.ok(nodes.every((x) => Math.abs(x.position.x - p.x) >= M.NODE_W || Math.abs(x.position.y - p.y) >= M.NODE_H));
    assert.deepEqual(M.nextNodePosition([], null), { x: 280, y: 80 });
  });
});

describe('WorkflowCanvas rendering', () => {
  const html = (over = {}) => {
    const { nodes, edges } = blank();
    return renderToStaticMarkup(React.createElement(WorkflowCanvas, {
      nodes, edges, selectedNodeId: null, onSelectNode() {}, onMoveNode() {}, onConnect() {}, onDuplicate() {}, onDelete() {}, onUndo() {}, onRedo() {}, ...over,
    }));
  };

  it('draws an edge between two vertically aligned nodes with a plain colour and an arrow', () => {
    const out = html();
    assert.ok(/<path d="M 390 152[^"]*"[^>]*stroke="#6366f1"[^>]*marker-end="url\(#edgeArrow\)"/.test(out), 'visible edge');
    // A gradient stroke has a zero-width bounding box on a perfectly vertical line, so nothing is painted.
    assert.ok(!out.includes('url(#edgeGrad)'));
    assert.ok(!out.includes('objectBoundingBox'));
  });

  it('tags every node for connection hit-testing and gives only non-End nodes an output handle', () => {
    const out = html();
    assert.equal((out.match(/data-node-id=/g) || []).length, 2);
    assert.equal((out.match(/data-connect-handle/g) || []).length, 1);
  });

  it('marks the two exits of an If / Else with Yes / No pills (an unlabelled exit reads as Yes)', () => {
    const nodes = [n('t', 'trigger_new_lead', 280, 40), n('c', 'condition', 280, 180), n('a', 'send_whatsapp', 120, 340), n('b', 'send_whatsapp', 440, 340)];
    const edges = [e('t', 'c'), e('c', 'a', 'e1'), { ...e('c', 'b', 'e2'), label: 'No' }];
    const out = html({ nodes, edges });
    assert.equal((out.match(/data-branch-pill="yes"/g) || []).length, 1);
    assert.equal((out.match(/data-branch-pill="no"/g) || []).length, 1);
    assert.ok(!html().includes('data-branch-pill'), 'no pills on an ordinary edge');
  });

  it('shows Duplicate / Delete for the selected node without needing hover (touchscreen laptops have none)', () => {
    const out = html({ selectedNodeId: 'end' });
    assert.ok(out.includes('title="Duplicate"') && out.includes('title="Delete"'));
    assert.ok(!/opacity-0[^"]*group-hover:opacity-100/.test(out.slice(out.indexOf('title="Duplicate"') - 300, out.indexOf('title="Delete"') + 50)));
  });
});

describe('source guards for the drag / pan bugs', () => {
  const node = read('app/automation/components/sequences/SequenceNode.jsx');
  const canvas = read('app/automation/components/sequences/WorkflowCanvas.jsx');
  const side = read('app/automation/components/sequences/NodeSidebar.jsx');
  const flow = read('app/automation/components/sequences/SequencesWorkspace.jsx');

  it('the node has no framer-motion layout animation (it made dragging lag and jump inside the scaled layer)', () => {
    assert.ok(!/<motion\.div[^>]*\blayout\b/.test(node));
  });

  it('empty-space mousedown pans: it no longer depends on hitting the bottom background layer', () => {
    assert.ok(!canvas.includes('data-canvas-bg'));
    assert.ok(/gesture\.current = \{ type: 'pan'/.test(canvas));
  });

  it('a press only becomes a node drag after the threshold, with one undo step', () => {
    assert.ok(canvas.includes('hasDragged(') && canvas.includes('begin?.()'));
  });

  it('library items are draggable and the canvas accepts the drop', () => {
    assert.ok(side.includes('draggable') && side.includes('NODE_DRAG_MIME'));
    assert.ok(canvas.includes('onDrop=') && canvas.includes('dropPosition('));
    assert.ok(flow.includes('onDropNode='));
  });

  it('connections can be drawn by dragging and removed again', () => {
    assert.ok(canvas.includes("type: 'connect'") && canvas.includes('canConnect('));
    assert.ok(flow.includes('onDeleteEdge={ws.removeEdge}'));
  });

  it('the hook only accepts valid connections', () => {
    const hook = read('app/automation/hooks/useSequencesWorkspace.js');
    assert.ok(/const connectNodes[\s\S]{0,200}connectBlock\(/.test(hook));
    assert.ok(hook.includes('removeEdge') && hook.includes('addNodeAfter'));
  });

  it('constants still create a valid trigger and End node used by these tests', () => {
    assert.equal(C.createNode('end', { x: 0, y: 0 }).type, 'end');
    assert.ok(C.createNode('trigger_new_lead', { x: 0, y: 0 }).type.startsWith('trigger_'));
  });
});
