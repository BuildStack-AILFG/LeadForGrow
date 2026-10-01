import {
  EMAIL_ASSET_BASE, esc, safeUrl, safeColor, paragraphs, textStyle, spacer, row, image, button,
  logoOrName, footer, emailDocument,
} from './blocks.js';
import { brandFields, footerFields } from './templates.js';

/**
 * Festival & seasonal offer templates. They share one layout — hero artwork,
 * greeting, message, an offer card with a coupon code, a button and a
 * validity line — and differ in palette, artwork and copy. Every colour is an
 * editable field, so a business can re-skin any of them to its brand.
 */

function festivalOffer(theme) {
  const c = theme.colors;
  return {
    id: theme.id,
    name: theme.name,
    category: 'Festivals',
    description: theme.description,
    swatch: [c.bg, c.accent, c.card],
    fields: [
      ...brandFields(),
      { key: 'heroImage', label: 'Festive image', type: 'image', group: 'Greeting', default: `${EMAIL_ASSET_BASE}/${theme.art}`, help: 'Wide image, 1200 × 600 px works best.' },
      { key: 'eyebrow', label: 'Small label', type: 'text', group: 'Greeting', default: theme.copy.eyebrow },
      { key: 'title', label: 'Headline', type: 'text', group: 'Greeting', default: theme.copy.title },
      { key: 'body', label: 'Message', type: 'textarea', group: 'Greeting', default: theme.copy.body },
      { key: 'amount', label: 'Offer (big text)', type: 'text', group: 'Offer', default: theme.copy.amount },
      { key: 'offerLine', label: 'Offer details', type: 'text', group: 'Offer', default: theme.copy.offerLine },
      { key: 'code', label: 'Coupon code (optional)', type: 'text', group: 'Offer', default: theme.copy.code },
      { key: 'ctaLabel', label: 'Button label', type: 'text', group: 'Offer', default: theme.copy.cta },
      { key: 'ctaUrl', label: 'Button link', type: 'url', group: 'Offer', default: '' },
      { key: 'validity', label: 'Validity line', type: 'text', group: 'Offer', default: theme.copy.validity },
      { key: 'signoff', label: 'Sign-off', type: 'text', group: 'Greeting', default: theme.copy.signoff },
      { key: 'bgColor', label: 'Background', type: 'color', group: 'Colours', default: c.bg },
      { key: 'textColor', label: 'Text', type: 'color', group: 'Colours', default: c.text },
      { key: 'accentColor', label: 'Accent', type: 'color', group: 'Colours', default: c.accent },
      { key: 'cardColor', label: 'Offer card', type: 'color', group: 'Colours', default: c.card },
      { key: 'buttonTextColor', label: 'Button text', type: 'color', group: 'Colours', default: c.buttonText },
      ...footerFields(),
    ],
    render(v) {
      const bg = safeColor(v.bgColor, c.bg);
      const fg = safeColor(v.textColor, c.text);
      const accent = safeColor(v.accentColor, c.accent);
      const card = safeColor(v.cardColor, c.card);
      const btnText = safeColor(v.buttonTextColor, c.buttonText);
      const muted = c.muted;
      const offerCard = (v.amount || v.offerLine || v.code) ? row(`<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="${card}" style="background-color:${card};border-radius:14px;border:1px solid ${accent};"><tr><td align="center" style="padding:24px 24px 26px;">
${v.amount ? `<p class="big" style="margin:0;${textStyle({ size: 46, color: c.cardInk, weight: 800, line: 1.05, align: 'center' })}letter-spacing:-0.02em;">${esc(v.amount)}</p>` : ''}
${v.offerLine ? `<p style="margin:8px 0 0;${textStyle({ size: 15, color: c.cardInk, weight: 600, line: 1.45, align: 'center' })}">${esc(v.offerLine)}</p>` : ''}
${v.code ? `<table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin:16px auto 0;"><tr><td align="center" style="padding:10px 20px;border:2px dashed ${accent};border-radius:8px;background-color:#ffffff;${textStyle({ size: 18, color: '#111827', weight: 800, line: 1, align: 'center' })}letter-spacing:.14em;">${esc(v.code)}</td></tr></table>` : ''}
</td></tr></table>`, { align: 'center' }) : '';
      return emailDocument({
        title: v.title,
        preheader: [v.amount, v.title].filter(Boolean).join(' — '),
        pageBg: c.page,
        containerBg: bg,
        rows: [
          row(logoOrName({ logoUrl: v.logoUrl, brandName: v.brandName, color: accent, align: 'center', size: 17 }), { padding: '22px 40px 18px', align: 'center' }),
          v.heroImage ? `<tr><td>${image({ src: v.heroImage, alt: v.title })}</td></tr>` : '',
          spacer(30),
          v.eyebrow ? row(`<p style="margin:0 0 10px;${textStyle({ size: 12, color: accent, weight: 700, align: 'center' })}letter-spacing:.16em;">${esc(v.eyebrow)}</p>`, { align: 'center' }) : '',
          row(`<p class="h1" style="margin:0;${textStyle({ size: 32, color: fg, weight: 800, line: 1.2, align: 'center' })}letter-spacing:-0.01em;">${esc(v.title)}</p>`, { align: 'center' }),
          spacer(14),
          row(paragraphs(v.body, textStyle({ size: 16, color: muted, line: 1.7, align: 'center' })), { align: 'center' }),
          spacer(6),
          offerCard,
          spacer(24),
          row(button({ label: v.ctaLabel, url: v.ctaUrl, bg: accent, color: btnText, radius: 999 }), { align: 'center' }),
          spacer(12),
          v.validity ? row(`<p style="margin:0;${textStyle({ size: 13, color: muted, align: 'center' })}">${esc(v.validity)}</p>`, { align: 'center' }) : '',
          spacer(22),
          v.signoff ? row(`<p style="margin:0;${textStyle({ size: 14, color: muted, line: 1.6, align: 'center' })}font-style:italic;">${esc(v.signoff)}</p>`, { align: 'center' }) : '',
          spacer(8),
          footer({ brandName: v.brandName, address: v.address, note: v.footerNote, textColor: muted, linkColor: fg }),
        ],
      });
    },
  };
}

const THEMES = [
  {
    id: 'gandhi-jayanti',
    name: 'Gandhi Jayanti offer',
    description: 'Calm khadi tones with spectacles and a charkha — for a 2 October offer.',
    art: 'gandhi-jayanti.png',
    colors: { page: '#ece6d8', bg: '#fbf7ee', text: '#2f2a22', muted: '#5b5345', accent: '#15803d', card: '#f1ead9', cardInk: '#2f2a22', buttonText: '#ffffff' },
    copy: {
      eyebrow: 'GANDHI JAYANTI · 2 OCTOBER',
      title: 'Simple living, honest prices',
      body: 'This Gandhi Jayanti we\'re celebrating the ideas of simplicity and self-reliance — with a thoughtful offer for you, {{name}}.',
      amount: '20% OFF',
      offerLine: 'On all services booked between 1 and 3 October',
      code: 'OCT2SPECIAL',
      cta: 'Book with the offer',
      validity: 'Valid till 3 October, 11:59 pm.',
      signoff: 'Warm regards, the {{business.name}} team',
    },
  },
  {
    id: 'diwali-offer',
    name: 'Diwali sale',
    description: 'Night-sky Diwali sale with lanterns, diyas and a gold offer card.',
    art: 'diwali-offer.jpg',
    colors: { page: '#e9e3f0', bg: '#1c0a2e', text: '#fde68a', muted: '#e9d5ff', accent: '#f59e0b', card: '#2e1247', cardInk: '#fde68a', buttonText: '#1c0a2e' },
    copy: {
      eyebrow: 'DIWALI DHAMAKA',
      title: 'Light up your Diwali with our biggest offer',
      body: 'Dear {{name}}, this festival of lights we\'re saying thank you with our best prices of the year. Wishing you and your family a bright and prosperous Diwali.',
      amount: 'UP TO 40% OFF',
      offerLine: 'On every service and package this Diwali week',
      code: 'DIWALI40',
      cta: 'Grab the Diwali offer',
      validity: 'Offer ends on Bhai Dooj, 11:59 pm.',
      signoff: 'Shubh Deepavali from the {{business.name}} family',
    },
  },
  {
    id: 'navratri',
    name: 'Navratri special',
    description: 'Bright garba colours with dandiya sticks and a marigold toran.',
    art: 'navratri.png',
    colors: { page: '#fce7ef', bg: '#fff7f9', text: '#831843', muted: '#6b2a4a', accent: '#db2777', card: '#ffe4ec', cardInk: '#831843', buttonText: '#ffffff' },
    copy: {
      eyebrow: 'NAVRATRI SPECIAL',
      title: 'Nine nights of celebration, one special offer',
      body: 'Hi {{name}}, may Maa Durga bless you with joy and success. Celebrate the season with an offer made for you.',
      amount: '15% OFF',
      offerLine: 'All nine days of Navratri',
      code: 'NAVRATRI15',
      cta: 'Celebrate with us',
      validity: 'Valid until Dussehra.',
      signoff: 'Happy Navratri from the {{business.name}} team',
    },
  },
  {
    id: 'christmas',
    name: 'Christmas offer',
    description: 'Evergreen and red with a tree, ornaments and gifts.',
    art: 'christmas.png',
    colors: { page: '#e4ece8', bg: '#0f3d2e', text: '#ffffff', muted: '#d1fae5', accent: '#dc2626', card: '#14513c', cardInk: '#fef3c7', buttonText: '#ffffff' },
    copy: {
      eyebrow: 'SEASON\'S GREETINGS',
      title: 'Merry Christmas, {{name}}!',
      body: 'Thank you for a wonderful year together. Here\'s a little gift from us to make the season merrier.',
      amount: '25% OFF',
      offerLine: 'Our Christmas gift to you',
      code: 'XMAS25',
      cta: 'Unwrap your gift',
      validity: 'Valid until 31 December.',
      signoff: 'Warm wishes from all of us at {{business.name}}',
    },
  },
  {
    id: 'new-year',
    name: 'New Year offer',
    description: 'Midnight blue and gold with fireworks — start the year with an offer.',
    art: 'new-year.png',
    colors: { page: '#e2e6f0', bg: '#0b1437', text: '#ffffff', muted: '#c7d2fe', accent: '#fbbf24', card: '#16215a', cardInk: '#fde68a', buttonText: '#0b1437' },
    copy: {
      eyebrow: 'HAPPY NEW YEAR',
      title: 'New year, new goals — we\'re here to help',
      body: 'Hi {{name}}, thank you for being with us. Start the year right with a special offer on everything we do.',
      amount: '30% OFF',
      offerLine: 'On your first booking of the year',
      code: 'NEWYEAR30',
      cta: 'Start the year right',
      validity: 'Valid until 15 January.',
      signoff: 'Cheers to a great year ahead — {{business.name}}',
    },
  },
  {
    id: 'holi',
    name: 'Holi offer',
    description: 'Bursts of gulal colour on white — playful and bright.',
    art: 'holi.png',
    colors: { page: '#f3f0fa', bg: '#ffffff', text: '#4c1d95', muted: '#4b5563', accent: '#db2777', card: '#fdf2f8', cardInk: '#831843', buttonText: '#ffffff' },
    copy: {
      eyebrow: 'HAPPY HOLI',
      title: 'Add more colour to your Holi',
      body: 'Hi {{name}}, may your life be filled with colour, laughter and sweets. Here\'s a bright little offer to celebrate.',
      amount: '20% OFF',
      offerLine: 'On everything this Holi weekend',
      code: 'HOLI20',
      cta: 'Play with colours',
      validity: 'Valid for 3 days only.',
      signoff: 'Bura na mano, Holi hai! — {{business.name}}',
    },
  },
  {
    id: 'independence-day',
    name: 'Independence Day sale',
    description: 'Saffron, white and green with kites and the Ashoka Chakra.',
    art: 'independence-day.png',
    colors: { page: '#eef2f7', bg: '#ffffff', text: '#0b2a6f', muted: '#374151', accent: '#ea580c', card: '#f0fdf4', cardInk: '#14532d', buttonText: '#ffffff' },
    copy: {
      eyebrow: 'HAPPY INDEPENDENCE DAY',
      title: 'Celebrate the spirit of freedom',
      body: 'Hi {{name}}, on this Independence Day we salute everyone who makes our nation proud. Enjoy a special freedom offer from us.',
      amount: 'FLAT 15% OFF',
      offerLine: 'Freedom sale — 13 to 15 August',
      code: 'FREEDOM15',
      cta: 'Shop the freedom sale',
      validity: 'Valid till 15 August, 11:59 pm.',
      signoff: 'Jai Hind — the {{business.name}} team',
    },
  },
  {
    id: 'eid',
    name: 'Eid offer',
    description: 'Deep teal and gold with a crescent moon and lanterns.',
    art: 'eid.png',
    colors: { page: '#e3eeec', bg: '#0f3b3a', text: '#fef3c7', muted: '#ccfbf1', accent: '#d4a017', card: '#134e4a', cardInk: '#fef3c7', buttonText: '#0f3b3a' },
    copy: {
      eyebrow: 'EID MUBARAK',
      title: 'Wishing you peace, joy and blessings',
      body: 'Dear {{name}}, may this Eid bring happiness to you and your loved ones. Celebrate with a special offer from us.',
      amount: '20% OFF',
      offerLine: 'Our Eid gift to you',
      code: 'EID20',
      cta: 'Celebrate Eid with us',
      validity: 'Valid for one week.',
      signoff: 'Eid Mubarak from the {{business.name}} family',
    },
  },
  {
    id: 'raksha-bandhan',
    name: 'Raksha Bandhan offer',
    description: 'Warm saffron and red with a rakhi — for siblings and gifting.',
    art: 'raksha-bandhan.png',
    colors: { page: '#f7ece2', bg: '#fff8f1', text: '#7c2d12', muted: '#57534e', accent: '#e11d48', card: '#ffedd5', cardInk: '#7c2d12', buttonText: '#ffffff' },
    copy: {
      eyebrow: 'HAPPY RAKSHA BANDHAN',
      title: 'Celebrate the bond that lasts forever',
      body: 'Hi {{name}}, make this Raksha Bandhan extra special. Gift your sibling something they\'ll love — with a little help from us.',
      amount: '10% OFF',
      offerLine: 'On gifts and gift vouchers',
      code: 'RAKHI10',
      cta: 'Find the perfect gift',
      validity: 'Valid till Raksha Bandhan.',
      signoff: 'With love, the {{business.name}} team',
    },
  },
];

// ---------------------------------------------------------------------------

const megaSale = {
  id: 'mega-sale',
  name: 'Mega sale',
  category: 'Promotion',
  description: 'Loud black-and-yellow sale layout — Black Friday, end of season, anniversary sale.',
  swatch: ['#0a0a0a', '#facc15', '#ffffff'],
  fields: [
    ...brandFields(),
    { key: 'kicker', label: 'Small label', type: 'text', group: 'Sale', default: 'THE BIGGEST SALE OF THE YEAR' },
    { key: 'headline', label: 'Big word', type: 'text', group: 'Sale', default: 'MEGA SALE' },
    { key: 'amount', label: 'Discount', type: 'text', group: 'Sale', default: 'UP TO 50% OFF' },
    { key: 'dates', label: 'Dates', type: 'text', group: 'Sale', default: 'Friday to Sunday only' },
    { key: 'body', label: 'Message', type: 'textarea', group: 'Sale', default: 'Hi {{name}}, three days, our lowest prices ever, on everything. When it\'s gone, it\'s gone.' },
    { key: 'ctaLabel', label: 'Button label', type: 'text', group: 'Sale', default: 'Shop the sale' },
    { key: 'ctaUrl', label: 'Button link', type: 'url', group: 'Sale', default: '' },
    ...[1, 2, 3].flatMap((i) => [
      { key: `deal${i}Title`, label: `Deal ${i} — name`, type: 'text', group: 'Top deals', default: ['Full service', 'Annual plan', 'Gift vouchers'][i - 1] },
      { key: `deal${i}Price`, label: `Deal ${i} — price`, type: 'text', group: 'Top deals', default: ['₹1,999', '₹9,999', 'Buy 2 get 1'][i - 1] },
    ]),
    { key: 'bgColor', label: 'Background', type: 'color', group: 'Colours', default: '#0a0a0a' },
    { key: 'accentColor', label: 'Highlight', type: 'color', group: 'Colours', default: '#facc15' },
    ...footerFields({ footerNote: 'While stocks last. Cannot be combined with other offers.' }),
  ],
  render(v) {
    const bg = safeColor(v.bgColor, '#0a0a0a');
    const hi = safeColor(v.accentColor, '#facc15');
    const deals = [1, 2, 3].filter((i) => v[`deal${i}Title`]).map((i) => `<td class="stack${i > 1 ? ' stack-gap' : ''}" width="33%" valign="top" style="padding:0 6px;">
<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border:1px solid #3f3f46;border-radius:10px;"><tr><td align="center" style="padding:18px 10px;">
<p style="margin:0;${textStyle({ size: 13, color: '#d4d4d8', align: 'center' })}">${esc(v[`deal${i}Title`])}</p>
<p style="margin:6px 0 0;${textStyle({ size: 20, color: hi, weight: 800, line: 1.2, align: 'center' })}">${esc(v[`deal${i}Price`])}</p>
</td></tr></table></td>`).join('');
    return emailDocument({
      title: v.headline,
      preheader: `${v.amount} — ${v.dates}`,
      pageBg: '#27272a',
      containerBg: bg,
      rows: [
        row(logoOrName({ logoUrl: v.logoUrl, brandName: v.brandName, color: '#ffffff', align: 'center', size: 17 }), { padding: '24px 40px', align: 'center' }),
        row(`<p style="margin:0;${textStyle({ size: 12, color: hi, weight: 700, align: 'center' })}letter-spacing:.2em;">${esc(v.kicker)}</p>`, { align: 'center', padding: '12px 40px 0' }),
        row(`<p class="big" style="margin:10px 0 0;${textStyle({ size: 64, color: '#ffffff', weight: 900, line: 1, align: 'center' })}letter-spacing:-0.03em;">${esc(v.headline)}</p>`, { align: 'center' }),
        spacer(18),
        row(`<table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center"><tr><td bgcolor="${hi}" style="background-color:${hi};padding:12px 22px;${textStyle({ size: 24, color: '#0a0a0a', weight: 900, line: 1.1, align: 'center' })}">${esc(v.amount)}</td></tr></table>`, { align: 'center' }),
        spacer(14),
        row(`<p style="margin:0;${textStyle({ size: 14, color: '#e4e4e7', weight: 600, align: 'center' })}text-transform:uppercase;letter-spacing:.1em;">${esc(v.dates)}</p>`, { align: 'center' }),
        spacer(22),
        row(paragraphs(v.body, textStyle({ size: 16, color: '#d4d4d8', line: 1.65, align: 'center' })), { align: 'center' }),
        spacer(6),
        row(button({ label: v.ctaLabel, url: v.ctaUrl, bg: hi, color: '#0a0a0a', radius: 4, size: 17 }), { align: 'center' }),
        spacer(32),
        deals ? row(`<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"><tr>${deals}</tr></table>`, { padding: '0 34px' }) : '',
        spacer(20),
        footer({ brandName: v.brandName, address: v.address, note: v.footerNote, textColor: '#a1a1aa', linkColor: '#ffffff' }),
      ],
    });
  },
};

