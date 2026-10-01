import {
  EMAIL_ASSET_BASE, esc, safeUrl, safeColor, paragraphs, textStyle, spacer, row, image, button,
  logoOrName, footer, emailDocument,
} from './blocks.js';

/**
 * Designed email templates. Each one declares the fields the editor shows
 * (grouped into sections) and a render(values) that returns a complete,
 * email-client-safe HTML document. Values are always escaped here; `{{name}}`
 * style personalisation typed into any field is filled in per recipient at
 * send time.
 *
 * Field types: text | textarea | url | image | color.
 */

export const brandFields = (defaults = {}) => [
  { key: 'brandName', label: 'Brand name', type: 'text', group: 'Brand', default: defaults.brandName ?? '{{business.name}}' },
  { key: 'logoUrl', label: 'Logo (optional)', type: 'image', group: 'Brand', default: '', help: 'Shown instead of the brand name. PNG or JPG, about 2× the display height.' },
];

export const footerFields = (defaults = {}) => [
  { key: 'footerNote', label: 'Footer note', type: 'textarea', group: 'Footer', default: defaults.footerNote ?? '' },
  { key: 'address', label: 'Business address', type: 'text', group: 'Footer', default: '', help: 'Recommended for marketing emails (anti-spam laws).' },
];

function featureRows(v, { count, titleColor, textColor, badgeBg, badgeColor, badgeShape = 'circle' }) {
  const out = [];
  for (let i = 1; i <= count; i += 1) {
    const title = v[`feature${i}Title`];
    const text = v[`feature${i}Text`];
    if (!title && !text) continue;
    const icon = v[`feature${i}Icon`];
    const radius = badgeShape === 'circle' ? '50%' : '12px';
    const badge = icon
      ? `<img src="${esc(safeUrl(icon, ""))}" alt="" width="56" height="56" style="display:block;width:56px;height:56px;border-radius:${radius};border:0;">`
      : `<table role="presentation" border="0" cellspacing="0" cellpadding="0"><tr><td width="56" height="56" align="center" valign="middle" bgcolor="${badgeBg}" style="width:56px;height:56px;background-color:${badgeBg};border-radius:${radius};${textStyle({ size: 20, color: badgeColor, weight: 700, line: 1, align: 'center' })}">${i}</td></tr></table>`;
    out.push(row(`<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"><tr>
<td width="72" valign="top" style="width:72px;padding-top:2px;">${badge}</td>
<td valign="top">
<p style="margin:0 0 6px;${textStyle({ size: 18, color: titleColor, weight: 700, line: 1.3 })}">${esc(title)}</p>
${paragraphs(text, textStyle({ size: 14, color: textColor, line: 1.6 }))}
</td></tr></table>`, { padding: '0 40px 18px' }));
  }
  return out.join('\n');
}

const featureFields = (count, defaults, group = 'Highlights', withIcons = true) => {
  const fields = [];
  for (let i = 1; i <= count; i += 1) {
    const d = defaults[i - 1] || {};
    fields.push({ key: `feature${i}Title`, label: `Item ${i} — title`, type: 'text', group, default: d.title ?? '' });
    fields.push({ key: `feature${i}Text`, label: `Item ${i} — text`, type: 'textarea', group, default: d.text ?? '' });
    if (withIcons) fields.push({ key: `feature${i}Icon`, label: `Item ${i} — icon image (optional)`, type: 'image', group, default: '', help: 'Square image. Leave empty for a numbered badge.' });
  }
  return fields;
};

// ---------------------------------------------------------------------------

