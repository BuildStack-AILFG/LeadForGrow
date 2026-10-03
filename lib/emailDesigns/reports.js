import {
  EMAIL_ASSET_BASE, esc, safeUrl, safeColor, paragraphs, textStyle, spacer, row, image, button,
  logoOrName, footer, emailDocument,
} from './blocks.js';
import { brandFields, footerFields } from './templates.js';

/**
 * "Weekly report": a digest with a hero card, quick summary, four number
 * cards (red/green change), a highlights box, what's next, a CTA band,
 * contact row, disclaimer, banner and social links — e.g. a weekly market
 * wrap. Any section left empty is simply not shown.
 */

const lines = (text) => String(text || '').split('\n').map((l) => l.trim()).filter(Boolean);

/** "Crude: rose 4%" → bold "Crude:" + text. Plain lines stay plain. */
function labelled(line, color) {
  const m = line.match(/^([^:]{1,40}):\s*(.+)$/);
  return m
    ? `<strong style="color:${color};">${esc(m[1])}:</strong> ${esc(m[2])}`
    : esc(line);
}

/** Red for a fall, green for a rise, grey for flat/unknown. */
function changeColor(change) {
  const c = String(change || '').trim();
  if (!c) return '#6b7280';
  if (/^[-−–▼↓]/.test(c)) return '#dc2626';
  if (/^[+▲↑]/.test(c) || /^[0-9.]*[1-9]/.test(c)) return '#16a34a';
  return '#6b7280';
}

function statCard(label, value, change, ink) {
  if (!label && !value) return '';
  return `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="background-color:#ffffff;border:1px solid #d6e9de;border-radius:10px;"><tr><td align="center" style="padding:12px 6px;">
<p style="margin:0;${textStyle({ size: 10, color: '#6b7280', weight: 700, line: 1.3, align: 'center' })}text-transform:uppercase;letter-spacing:.08em;">${esc(label)}</p>
<p style="margin:6px 0 0;${textStyle({ size: 19, color: ink, weight: 800, line: 1.15, align: 'center' })}">${esc(value)}</p>
${change ? `<p style="margin:4px 0 0;${textStyle({ size: 12, color: changeColor(change), weight: 700, line: 1.2, align: 'center' })}">${esc(change)}</p>` : ''}
</td></tr></table>`;
}

function sectionTitle(text, color) {
  return text ? row(`<p style="margin:0 0 10px;${textStyle({ size: 18, color, weight: 800, line: 1.3 })}">${esc(text)}</p>`) : '';
}

const SOCIALS = [
  ['facebookUrl', 'Facebook', 'social-facebook.png'],
  ['xUrl', 'X', 'social-x.png'],
  ['instagramUrl', 'Instagram', 'social-instagram.png'],
  ['youtubeUrl', 'YouTube', 'social-youtube.png'],
  ['linkedinUrl', 'LinkedIn', 'social-linkedin.png'],
  ['telegramUrl', 'Telegram', 'social-telegram.png'],
];

