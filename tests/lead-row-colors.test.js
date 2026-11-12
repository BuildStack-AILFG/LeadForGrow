/**
 * Lead row colors: Light + Strong swatch sets, readable text, stronger dark-mode wash.
 * Run: node --test tests/lead-row-colors.test.js
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));
register(new URL('../scripts/test-jsx-hooks.mjs', import.meta.url));

let C, U, React, renderToStaticMarkup, Swatches;
before(async () => {
  C = await import('../app/automation/components/leads/constants.js');
  U = await import('../app/automation/components/leads/utils.js');
  ({ default: React } = await import('react'));
  ({ renderToStaticMarkup } = await import('react-dom/server'));
  ({ default: Swatches } = await import('../app/automation/components/leads/RowColorSwatches.jsx'));
});

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

describe('lead row colors', () => {
  it('offers a Light and a Strong group, all ids and values unique', () => {
    assert.deepEqual(C.LEAD_ROW_COLOR_GROUPS.map((g) => g.id), ['light', 'strong']);
    assert.ok(C.LEAD_ROW_COLORS_STRONG.length >= 10);
    const all = C.LEAD_ROW_COLORS;
    assert.equal(new Set(all.map((c) => c.id)).size, all.length);
    assert.equal(new Set(all.map((c) => c.value)).size, all.length);
  });

  it('strong colors are darker than their light counterparts but keep dark text readable', () => {
    for (const s of C.LEAD_ROW_COLORS_STRONG) {
      const light = C.LEAD_ROW_COLORS_LIGHT.find((l) => l.id === s.id.replace('-strong', ''));
      assert.ok(light, `light pair for ${s.id}`);
      assert.ok(luminance(s.value) < luminance(light.value), `${s.id} darker than ${light.id}`);
      assert.ok(contrast(s.value, '#0A0B10') >= 7, `${s.id} text contrast`);
    }
  });

  it('dark mode draws strong colors as a heavier wash than light ones', () => {
    assert.match(U.darkRowTint('#fef3c7'), /, 0\.15\)$/);
    assert.match(U.darkRowTint('#fcd34d'), /, 0\.32\)$/);
    assert.match(U.darkRowTint('#ffffff'), /, 0\.06\)$/);
    const style = U.getLeadRowBackgroundStyle({ rowColor: '#93c5fd' });
    assert.equal(style.backgroundColor, 'light-dark(#93c5fd, rgba(147, 197, 253, 0.32))');
  });

  it('renders both groups with labelled swatches and marks the current one', () => {
    const html = renderToStaticMarkup(React.createElement(Swatches, { currentColor: '#fcd34d', onSelect: () => {} }));
    assert.match(html, />Light</);
    assert.match(html, />Strong</);
    assert.equal((html.match(/<button/g) || []).length, C.LEAD_ROW_COLORS.length);
    assert.match(html, /aria-label="Strong amber" aria-pressed="true"/);
  });

  it('both pickers use the shared swatches', async () => {
    const fs = await import('node:fs');
    for (const f of ['LeadColorPicker.jsx', 'BulkActionsBar.jsx']) {
      const src = fs.readFileSync(new URL(`../app/automation/components/leads/${f}`, import.meta.url), 'utf8');
      assert.match(src, /<RowColorSwatches/, f);
    }
  });
});