const spotlight = {
  id: 'spotlight',
  name: 'Spotlight',
  category: 'Promotion',
  description: 'Bold dark layout with a hero image, one clear call to action and three highlights.',
  swatch: ['#000000', '#ffffff', '#f59e0b'],
  fields: [
    ...brandFields(),
    { key: 'heroImage', label: 'Hero image', type: 'image', group: 'Hero', default: `${EMAIL_ASSET_BASE}/spotlight-hero.png`, help: 'Wide image, 1200 × 640 px works best.' },
    { key: 'intro', label: 'Intro', type: 'textarea', group: 'Hero', default: 'Whether it\'s a quick question, a booking or a follow-up, we reply in minutes — on WhatsApp, email or a call. One team, every channel.' },
    { key: 'headline', label: 'Headline', type: 'text', group: 'Hero', default: 'Help whenever you need it' },
    { key: 'ctaLabel', label: 'Button label', type: 'text', group: 'Hero', default: 'Get started' },
    { key: 'ctaUrl', label: 'Button link', type: 'url', group: 'Hero', default: '' },
    ...featureFields(3, [
      { title: 'Easy as sending a message', text: 'Reply to this email or message us on WhatsApp and a real person picks it up.' },
      { title: 'Live updates', text: 'Track every request from start to finish, with updates at each step.' },
      { title: 'Everything in one place', text: 'Quotes, invoices and bookings live in one thread, so nothing gets lost.' },
    ]),
    { key: 'closing', label: 'Closing text', type: 'textarea', group: 'Closing', default: 'Next time you need a hand, you know where to find us.' },
    { key: 'secondaryLabel', label: 'Link label', type: 'text', group: 'Closing', default: 'Learn more' },
    { key: 'secondaryUrl', label: 'Link URL', type: 'url', group: 'Closing', default: '' },
    { key: 'bgColor', label: 'Background', type: 'color', group: 'Colours', default: '#000000' },
    { key: 'textColor', label: 'Text', type: 'color', group: 'Colours', default: '#ffffff' },
    { key: 'buttonColor', label: 'Button', type: 'color', group: 'Colours', default: '#ffffff' },
    { key: 'buttonTextColor', label: 'Button text', type: 'color', group: 'Colours', default: '#000000' },
    { key: 'accentColor', label: 'Badges', type: 'color', group: 'Colours', default: '#f59e0b' },
    ...footerFields({ footerNote: 'Offer and availability may vary by location.' }),
  ],
  render(v) {
    const bg = safeColor(v.bgColor, '#000000');
    const fg = safeColor(v.textColor, '#ffffff');
    const muted = fg.toLowerCase() === '#ffffff' ? '#d1d5db' : '#4b5563';
    return emailDocument({
      title: v.headline,
      preheader: v.intro,
      pageBg: '#e5e7eb',
      containerBg: bg,
      rows: [
        row(logoOrName({ logoUrl: v.logoUrl, brandName: v.brandName, color: '#111827', align: 'center', size: 18 }), { bg: '#ffffff', padding: '16px 40px', align: 'center' }),
        v.heroImage ? `<tr><td bgcolor="${bg}" style="background-color:${bg};">${image({ src: v.heroImage, alt: v.headline })}</td></tr>` : spacer(24),
        spacer(28),
        row(paragraphs(v.intro, textStyle({ size: 16, color: fg, line: 1.65, align: 'center' })), { align: 'center' }),
        spacer(6),
        row(`<p style="margin:0;${textStyle({ size: 20, color: fg, weight: 700, line: 1.3, align: 'center' })}">${esc(v.headline)}</p>`, { align: 'center' }),
        spacer(22),
        row(button({ label: v.ctaLabel, url: v.ctaUrl, bg: safeColor(v.buttonColor, '#ffffff'), color: safeColor(v.buttonTextColor, '#000000'), radius: 6 }), { align: 'center' }),
        spacer(40),
        featureRows(v, { count: 3, titleColor: fg, textColor: muted, badgeBg: safeColor(v.accentColor, '#f59e0b'), badgeColor: '#111827' }),
        spacer(18),
        row(paragraphs(v.closing, textStyle({ size: 15, color: fg, line: 1.6, align: 'center' })), { align: 'center' }),
        v.secondaryLabel ? row(`<a href="${esc(safeUrl(v.secondaryUrl))}" target="_blank" style="${textStyle({ size: 15, color: fg, weight: 700, align: 'center' })}text-decoration:none;border-bottom:2px solid ${fg};padding-bottom:3px;">${esc(v.secondaryLabel)}</a>`, { align: 'center', padding: '4px 40px 36px' }) : spacer(24),
        `<tr><td class="px" style="padding:0 40px;"><div style="height:1px;line-height:1px;font-size:0;background-color:${muted};opacity:.35;">&nbsp;</div></td></tr>`,
        footer({ brandName: v.brandName, address: v.address, note: v.footerNote, textColor: muted, linkColor: fg, align: 'left' }),
      ],
    });
  },
};