const birthday = {
  id: 'birthday',
  name: 'Birthday wish',
  category: 'Customer care',
  description: 'Cheerful birthday greeting with a gift code — great for automations.',
  swatch: ['#fdf2f8', '#be185d', '#7c3aed'],
  fields: [
    ...brandFields(),
    { key: 'heroImage', label: 'Image', type: 'image', group: 'Greeting', default: `${EMAIL_ASSET_BASE}/birthday.png` },
    { key: 'title', label: 'Headline', type: 'text', group: 'Greeting', default: 'Happy birthday, {{name}}!' },
    { key: 'body', label: 'Message', type: 'textarea', group: 'Greeting', default: 'Wishing you a year full of good health, happiness and success. To celebrate, here\'s a gift from all of us.' },
    { key: 'gift', label: 'Gift', type: 'text', group: 'Gift', default: 'A birthday treat: 15% off' },
    { key: 'code', label: 'Gift code', type: 'text', group: 'Gift', default: 'BDAY15' },
    { key: 'ctaLabel', label: 'Button label', type: 'text', group: 'Gift', default: 'Claim my gift' },
    { key: 'ctaUrl', label: 'Button link', type: 'url', group: 'Gift', default: '' },
    { key: 'validity', label: 'Validity', type: 'text', group: 'Gift', default: 'Valid for 30 days.' },
    { key: 'accentColor', label: 'Accent', type: 'color', group: 'Colours', default: '#be185d' },
    { key: 'bgColor', label: 'Background', type: 'color', group: 'Colours', default: '#fdf2f8' },
    ...footerFields(),
  ],
  render(v) {
    const accent = safeColor(v.accentColor, '#be185d');
    const bg = safeColor(v.bgColor, '#fdf2f8');
    return emailDocument({
      title: v.title,
      preheader: v.gift,
      pageBg: '#f5f0f5',
      containerBg: bg,
      rows: [
        row(logoOrName({ logoUrl: v.logoUrl, brandName: v.brandName, color: accent, align: 'center', size: 17 }), { padding: '24px 40px 16px', align: 'center' }),
        v.heroImage ? `<tr><td>${image({ src: v.heroImage, alt: v.title })}</td></tr>` : '',
        spacer(28),
        row(`<p class="h1" style="margin:0;${textStyle({ size: 34, color: '#500724', weight: 800, line: 1.15, align: 'center' })}">${esc(v.title)}</p>`, { align: 'center' }),
        spacer(12),
        row(paragraphs(v.body, textStyle({ size: 16, color: '#6b2140', line: 1.65, align: 'center' })), { align: 'center' }),
        spacer(4),
        row(`<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="background-color:#ffffff;border-radius:14px;"><tr><td align="center" style="padding:22px;">
<p style="margin:0;${textStyle({ size: 18, color: '#500724', weight: 700, align: 'center' })}">${esc(v.gift)}</p>
${v.code ? `<p style="margin:12px 0 0;${textStyle({ size: 22, color: accent, weight: 800, line: 1, align: 'center' })}letter-spacing:.14em;">${esc(v.code)}</p>` : ''}
</td></tr></table>`),
        spacer(24),
        row(button({ label: v.ctaLabel, url: v.ctaUrl, bg: accent, radius: 999 }), { align: 'center' }),
        spacer(12),
        v.validity ? row(`<p style="margin:0;${textStyle({ size: 13, color: '#9d4b6b', align: 'center' })}">${esc(v.validity)}</p>`, { align: 'center' }) : '',
        spacer(20),
        footer({ brandName: v.brandName, address: v.address, note: v.footerNote, textColor: '#9d4b6b', linkColor: '#500724' }),
      ],
    });
  },
};

