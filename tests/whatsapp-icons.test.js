/**
 * Anywhere the UI says "WhatsApp", the icon must be the real WhatsApp mark (chat/BrandIcons.jsx), not lucide's generic
 * MessageCircle / MessageSquare chat bubble. This scans app/ for a generic bubble within 3 lines of the word WhatsApp.
 * Genuinely generic chat concepts are allow-listed below (empty inbox illustration, "Two-way messaging", web chat, ...).
 * Run: node --test tests/whatsapp-icons.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const ALLOWED = [
  ['app/automation/chat/page.js', 'w-8 h-8 text-slate-300'],                 // empty-inbox illustration
  ['app/automation/settings/channels/page.js', 'Two-way messaging'],         // a capability, not the brand
  ['app/components/IndustryTemplate.jsx', 'icon={MessageSquare}'],           // "Nurture" benefit card
  ['app/components/landing/PremiumHero.jsx', "key: 'web'"],                  // website chat widget
  ['app/components/landing/PremiumHero-Life.jsx', "key: 'web'"],
  ['app/components/landing/WhatsAppAutomationSection.jsx', 'Team inbox'],    // shared inbox feature
  ['app/automation/components/sequences/ExecutionLogs.jsx', "includes('ai_')"], // AI steps that are not WhatsApp
  ['app/automation/components/chat/BrandIcons.jsx', 'generic MessageCircle'], // the doc comment itself
];

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (e.name === 'node_modules' || e.name === '.next') continue; walk(p, out); }
    else if (/\.(jsx|js)$/.test(e.name)) out.push(p);
  }
  return out;
}

function offenders() {
  const found = [];
  for (const file of walk(join(ROOT, 'app'))) {
    const rel = relative(ROOT, file).split(sep).join('/');
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      if (!/\b(MessageCircle|MessageSquare)\b/.test(line)) return;
      if (/^\s*import\b/.test(line)) return;
      if (/^[\s\w,]*$/.test(line)) return; // continuation line of a multi-line import: only names and commas
      const context = lines.slice(Math.max(0, i - 3), i + 4).join(' ');
      if (!/whats\s?app/i.test(context)) return;
      if (ALLOWED.some(([f, snippet]) => f === rel && line.includes(snippet))) return;
      found.push(`${rel}:${i + 1}  ${line.trim().slice(0, 110)}`);
    });
  }
  return found;
}

describe('WhatsApp icon', () => {
  it('no generic chat bubble is used where the UI says WhatsApp', () => {
    const bad = offenders();
    assert.deepEqual(bad, [], `Use <WhatsAppIcon /> from chat/BrandIcons.jsx instead:\n${bad.join('\n')}`);
  });

  it('the real mark is exported and accepts className / size / colored', () => {
    const src = readFileSync(join(ROOT, 'app/automation/components/chat/BrandIcons.jsx'), 'utf8');
    assert.match(src, /export function WhatsAppIcon\(\{ className = '', size, colored = false/);
  });
});