const announcement = {
  id: 'announcement',
  name: 'Announcement',
  category: 'Product',
  description: 'Clean light layout for launches and updates: coloured header, image, headline and two highlights.',
  swatch: ['#0f766e', '#ffffff', '#f0fdfa'],
  fields: [
    ...brandFields(),
    { key: 'eyebrow', label: 'Small label', type: 'text', group: 'Main', default: 'NEW' },
    { key: 'headline', label: 'Headline', type: 'text', group: 'Main', default: 'Meet the faster way to reach your customers' },
    { key: 'heroImage', label: 'Image', type: 'image', group: 'Main', default: `${EMAIL_ASSET_BASE}/announcement-hero.png` },
    { key: 'body', label: 'Message', type: 'textarea', group: 'Main', default: 'Hi {{name}},\n\nWe\'ve just launched something we think you\'ll love. It takes the busywork out of your day so you can focus on what matters.' },
    { key: 'ctaLabel', label: 'Button label', type: 'text', group: 'Main', default: 'See what\'s new' },
    { key: 'ctaUrl', label: 'Button link', type: 'url', group: 'Main', default: '' },
    ...featureFields(2, [
      { title: 'Set up in minutes', text: 'No training needed — it works the way you already do.' },
      { title: 'Included in your plan', text: 'Available today at no extra cost.' },
    ], 'Highlights', false),
    { key: 'accentColor', label: 'Accent', type: 'color', group: 'Colours', default: '#0f766e' },
    { key: 'tintColor', label: 'Highlight panel', type: 'color', group: 'Colours', default: '#f0fdfa' },
    ...footerFields(),
  ],
  render(v) {
    const accent = safeColor(v.accentColor, '#0f766e');
    const tint = safeColor(v.tintColor, '#f0fdfa');
    const cols = [1, 2].filter((i) => v[`feature${i}Title`] || v[`feature${i}Text`]).map((i) => `<td class="stack${i === 2 ? ' stack-gap' : ''}" width="50%" valign="top" style="padding:${i === 1 ? '0 10px 0 0' : '0 0 0 10px'};">
<p style="margin:0 0 6px;${textStyle({ size: 16, color: '#111827', weight: 700, line: 1.3 })}">${esc(v[`feature${i}Title`])}</p>
${paragraphs(v[`feature${i}Text`], textStyle({ size: 14, color: '#4b5563', line: 1.55 }))}</td>`).join('');
    return emailDocument({
      title: v.headline,
      preheader: v.headline,
      rows: [
        row(logoOrName({ logoUrl: v.logoUrl, brandName: v.brandName, color: '#ffffff', size: 18 }), { bg: accent, padding: '22px 40px' }),
        spacer(36),
        v.eyebrow ? row(`<span style="display:inline-block;padding:4px 10px;border-radius:999px;background-color:${tint};${textStyle({ size: 11, color: accent, weight: 700, line: 1.4 })}letter-spacing:.08em;">${esc(v.eyebrow)}</span>`) : '',
        spacer(14),
        row(`<p class="h1" style="margin:0;${textStyle({ size: 30, color: '#111827', weight: 800, line: 1.2 })}letter-spacing:-0.02em;">${esc(v.headline)}</p>`),
        spacer(24),
        v.heroImage ? row(image({ src: v.heroImage, alt: v.headline, width: 520, radius: 10 })) : '',
        spacer(24),
        row(paragraphs(v.body, textStyle({ size: 16, color: '#374151', line: 1.65 }))),
        spacer(8),
        row(button({ label: v.ctaLabel, url: v.ctaUrl, bg: accent, align: 'left' })),
        spacer(32),
        cols ? row(`<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="${tint}" style="background-color:${tint};border-radius:10px;"><tr><td style="padding:22px 22px 8px;"><table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"><tr>${cols}</tr></table></td></tr></table>`) : '',
        spacer(12),
        footer({ brandName: v.brandName, address: v.address, note: v.footerNote }),
      ],
    });
  },
};

