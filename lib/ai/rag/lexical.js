/**
 * Keyword ranking for the AI knowledge base (pure — no database).
 *
 * BM25 over a business's knowledge chunks with light stemming and a small
 * English/Hinglish synonym map, so "kitne ka hai", "charges" and "pricing" all reach the
 * price chunk even when no embedding provider is configured (e.g. a Grok-only setup).
 * Used alone when embeddings are unavailable, and fused with vector ranking otherwise.
 */

const STOPWORDS = new Set(`a an the is are was were be been am i me my we our you your he she it its they them their this that these those
to of in on at for from by with about as into over under and or but if then so not no do does did can could would should will
shall may might have has had what which who whom whose when where why how all any some each other more most very just also than
too only own same such there here up down out off again once please hi hello hey ok okay thanks thank
hai hain ho hu hun ka ki ke ko se me mein par pe aur ya bhi to toh kya kyu kyun kaise kab kaha kahan yeh ye woh wo jo
na nahi nahin haan ha ji sir mam ma'am bhai`.split(/\s+/));

// Each group: words that mean the same thing to a customer.
const SYNONYM_GROUPS = [
  ['price', 'pricing', 'cost', 'costs', 'rate', 'rates', 'charge', 'charges', 'fee', 'fees', 'plan', 'plans', 'subscription', 'kitna', 'kitne', 'kitni', 'paisa', 'paise', 'rupees', 'rs', 'inr', 'budget', 'quote', 'quotation'],
  ['demo', 'trial', 'walkthrough', 'presentation', 'test'],
  ['book', 'booking', 'appointment', 'schedule', 'slot', 'meeting', 'call', 'callback'],
  ['whatsapp', 'wa', 'whats'],
  ['instagram', 'insta', 'ig'],
  ['email', 'mail', 'gmail'],
  ['support', 'help', 'assist', 'assistance', 'issue', 'problem', 'madad'],
  ['refund', 'cancel', 'cancellation', 'return', 'money back'],
  ['discount', 'offer', 'deal', 'coupon', 'sale'],
  ['setup', 'onboarding', 'install', 'installation', 'configure', 'integration', 'connect'],
  ['time', 'timing', 'hours', 'open', 'close', 'kab'],
  ['location', 'address', 'where', 'kahan', 'office'],
  ['contact', 'phone', 'number', 'mobile'],
  ['lead', 'leads', 'enquiry', 'enquiries', 'inquiry', 'inquiries', 'customer', 'customers', 'prospect'],
  ['follow', 'followup', 'follow-up', 'reminder', 'reminders', 'sequence', 'sequences'],
  ['automation', 'automations', 'automatic', 'auto', 'workflow', 'workflows', 'bot', 'chatbot'],
  ['crm', 'pipeline', 'sales'],
  ['team', 'agent', 'agents', 'user', 'users', 'seat', 'seats', 'member', 'members'],
  ['payment', 'pay', 'invoice', 'bill', 'billing', 'upi'],
];

/** Light English stemmer: enough to match plurals and -ing/-ed forms. */
export function stem(word) {
  let w = word;
  if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith('ied')) w = `${w.slice(0, -3)}y`;
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
  else if (w.length > 4 && w.endsWith('ies')) w = `${w.slice(0, -3)}y`;
  else if (w.length > 4 && w.endsWith('es') && /(s|x|z|ch|sh)es$/.test(w)) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
  return w;
}

const SYNONYM_OF = new Map();
for (const group of SYNONYM_GROUPS) {
  const canonical = stem(group[0]);
  for (const g of group) SYNONYM_OF.set(stem(g), canonical);
}

/** Tokenise to stemmed, synonym-normalised terms (stopwords removed). */
export function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9ऀ-ॿ]+/)
    .filter((t) => t && t.length > 1 && !STOPWORDS.has(t))
    .map((t) => {
      const s = stem(t);
      return SYNONYM_OF.get(s) || s;
    });
}

/**
 * BM25 ranking.
 * @param chunks [{ content, metadata? }]
 * @returns [{ chunk, score }] best first, only chunks sharing at least one term
 */
export function bm25Rank(chunks, query, { k1 = 1.4, b = 0.75 } = {}) {
  const qTerms = [...new Set(tokenize(query))];
  if (!qTerms.length || !chunks?.length) return [];

  const docs = chunks.map((c) => {
    // FAQ questions / titles count double — they say what the chunk is about.
    const title = [c.metadata?.question, c.metadata?.title, c.metadata?.sourceName].filter(Boolean).join(' ');
    const terms = tokenize(`${title} ${title} ${c.content || ''}`);
    const tf = new Map();
    for (const t of terms) tf.set(t, (tf.get(t) || 0) + 1);
    return { c, tf, len: terms.length || 1 };
  });
  const avgLen = docs.reduce((s, d) => s + d.len, 0) / docs.length;
  const df = new Map();
  for (const t of qTerms) df.set(t, docs.filter((d) => d.tf.has(t)).length);

  const phrase = String(query || '').toLowerCase().trim();
  const out = [];
  for (const d of docs) {
    let score = 0;
    let matched = 0;
    for (const t of qTerms) {
      const f = d.tf.get(t);
      if (!f) continue;
      matched++;
      const n = df.get(t) || 0;
      const idf = Math.log(1 + (docs.length - n + 0.5) / (n + 0.5));
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.len) / avgLen)));
    }
    if (!matched) continue;
    score *= 1 + 0.25 * (matched / qTerms.length); // reward covering more of the question
    if (phrase.length > 6 && String(d.c.content || '').toLowerCase().includes(phrase)) score *= 1.5;
    out.push({ chunk: d.c, score });
  }
  return out.sort((a, b2) => b2.score - a.score);
}

/** Reciprocal-rank fusion of several ranked id lists → fused order of ids. */
export function reciprocalRankFusion(lists, k = 60) {
  const scores = new Map();
  for (const list of lists) {
    list.forEach((id, i) => scores.set(id, (scores.get(id) || 0) + 1 / (k + i + 1)));
  }
  return [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}