const feedback = {
  id: 'feedback',
  name: 'Review request',
  category: 'Customer care',
  description: 'Asks for a rating with five tappable stars that open your review page.',
  swatch: ['#eff6ff', '#f59e0b', '#1d4ed8'],
  fields: [
    ...brandFields(),
    { key: 'heroImage', label: 'Image', type: 'image', group: 'Request', default: `${EMAIL_ASSET_BASE}/feedback.png` },
    { key: 'title', label: 'Headline', type: 'text', group: 'Request', default: 'How did we do, {{name}}?' },
    { key: 'body', label: 'Message', type: 'textarea', group: 'Request', default: 'Thank you for choosing us. Your feedback takes 30 seconds and helps other customers find us — and helps us get better.' },
    { key: 'reviewUrl', label: 'Review page link', type: 'url', group: 'Request', default: 'https://', help: 'E.g. your Google review link. Every star opens this page.' },
    { key: 'ctaLabel', label: 'Button label', type: 'text', group: 'Request', default: 'Write a quick review' },
    { key: 'signoff', label: 'Sign-off', type: 'text', group: 'Request', default: 'Thank you — the {{business.name}} team' },
    { key: 'accentColor', label: 'Button', type: 'color', group: 'Colours', default: '#1d4ed8' },
    { key: 'starColor', label: 'Stars', type: 'color', group: 'Colours', default: '#f59e0b' },
    ...footerFields(),
  ],
  render(v) {
    const accent = safeColor(v.accentColor, '#1d4ed8');
    const star = safeColor(v.starColor, '#f59e0b');
    const url = esc(safeUrl(v.reviewUrl));
    const stars = [1, 2, 3, 4, 5].map((n) => `<td align="center" style="padding:0 4px;"><a href="${url}" target="_blank" title="${n} star${n > 1 ? 's' : ''}" style="${textStyle({ size: 38, color: star, line: 1, align: 'center' })}text-decoration:none;">&#9733;</a></td>`).join('');
    return emailDocument({
      title: v.title,
      preheader: v.body,
      rows: [
        row(logoOrName({ logoUrl: v.logoUrl, brandName: v.brandName, color: accent, align: 'center', size: 17 }), { padding: '24px 40px', align: 'center' }),
        v.heroImage ? `<tr><td>${image({ src: v.heroImage, alt: '' })}</td></tr>` : '',
        spacer(28),
        row(`<p class="h1" style="margin:0;${textStyle({ size: 30, color: '#111827', weight: 800, line: 1.2, align: 'center' })}">${esc(v.title)}</p>`, { align: 'center' }),
        spacer(12),
        row(paragraphs(v.body, textStyle({ size: 16, color: '#4b5563', line: 1.65, align: 'center' })), { align: 'center' }),
        row(`<table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto;"><tr>${stars}</tr></table>`, { align: 'center', padding: '4px 40px 20px' }),
        row(button({ label: v.ctaLabel, url: v.reviewUrl, bg: accent }), { align: 'center' }),
        spacer(24),
        v.signoff ? row(`<p style="margin:0;${textStyle({ size: 14, color: '#6b7280', align: 'center' })}">${esc(v.signoff)}</p>`, { align: 'center' }) : '',
        spacer(8),
        footer({ brandName: v.brandName, address: v.address, note: v.footerNote }),
      ],
    });
  },
};