const offer = {
  id: 'offer',
  name: 'Offer & discount',
  category: 'Promotion',
  description: 'Big discount, a coupon code box and an expiry line — built to drive a single purchase.',
  swatch: ['#7c2d12', '#fff7ed', '#ea580c'],
  fields: [
    ...brandFields(),
    { key: 'kicker', label: 'Small label', type: 'text', group: 'Offer', default: 'THIS WEEK ONLY' },
    { key: 'amount', label: 'Big number', type: 'text', group: 'Offer', default: '30% OFF' },
    { key: 'headline', label: 'Headline', type: 'text', group: 'Offer', default: 'A thank-you for being with us, {{name}}' },
    { key: 'body', label: 'Message', type: 'textarea', group: 'Offer', default: 'Use the code below on your next booking. It works on every service and can\'t be combined with other offers.' },
    { key: 'code', label: 'Coupon code', type: 'text', group: 'Offer', default: 'THANKYOU30' },
    { key: 'ctaLabel', label: 'Button label', type: 'text', group: 'Offer', default: 'Claim my discount' },
    { key: 'ctaUrl', label: 'Button link', type: 'url', group: 'Offer', default: '' },
    { key: 'expiry', label: 'Expiry line', type: 'text', group: 'Offer', default: 'Valid until Sunday, 11:59 pm.' },
    { key: 'heroImage', label: 'Image (optional)', type: 'image', group: 'Offer', default: `${EMAIL_ASSET_BASE}/offer-hero.png` },
    { key: 'bgColor', label: 'Background', type: 'color', group: 'Colours', default: '#fff7ed' },
    { key: 'accentColor', label: 'Accent', type: 'color', group: 'Colours', default: '#ea580c' },
    { key: 'inkColor', label: 'Headings', type: 'color', group: 'Colours', default: '#7c2d12' },
    ...footerFields(),
  ],
  render(v) {
    const bg = safeColor(v.bgColor, '#fff7ed');
    const accent = safeColor(v.accentColor, '#ea580c');
    const ink = safeColor(v.inkColor, '#7c2d12');
    return emailDocument({
      title: v.headline,
      preheader: `${v.amount} — ${v.headline}`,
      pageBg: '#f5f5f4',
      containerBg: bg,
      rows: [
        row(logoOrName({ logoUrl: v.logoUrl, brandName: v.brandName, color: ink, align: 'center', size: 18 }), { padding: '28px 40px 0', align: 'center' }),
        v.heroImage ? row(image({ src: v.heroImage, alt: v.headline, width: 520, radius: 12 }), { padding: '24px 40px 0', align: 'center' }) : '',
        spacer(28),
        v.kicker ? row(`<p style="margin:0;${textStyle({ size: 12, color: accent, weight: 700, align: 'center' })}letter-spacing:.14em;">${esc(v.kicker)}</p>`, { align: 'center' }) : '',
        row(`<p class="big" style="margin:6px 0 0;${textStyle({ size: 56, color: ink, weight: 800, line: 1.05, align: 'center' })}letter-spacing:-0.03em;">${esc(v.amount)}</p>`, { align: 'center' }),
        spacer(14),
        row(`<p style="margin:0;${textStyle({ size: 20, color: ink, weight: 700, line: 1.35, align: 'center' })}">${esc(v.headline)}</p>`, { align: 'center' }),
        spacer(12),
        row(paragraphs(v.body, textStyle({ size: 15, color: '#57534e', line: 1.6, align: 'center' })), { align: 'center' }),
        v.code ? row(`<table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin:6px auto 0;"><tr><td align="center" style="padding:14px 26px;border:2px dashed ${accent};border-radius:10px;background-color:#ffffff;${textStyle({ size: 22, color: ink, weight: 800, line: 1, align: 'center' })}letter-spacing:.12em;">${esc(v.code)}</td></tr></table>`, { align: 'center' }) : '',
        spacer(24),
        row(button({ label: v.ctaLabel, url: v.ctaUrl, bg: accent, radius: 999 }), { align: 'center' }),
        spacer(14),
        v.expiry ? row(`<p style="margin:0;${textStyle({ size: 13, color: '#78716c', align: 'center' })}">${esc(v.expiry)}</p>`, { align: 'center' }) : '',
        spacer(20),
        footer({ brandName: v.brandName, address: v.address, note: v.footerNote, textColor: '#78716c', linkColor: ink }),
      ],
    });
  },
};

