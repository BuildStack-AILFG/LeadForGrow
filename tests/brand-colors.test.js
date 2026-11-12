/**
 * Green + gold brand palette: tokens exist in both themes and gold text stays readable.
 * Run: node --test tests/brand-colors.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

function lum(hex) {
  const n = parseInt(hex.slice(1, 7), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
// Definitions in file order: the light :root block comes first, the .dark block second.
const defs = [...css.matchAll(/--(gold[a-z-]*):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2]]);

describe('gold tokens', () => {
  const light = Object.fromEntries(defs.slice(0, 5));
  const dark = Object.fromEntries(defs.slice(5, 10));
  it('has exactly one light and one dark set', () => assert.equal(defs.length, 10));

  it('defined in light and dark and mapped to Tailwind', () => {
    for (const k of ['gold', 'gold-hover', 'gold-subtle', 'gold-line', 'gold-text']) {
      assert.ok(light[k], `light ${k}`);
      assert.ok(dark[k], `dark ${k}`);
    }
    for (const k of ['gold', 'gold-subtle', 'gold-line', 'gold-fg']) assert.match(css, new RegExp(`--color-${k}: var\\(`));
  });

  it('gold text is readable (AA) on white, on its own tint, and in dark mode', () => {
    assert.ok(ratio(light['gold-text'], '#FFFFFF') >= 4.5);
    assert.ok(ratio(light['gold-text'], light['gold-subtle']) >= 4.5);
    assert.ok(ratio(dark['gold-text'], dark['gold-subtle']) >= 4.5);
  });

  it('is used in the shared shell: active nav marker, metric strips, tabs, badges', () => {
    assert.match(read('app/automation/components/layout/SidebarItem.jsx'), /bg-gold/);
    assert.match(read('app/components/ui/MetricStrip.jsx'), /var\(--gold\)/);
    assert.match(read('app/components/ui/Tabs.jsx'), /border-gold/);
    assert.match(read('app/components/ui/Badge.jsx'), /gold: 'bg-gold-subtle text-gold-fg'/);
  });
});