const winBack = {
  id: 'win-back',
  name: 'We miss you',
  category: 'Customer care',
  description: 'Win back customers who haven\'t visited in a while, with a comeback offer.',
  swatch: ['#fffbeb', '#b45309', '#111827'],
  fields: [
    ...brandFields(),
    { key: 'heroImage', label: 'Image', type: 'image', group: 'Message', default: `${EMAIL_ASSET_BASE}/win-back.png` },
    { key: 'title', label: 'Headline', type: 'text', group: 'Message', default: 'It\'s been a while, {{name}}' },
    { key: 'body', label: 'Message', type: 'textarea', group: 'Message', default: 'We haven\'t seen you in some time and wanted to check in. A lot has improved since your last visit — and we\'d love to have you back.' },
    { key: 'offer', label: 'Comeback offer', type: 'text', group: 'Offer', default: '₹500 off your next booking' },
    { key: 'code', label: 'Code', type: 'text', group: 'Offer', default: 'COMEBACK500' },
    { key: 'ctaLabel', label: 'Button label', type: 'text', group: 'Offer', default: 'Come back and save' },
    { key: 'ctaUrl', label: 'Button link', type: 'url', group: 'Offer', default: '' },
    { key: 'validity', label: 'Validity', type: 'text', group: 'Offer', default: 'Valid for 14 days.' },
    { key: 'accentColor', label: 'Accent', type: 'color', group: 'Colours', default: '#b45309' },
    ...footerFields(),
  ],
  render(v) {
    const accent = safeColor(v.accentColor, '#b45309');
    return emailDocument({
      title: v.title,
      preheader: v.offer,
      pageBg: '#f5f1e8',
      containerBg: '#fffbeb',
      rows: [
        row(logoOrName({ logoUrl: v.logoUrl, brandName: v.brandName, color: '#111827', size: 17 }), { padding: '26px 40px 18px' }),
        v.heroImage ? row(image({ src: v.heroImage, alt: '', width: 520, radius: 12 })) : '',
        spacer(26),
        row(`<p class="h1" style="margin:0 0 12px;${textStyle({ size: 30, color: '#111827', weight: 800, line: 1.2 })}">${esc(v.title)}</p>${paragraphs(v.body, textStyle({ size: 16, color: '#44403c', line: 1.7 }))}`),
        row(`<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-left:4px solid ${accent};background-color:#fef3c7;" bgcolor="#fef3c7"><tr><td style="padding:16px 20px;">
<p style="margin:0;${textStyle({ size: 17, color: '#78350f', weight: 700 })}">${esc(v.offer)}</p>
${v.code ? `<p style="margin:6px 0 0;${textStyle({ size: 14, color: '#78350f' })}">Use code <strong style="letter-spacing:.08em;">${esc(v.code)}</strong></p>` : ''}
</td></tr></table>`),
        spacer(22),
        row(button({ label: v.ctaLabel, url: v.ctaUrl, bg: accent, align: 'left' })),
        spacer(10),
        v.validity ? row(`<p style="margin:0;${textStyle({ size: 13, color: '#78716c' })}">${esc(v.validity)}</p>`) : '',
        spacer(18),
        footer({ brandName: v.brandName, address: v.address, note: v.footerNote, textColor: '#78716c', linkColor: '#111827', align: 'left' }),
      ],
    });
  },
};

export const FESTIVAL_TEMPLATES = THEMES.map(festivalOffer);
export const LIFECYCLE_TEMPLATES = [megaSale, birthday, feedback, winBack];