const newsletter = {
  id: 'newsletter',
  name: 'Newsletter',
  category: 'Updates',
  description: 'A lead story with image plus two shorter stories side by side (stacked on phones).',
  swatch: ['#1e3a8a', '#ffffff', '#eff6ff'],
  fields: [
    ...brandFields(),
    { key: 'issue', label: 'Issue line', type: 'text', group: 'Header', default: 'Monthly update' },
    { key: 'leadImage', label: 'Lead story image', type: 'image', group: 'Lead story', default: `${EMAIL_ASSET_BASE}/newsletter-lead.png` },
    { key: 'leadTitle', label: 'Lead story title', type: 'text', group: 'Lead story', default: 'What we built for you this month' },
    { key: 'leadText', label: 'Lead story text', type: 'textarea', group: 'Lead story', default: 'A quick round-up of the improvements, tips and stories from the last few weeks. Everything here takes less than five minutes to read.' },
    { key: 'leadLinkLabel', label: 'Lead story link label', type: 'text', group: 'Lead story', default: 'Read the full story →' },
    { key: 'leadLinkUrl', label: 'Lead story link', type: 'url', group: 'Lead story', default: '' },
    { key: 'story1Title', label: 'Story 1 — title', type: 'text', group: 'More stories', default: 'Tip of the month' },
    { key: 'story1Text', label: 'Story 1 — text', type: 'textarea', group: 'More stories', default: 'Reply within five minutes and you\'re far more likely to win the customer. Here\'s how to make it a habit.' },
    { key: 'story1Url', label: 'Story 1 — link', type: 'url', group: 'More stories', default: '' },
    { key: 'story2Title', label: 'Story 2 — title', type: 'text', group: 'More stories', default: 'Customer story' },
    { key: 'story2Text', label: 'Story 2 — text', type: 'textarea', group: 'More stories', default: 'How a local business doubled repeat bookings with two simple follow-up messages.' },
    { key: 'story2Url', label: 'Story 2 — link', type: 'url', group: 'More stories', default: '' },
    { key: 'accentColor', label: 'Accent', type: 'color', group: 'Colours', default: '#1e3a8a' },
    { key: 'tintColor', label: 'Story cards', type: 'color', group: 'Colours', default: '#eff6ff' },
    ...footerFields(),
  ],
  render(v) {
    const accent = safeColor(v.accentColor, '#1e3a8a');
    const tint = safeColor(v.tintColor, '#eff6ff');
    const story = (i) => `<td class="stack${i === 2 ? ' stack-gap' : ''}" width="50%" valign="top" style="padding:${i === 1 ? '0 8px 0 0' : '0 0 0 8px'};">
<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="${tint}" style="background-color:${tint};border-radius:10px;"><tr><td style="padding:20px;">
<p style="margin:0 0 8px;${textStyle({ size: 16, color: '#111827', weight: 700, line: 1.3 })}">${esc(v[`story${i}Title`])}</p>
${paragraphs(v[`story${i}Text`], textStyle({ size: 14, color: '#4b5563', line: 1.55 }))}
<a href="${esc(safeUrl(v[`story${i}Url`]))}" target="_blank" style="${textStyle({ size: 14, color: accent, weight: 600 })}text-decoration:none;">Read more →</a>
</td></tr></table></td>`;
    return emailDocument({
      title: v.leadTitle,
      preheader: v.leadTitle,
      rows: [
        row(`<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"><tr>
<td valign="middle">${logoOrName({ logoUrl: v.logoUrl, brandName: v.brandName, color: accent, size: 20 })}</td>
<td valign="middle" align="right" style="${textStyle({ size: 12, color: '#6b7280', align: 'right' })}text-transform:uppercase;letter-spacing:.1em;">${esc(v.issue)}</td>
</tr></table>`, { padding: '26px 40px' }),
        `<tr><td class="px" style="padding:0 40px;"><div style="height:3px;line-height:3px;font-size:0;background-color:${accent};">&nbsp;</div></td></tr>`,
        spacer(28),
        v.leadImage ? row(image({ src: v.leadImage, alt: v.leadTitle, width: 520, radius: 10 })) : '',
        spacer(20),
        row(`<p class="h1" style="margin:0 0 12px;${textStyle({ size: 26, color: '#111827', weight: 800, line: 1.25 })}letter-spacing:-0.01em;">${esc(v.leadTitle)}</p>${paragraphs(v.leadText, textStyle({ size: 16, color: '#374151', line: 1.65 }))}`),
        v.leadLinkLabel ? row(`<a href="${esc(safeUrl(v.leadLinkUrl))}" target="_blank" style="${textStyle({ size: 15, color: accent, weight: 700 })}text-decoration:none;">${esc(v.leadLinkLabel)}</a>`) : '',
        spacer(30),
        row(`<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"><tr>${story(1)}${story(2)}</tr></table>`),
        spacer(16),
        footer({ brandName: v.brandName, address: v.address, note: v.footerNote }),
      ],
    });
  },
};