const weeklyReport = {
  id: 'weekly-report',
  name: 'Weekly report',
  category: 'Updates',
  description: 'Weekly digest: headline card, key numbers in red/green, highlights and what’s next — like a market wrap.',
  swatch: ['#0b3d2e', '#f59e0b', '#eef7f1'],
  fields: [
    ...brandFields(),
    { key: 'eyebrow', label: 'Small label', type: 'text', group: 'Hero', default: 'WEEKLY MARKET WRAP' },
    { key: 'headline', label: 'Headline', type: 'textarea', group: 'Hero', rows: 3, default: 'Crude spiked.\nForeign selling deepened.\nIndices slid.', help: 'Each new line starts a new line in the email.' },
    { key: 'subtext', label: 'One-line summary', type: 'textarea', group: 'Hero', rows: 2, default: 'Oil, outflows and rate expectations kept pressure on equities this week.' },
    { key: 'dateTag', label: 'Date tag', type: 'text', group: 'Hero', default: '29 SEP – 3 OCT' },
    { key: 'heroCtaLabel', label: 'Button label', type: 'text', group: 'Hero', default: 'Read the full report' },
    { key: 'heroCtaUrl', label: 'Button link', type: 'url', group: 'Hero', default: '' },

    { key: 'summaryTitle', label: 'Section title', type: 'text', group: 'Quick summary', default: 'In 30 seconds' },
    { key: 'summary', label: 'Bullet points', type: 'textarea', group: 'Quick summary', rows: 4, default: 'Every session ended lower, taking the Nifty to an eighth straight weekly decline.\nBroader indices underperformed as pressure spread beyond frontline stocks.', help: 'One bullet per line.' },

    { key: 'statsTitle', label: 'Section title', type: 'text', group: 'Key numbers', default: 'By the numbers' },
    ...[
      ['SENSEX', '71,909.70', '-3.05%'],
      ['NIFTY 50', '22,421.95', '-2.77%'],
      ['BANK NIFTY', '58,732.80', '-1.55%'],
      ['SMALLCAP 100', '19,058.85', '-3.23%'],
    ].flatMap(([l, v, c], i) => [
      { key: `stat${i + 1}Label`, label: `Card ${i + 1} — name`, type: 'text', group: 'Key numbers', default: l },
      { key: `stat${i + 1}Value`, label: `Card ${i + 1} — value`, type: 'text', group: 'Key numbers', default: v },
      { key: `stat${i + 1}Change`, label: `Card ${i + 1} — change`, type: 'text', group: 'Key numbers', default: c, help: i === 0 ? 'Start with − for red, + (or a number) for green.' : undefined },
    ]),

    { key: 'highlightsTitle', label: 'Section title', type: 'text', group: 'Highlights', default: 'What moved the market' },
    { key: 'highlights', label: 'Highlights', type: 'textarea', group: 'Highlights', rows: 5, default: 'Crude: Brent jumped to $100.36 on Monday before easing to about $99 by Thursday.\nForeign flows: FIIs sold over ₹21,000 crore across the week.\nRates: Higher rate expectations firmed ahead of the policy meeting.', help: 'One per line. "Label: text" makes the label bold.' },

    { key: 'nextTitle', label: 'Section title', type: 'text', group: 'Coming up', default: 'Next up' },
    { key: 'nextItems', label: 'Items', type: 'textarea', group: 'Coming up', rows: 4, default: 'Holiday: Markets remain closed on 2 Oct; trading resumes 3 Oct.\nRBI: The policy decision lands on 7 Oct — banks and realty in focus.\nWatch: Crude, US yields, Q2 earnings and FII activity.', help: 'One per line. "Label: text" makes the label bold.' },

    { key: 'ctaTitle', label: 'Band text', type: 'text', group: 'Call to action', default: 'Stay ready for the next session' },
    { key: 'ctaLabel', label: 'Button label', type: 'text', group: 'Call to action', default: 'Open your account' },
    { key: 'ctaUrl', label: 'Button link', type: 'url', group: 'Call to action', default: '' },

    { key: 'faqLabel', label: 'Help link label', type: 'text', group: 'Contact', default: 'Check our FAQs' },
    { key: 'faqUrl', label: 'Help link', type: 'url', group: 'Contact', default: '' },
    { key: 'phone', label: 'Phone', type: 'text', group: 'Contact', default: '' },
    { key: 'email', label: 'Support email', type: 'text', group: 'Contact', default: '' },

    { key: 'disclaimer', label: 'Disclaimer', type: 'textarea', group: 'Disclaimer', rows: 5, default: 'Disclaimer: This report is for information only and is not investment advice. Investments in securities markets are subject to market risks; read all related documents carefully before investing.' },

    { key: 'bannerImage', label: 'Banner image (optional)', type: 'image', group: 'Banner', default: '', help: 'Wide promo image, about 1200 × 400 px.' },
    { key: 'bannerUrl', label: 'Banner link', type: 'url', group: 'Banner', default: '' },

    ...SOCIALS.map(([key, label]) => ({ key, label: `${label} link`, type: 'url', group: 'Social links', default: '' })),

    { key: 'heroColor', label: 'Hero & band', type: 'color', group: 'Colours', default: '#0b3d2e' },
    { key: 'accentColor', label: 'Accent', type: 'color', group: 'Colours', default: '#f59e0b' },
    { key: 'pageColor', label: 'Background', type: 'color', group: 'Colours', default: '#eef7f1' },
    ...footerFields(),
  ],
  render(v) {
    const hero = safeColor(v.heroColor, '#0b3d2e');
    const accent = safeColor(v.accentColor, '#f59e0b');
    const page = safeColor(v.pageColor, '#eef7f1');
    const ink = '#0f2a20';
    const body = textStyle({ size: 15, color: '#1f2937', line: 1.6 });

    const headlineHtml = lines(v.headline).map(esc).join('<br>');
    const heroCard = row(`<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="${hero}" style="background-color:${hero};border-radius:14px;"><tr><td class="px" style="padding:26px 28px 28px;">
${logoOrName({ logoUrl: v.logoUrl, brandName: v.brandName, color: '#ffffff', size: 18, height: 30 })}
${v.eyebrow ? `<p style="margin:18px 0 0;${textStyle({ size: 11, color: accent, weight: 700, line: 1.4 })}letter-spacing:.14em;">${esc(v.eyebrow)}</p>` : ''}
${headlineHtml ? `<p class="h1" style="margin:10px 0 0;${textStyle({ size: 30, color: '#ffffff', weight: 800, line: 1.15 })}letter-spacing:-0.01em;">${headlineHtml}</p>` : ''}
${v.subtext ? `<p style="margin:12px 0 0;${textStyle({ size: 14, color: '#cfe7dc', line: 1.55 })}">${esc(v.subtext)}</p>` : ''}
${v.dateTag ? `<table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin-top:16px;"><tr><td bgcolor="${accent}" style="background-color:${accent};border-radius:4px;padding:4px 10px;${textStyle({ size: 11, color: '#111827', weight: 700, line: 1.3 })}letter-spacing:.06em;">${esc(v.dateTag)}</td></tr></table>` : ''}
${v.heroCtaLabel ? `<div style="margin-top:16px;">${button({ label: v.heroCtaLabel, url: v.heroCtaUrl, bg: '#ffffff', color: hero, radius: 6, align: 'left', size: 14 })}</div>` : ''}
</td></tr></table>`, { padding: '24px 24px 0' });

    const bullets = lines(v.summary);
    const summary = bullets.length ? [
      spacer(28),
      sectionTitle(v.summaryTitle, ink),
      row(`<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">${bullets.map((b) => `<tr><td width="18" valign="top" style="width:18px;${textStyle({ size: 15, color: accent, weight: 800, line: 1.6 })}">&bull;</td><td valign="top" style="padding-bottom:6px;${body}">${esc(b)}</td></tr>`).join('')}</table>`),
    ].join('\n') : '';

    const card = (i) => statCard(v[`stat${i}Label`], v[`stat${i}Value`], v[`stat${i}Change`], ink);
    const anyStat = [1, 2, 3, 4].some((i) => v[`stat${i}Label`] || v[`stat${i}Value`]);
    // Two pairs side by side; each pair stacks on phones → 2 × 2 grid.
    const pair = (a, b, second) => `<td class="stack${second ? ' stack-gap' : ''}" width="50%" valign="top" style="padding:0 ${second ? '0 0 5px' : '5px 0 0'};"><table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"><tr>
<td width="50%" valign="top" style="padding-right:5px;">${card(a)}</td><td width="50%" valign="top" style="padding-left:5px;">${card(b)}</td></tr></table></td>`;
    const stats = anyStat ? [
      spacer(24),
      sectionTitle(v.statsTitle, ink),
      row(`<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"><tr>${pair(1, 2, false)}${pair(3, 4, true)}</tr></table>`),
    ].join('\n') : '';

    const highlightItems = lines(v.highlights);
    const highlights = highlightItems.length ? [
      spacer(26),
      sectionTitle(v.highlightsTitle, ink),
      row(`<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="background-color:#ffffff;border-left:4px solid ${accent};border-radius:6px;"><tr><td style="padding:14px 18px 6px;">${highlightItems.map((h) => `<p style="margin:0 0 10px;${body}">${labelled(h, ink)}</p>`).join('')}</td></tr></table>`),
    ].join('\n') : '';

    const nextItems = lines(v.nextItems);
    const next = nextItems.length ? [
      spacer(26),
      sectionTitle(v.nextTitle, ink),
      row(nextItems.map((n) => `<p style="margin:0 0 10px;${body}">${labelled(n, ink)}</p>`).join('')),
    ].join('\n') : '';

    const ctaBand = v.ctaTitle || v.ctaLabel ? [
      spacer(22),
      row(`<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="${hero}" style="background-color:${hero};border-radius:12px;"><tr><td align="center" style="padding:24px 20px;">
${v.ctaTitle ? `<p style="margin:0 0 14px;${textStyle({ size: 17, color: '#ffffff', weight: 700, line: 1.35, align: 'center' })}">${esc(v.ctaTitle)}</p>` : ''}
${button({ label: v.ctaLabel, url: v.ctaUrl, bg: accent, color: '#111827', radius: 6, size: 15 })}
</td></tr></table>`),
    ].join('\n') : '';

    const contactCells = [
      v.faqLabel && ['contact-faq.png', v.faqLabel, safeUrl(v.faqUrl, '')],
      v.phone && ['contact-phone.png', v.phone, `tel:${String(v.phone).replace(/[^\d+]/g, '')}`],
      v.email && ['contact-mail.png', v.email, `mailto:${String(v.email).trim()}`],
    ].filter(Boolean);
    const contact = contactCells.length ? [
      spacer(22),
      row(`<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"><tr>${contactCells.map(([icon, text, href], i) => `<td class="stack${i ? ' stack-gap' : ''}" align="center" valign="middle" style="padding:0 4px;">
<a href="${esc(href || '#')}" target="_blank" style="text-decoration:none;${textStyle({ size: 13, color: '#1f2937', weight: 600, align: 'center' })}"><img src="${EMAIL_ASSET_BASE}/${icon}" alt="" width="18" height="18" style="display:inline-block;width:18px;height:18px;border:0;vertical-align:middle;margin-right:6px;">${esc(text)}</a></td>`).join('')}</tr></table>`),
    ].join('\n') : '';

    const disclaimer = v.disclaimer ? [
      spacer(20),
      `<tr><td class="px" style="padding:0 40px;"><div style="height:1px;line-height:1px;font-size:0;background-color:#d6e9de;">&nbsp;</div></td></tr>`,
      row(paragraphs(v.disclaimer, textStyle({ size: 10, color: '#6b7280', line: 1.55 })), { padding: '16px 40px 0' }),
    ].join('\n') : '';

    const banner = v.bannerImage ? [spacer(18), row(image({ src: v.bannerImage, alt: '', width: 520, radius: 10, link: v.bannerUrl }))].join('\n') : '';

    const socialLinks = SOCIALS.filter(([key]) => safeUrl(v[key], '')).map(([key, label, icon]) => `<td style="padding:0 5px;"><a href="${esc(safeUrl(v[key]))}" target="_blank"><img src="${EMAIL_ASSET_BASE}/${icon}" alt="${label}" width="32" height="32" style="display:block;width:32px;height:32px;border:0;"></a></td>`).join('');
    const social = socialLinks ? [spacer(22), row(`<table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto;"><tr>${socialLinks}</tr></table>`, { align: 'center' })].join('\n') : '';

    return emailDocument({
      title: lines(v.headline).join(' '),
      preheader: v.subtext || lines(v.summary)[0],
      pageBg: '#e4ece7',
      containerBg: page,
      rows: [
        heroCard, summary, stats, highlights, next, ctaBand, contact, disclaimer, banner, social,
        spacer(8),
        footer({ brandName: v.brandName, address: v.address, note: v.footerNote, textColor: '#6b7280', linkColor: ink }),
      ].filter(Boolean),
    });
  },
};

export const REPORT_TEMPLATES = [weeklyReport];