const eventInvite = {
  id: 'event',
  name: 'Event invite',
  category: 'Events',
  description: 'Invitation with a date, time and venue card and an RSVP button.',
  swatch: ['#4c1d95', '#ffffff', '#f5f3ff'],
  fields: [
    ...brandFields(),
    { key: 'heroImage', label: 'Banner image', type: 'image', group: 'Event', default: `${EMAIL_ASSET_BASE}/event-hero.png` },
    { key: 'eyebrow', label: 'Small label', type: 'text', group: 'Event', default: 'YOU\'RE INVITED' },
    { key: 'title', label: 'Event name', type: 'text', group: 'Event', default: 'Customer meet-up & open house' },
    { key: 'body', label: 'Invitation', type: 'textarea', group: 'Event', default: 'Hi {{name}}, join us for an evening of demos, quick wins and good conversation. Bring a colleague — seats are limited.' },
    { key: 'date', label: 'Date', type: 'text', group: 'Details', default: 'Saturday, 18 October' },
    { key: 'time', label: 'Time', type: 'text', group: 'Details', default: '5:00 pm – 7:30 pm' },
    { key: 'location', label: 'Location', type: 'text', group: 'Details', default: 'Our office, 2nd floor · or join online' },
    { key: 'ctaLabel', label: 'Button label', type: 'text', group: 'Details', default: 'Reserve my seat' },
    { key: 'ctaUrl', label: 'Button link', type: 'url', group: 'Details', default: '' },
    { key: 'accentColor', label: 'Accent', type: 'color', group: 'Colours', default: '#4c1d95' },
    { key: 'tintColor', label: 'Details card', type: 'color', group: 'Colours', default: '#f5f3ff' },
    ...footerFields(),
  ],
  render(v) {
    const accent = safeColor(v.accentColor, '#4c1d95');
    const tint = safeColor(v.tintColor, '#f5f3ff');
    const detail = (label, value) => (value ? `<tr>
<td width="90" valign="top" style="width:90px;padding:8px 0;${textStyle({ size: 12, color: '#6b7280', weight: 600 })}text-transform:uppercase;letter-spacing:.08em;">${esc(label)}</td>
<td valign="top" style="padding:8px 0;${textStyle({ size: 15, color: '#111827', weight: 600, line: 1.45 })}">${esc(value)}</td></tr>` : '');
    return emailDocument({
      title: v.title,
      preheader: [v.title, v.date].filter(Boolean).join(' · '),
      rows: [
        row(logoOrName({ logoUrl: v.logoUrl, brandName: v.brandName, color: accent, size: 18 }), { padding: '24px 40px' }),
        v.heroImage ? `<tr><td>${image({ src: v.heroImage, alt: v.title })}</td></tr>` : '',
        spacer(32),
        v.eyebrow ? row(`<p style="margin:0 0 8px;${textStyle({ size: 12, color: accent, weight: 700 })}letter-spacing:.14em;">${esc(v.eyebrow)}</p>`) : '',
        row(`<p class="h1" style="margin:0;${textStyle({ size: 30, color: '#111827', weight: 800, line: 1.2 })}letter-spacing:-0.02em;">${esc(v.title)}</p>`),
        spacer(16),
        row(paragraphs(v.body, textStyle({ size: 16, color: '#374151', line: 1.65 }))),
        spacer(8),
        row(`<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="${tint}" style="background-color:${tint};border-radius:12px;border-left:4px solid ${accent};"><tr><td style="padding:14px 22px;"><table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">${detail('Date', v.date)}${detail('Time', v.time)}${detail('Where', v.location)}</table></td></tr></table>`),
        spacer(28),
        row(button({ label: v.ctaLabel, url: v.ctaUrl, bg: accent, align: 'left' })),
        spacer(24),
        footer({ brandName: v.brandName, address: v.address, note: v.footerNote }),
      ],
    });
  },
};

const welcome = {
  id: 'welcome',
  name: 'Welcome',
  category: 'Onboarding',
  description: 'Warm hello for new customers with three simple next steps.',
  swatch: ['#065f46', '#ffffff', '#ecfdf5'],
  fields: [
    ...brandFields(),
    { key: 'headline', label: 'Greeting', type: 'text', group: 'Main', default: 'Welcome aboard, {{name}}!' },
    { key: 'body', label: 'Message', type: 'textarea', group: 'Main', default: 'We\'re glad you\'re here. Here\'s how to get the most out of the next few days.' },
    ...featureFields(3, [
      { title: 'Tell us what you need', text: 'Reply to this email with your requirements and we\'ll prepare a plan.' },
      { title: 'Meet your contact person', text: 'You\'ll get a direct line to one person who knows your account.' },
      { title: 'See results', text: 'We check in after the first week to make sure everything is on track.' },
    ], 'Steps'),
    { key: 'ctaLabel', label: 'Button label', type: 'text', group: 'Main', default: 'Get started' },
    { key: 'ctaUrl', label: 'Button link', type: 'url', group: 'Main', default: '' },
    { key: 'signoff', label: 'Sign-off', type: 'textarea', group: 'Main', default: 'Talk soon,\nThe {{business.name}} team' },
    { key: 'accentColor', label: 'Accent', type: 'color', group: 'Colours', default: '#065f46' },
    { key: 'tintColor', label: 'Header', type: 'color', group: 'Colours', default: '#ecfdf5' },
    ...footerFields(),
  ],
  render(v) {
    const accent = safeColor(v.accentColor, '#065f46');
    const tint = safeColor(v.tintColor, '#ecfdf5');
    return emailDocument({
      title: v.headline,
      preheader: v.body,
      rows: [
        row(`${logoOrName({ logoUrl: v.logoUrl, brandName: v.brandName, color: accent, size: 18 })}
<p class="h1" style="margin:26px 0 12px;${textStyle({ size: 32, color: '#064e3b', weight: 800, line: 1.2 })}letter-spacing:-0.02em;">${esc(v.headline)}</p>
${paragraphs(v.body, textStyle({ size: 17, color: '#065f46', line: 1.6 }))}`, { bg: tint, padding: '32px 40px 22px' }),
        spacer(32),
        featureRows(v, { count: 3, titleColor: '#111827', textColor: '#4b5563', badgeBg: accent, badgeColor: '#ffffff', badgeShape: 'rounded' }),
        spacer(8),
        row(button({ label: v.ctaLabel, url: v.ctaUrl, bg: accent, align: 'left' })),
        spacer(28),
        row(paragraphs(v.signoff, textStyle({ size: 15, color: '#374151', line: 1.6 }))),
        spacer(8),
        footer({ brandName: v.brandName, address: v.address, note: v.footerNote }),
      ],
    });
  },
};

const festive = {
  id: 'festive',
  name: 'Festive greeting',
  category: 'Festivals',
  description: 'Rich, warm greeting for Diwali, Eid, Christmas or New Year — with an optional offer.',
  swatch: ['#4a0d1e', '#fbbf24', '#fff7ed'],
  fields: [
    ...brandFields(),
    { key: 'heroImage', label: 'Festive image', type: 'image', group: 'Greeting', default: `${EMAIL_ASSET_BASE}/festive-hero.jpg` },
    { key: 'greeting', label: 'Greeting', type: 'text', group: 'Greeting', default: 'Happy Diwali' },
    { key: 'body', label: 'Message', type: 'textarea', group: 'Greeting', default: 'Dear {{name}}, may this festival of lights bring warmth, joy and new beginnings to you and your family. Thank you for being part of our journey this year.' },
    { key: 'offerLine', label: 'Offer line (optional)', type: 'text', group: 'Offer', default: 'Festive special: 20% off all bookings this week' },
    { key: 'ctaLabel', label: 'Button label', type: 'text', group: 'Offer', default: 'Celebrate with us' },
    { key: 'ctaUrl', label: 'Button link', type: 'url', group: 'Offer', default: '' },
    { key: 'signoff', label: 'Sign-off', type: 'text', group: 'Greeting', default: 'With warm wishes, the {{business.name}} family' },
    { key: 'bgColor', label: 'Background', type: 'color', group: 'Colours', default: '#4a0d1e' },
    { key: 'goldColor', label: 'Gold', type: 'color', group: 'Colours', default: '#fbbf24' },
    ...footerFields(),
  ],
  render(v) {
    const bg = safeColor(v.bgColor, '#4a0d1e');
    const gold = safeColor(v.goldColor, '#fbbf24');
    return emailDocument({
      title: v.greeting,
      preheader: v.body,
      pageBg: '#f5f0eb',
      containerBg: bg,
      rows: [
        row(logoOrName({ logoUrl: v.logoUrl, brandName: v.brandName, color: gold, align: 'center', size: 16 }), { padding: '26px 40px 18px', align: 'center' }),
        v.heroImage ? `<tr><td>${image({ src: v.heroImage, alt: v.greeting })}</td></tr>` : '',
        spacer(30),
        row(`<p class="big" style="margin:0;${textStyle({ size: 44, color: gold, weight: 800, line: 1.1, align: 'center' })}letter-spacing:-0.01em;">${esc(v.greeting)}</p>`, { align: 'center' }),
        spacer(16),
        row(paragraphs(v.body, textStyle({ size: 16, color: '#fde8d0', line: 1.7, align: 'center' })), { align: 'center' }),
        v.offerLine ? row(`<table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin:10px auto 0;"><tr><td style="padding:12px 20px;border:1px solid ${gold};border-radius:999px;${textStyle({ size: 14, color: gold, weight: 700, align: 'center' })}">${esc(v.offerLine)}</td></tr></table>`, { align: 'center' }) : '',
        spacer(24),
        row(button({ label: v.ctaLabel, url: v.ctaUrl, bg: gold, color: bg, radius: 999 }), { align: 'center' }),
        spacer(26),
        row(`<p style="margin:0;${textStyle({ size: 14, color: '#fcd9b6', line: 1.6, align: 'center' })}font-style:italic;">${esc(v.signoff)}</p>`, { align: 'center' }),
        spacer(12),
        footer({ brandName: v.brandName, address: v.address, note: v.footerNote, textColor: '#e7b9a0', linkColor: gold }),
      ],
    });
  },
};

const letter = {
  id: 'letter',
  name: 'Simple letter',
  category: 'Personal',
  description: 'Personal, text-first note on a clean card. Great for follow-ups and deliverability.',
  swatch: ['#ffffff', '#111827', '#2563eb'],
  fields: [
    ...brandFields(),
    { key: 'body', label: 'Letter', type: 'textarea', group: 'Letter', rows: 8, default: 'Hi {{name}},\n\nI wanted to personally follow up on your enquiry. We\'ve put together a few options that fit what you described, and I\'d love to walk you through them.\n\nWould a quick 10-minute call this week work for you?' },
    { key: 'ctaLabel', label: 'Button label (optional)', type: 'text', group: 'Letter', default: 'Book a quick call' },
    { key: 'ctaUrl', label: 'Button link', type: 'url', group: 'Letter', default: '' },
    { key: 'senderName', label: 'Your name', type: 'text', group: 'Sender', default: '' },
    { key: 'senderTitle', label: 'Your title', type: 'text', group: 'Sender', default: '' },
    { key: 'accentColor', label: 'Button', type: 'color', group: 'Colours', default: '#2563eb' },
    ...footerFields(),
  ],
  render(v) {
    const accent = safeColor(v.accentColor, '#2563eb');
    return emailDocument({
      title: v.brandName,
      preheader: String(v.body || '').split('\n').find((l) => l.trim() && !/^hi\b|^hello\b|^dear\b/i.test(l.trim())) || '',
      rows: [
        row(logoOrName({ logoUrl: v.logoUrl, brandName: v.brandName, color: '#111827', size: 18 }), { padding: '32px 40px 8px' }),
        spacer(20),
        row(paragraphs(v.body, textStyle({ size: 16, color: '#1f2937', line: 1.7 }))),
        v.ctaLabel ? row(button({ label: v.ctaLabel, url: v.ctaUrl, bg: accent, align: 'left', size: 15 }), { padding: '8px 40px 0' }) : '',
        spacer(26),
        v.senderName ? row(`<p style="margin:0;${textStyle({ size: 16, color: '#111827', weight: 700 })}">${esc(v.senderName)}</p>${v.senderTitle ? `<p style="margin:2px 0 0;${textStyle({ size: 14, color: '#6b7280' })}">${esc(v.senderTitle)}</p>` : ''}`) : '',
        spacer(18),
        `<tr><td class="px" style="padding:0 40px;"><div style="height:1px;line-height:1px;font-size:0;background-color:#e5e7eb;">&nbsp;</div></td></tr>`,
        footer({ brandName: v.brandName, address: v.address, note: v.footerNote, align: 'left' }),
      ],
    });
  },
};

export const EMAIL_DESIGN_TEMPLATES = [spotlight, announcement, offer, newsletter, eventInvite, welcome, festive, letter];
