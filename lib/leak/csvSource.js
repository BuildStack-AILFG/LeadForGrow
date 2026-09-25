/**
 * Leak Audit from another CRM's export (Zoho, HubSpot, LeadSquared,
 * Pipedrive, Salesforce, a plain Excel sheet ...).
 *
 * Pure functions: the admin page parses the CSV in the browser and calls these,
 * so a prospect's file is never uploaded to our server.
 */

// Our fields, what each rule needs, and the header names CRMs commonly use.
export const CSV_FIELDS = [
  { key: 'createdAt', label: 'Lead created date', required: true,
    synonyms: ['created time', 'created at', 'created on', 'create date', 'created date', 'lead created', 'date created', 'creation date', 'enquiry date', 'inquiry date', 'lead date', 'created', 'date'] },
  { key: 'firstContactAt', label: 'First contact / first reply date', rules: ['R1'],
    synonyms: ['first contact', 'first contacted', 'first contacted date', 'first activity', 'first activity date', 'first response', 'first response time', 'first call', 'first call date', 'date of first engagement', 'first engagement', 'first touch'] },
  { key: 'lastActivityAt', label: 'Last activity date', rules: ['R4'],
    synonyms: ['last activity', 'last activity time', 'last activity date', 'last contacted', 'last contacted date', 'last engagement', 'last engagement date', 'last touch', 'last call', 'last activity on'] },
  { key: 'nextFollowUpAt', label: 'Next follow-up date', rules: ['R3'],
    synonyms: ['next follow up', 'next followup', 'next follow up date', 'follow up date', 'followup date', 'next activity date', 'next activity', 'next call', 'callback date', 'reminder date'] },
  { key: 'status', label: 'Status / stage', rules: ['R5'],
    synonyms: ['lead status', 'status', 'lead stage', 'stage', 'lifecycle stage', 'deal stage', 'pipeline stage', 'disposition'] },
  { key: 'attempts', label: 'Number of attempts / calls', rules: ['R1', 'R5'],
    synonyms: ['attempts', 'call attempts', 'number of sales activities', 'total activities', 'activities', 'activity count', 'no of calls', 'number of calls', 'calls made', 'touches'] },
  { key: 'lastCustomerMessageAt', label: 'Last message from customer', rules: ['R2'],
    synonyms: ['last incoming', 'last incoming message', 'last customer message', 'last inbound', 'last received', 'last reply from customer'] },
  { key: 'lastReplyAt', label: 'Last reply sent to customer', rules: ['R2'],
    synonyms: ['last outgoing', 'last outgoing message', 'last reply', 'last reply sent', 'last sent', 'last response'] },
  { key: 'owner', label: 'Owner / salesperson',
    synonyms: ['lead owner', 'contact owner', 'deal owner', 'owner', 'owner name', 'assigned to', 'sales owner', 'sales rep', 'salesperson', 'counsellor', 'counselor', 'agent', 'executive'] },
  { key: 'source', label: 'Lead source',
    synonyms: ['lead source', 'source', 'original source', 'utm source', 'channel', 'campaign'] },
  { key: 'name', label: 'Lead name',
    synonyms: ['lead name', 'full name', 'name', 'contact name', 'customer name', 'first name'] },
  { key: 'phone', label: 'Phone',
    synonyms: ['mobile', 'mobile number', 'phone', 'phone number', 'contact number', 'whatsapp', 'whatsapp number'] },
];

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Best-guess mapping { field: header } from the CSV's header row. */
export function guessMapping(headers = []) {
  const byNorm = new Map(headers.map((h) => [norm(h), h]));
  const used = new Set();
  const mapping = {};
  // Exact synonym matches first, in synonym priority order, then "contains".
  for (const pass of ['exact', 'contains']) {
    for (const f of CSV_FIELDS) {
      if (mapping[f.key]) continue;
      for (const syn of f.synonyms) {
        let hit = null;
        if (pass === 'exact') hit = byNorm.get(syn);
        else hit = headers.find((h) => !used.has(h) && norm(h).includes(syn) && syn.length >= 5);
        if (hit && !used.has(hit)) {
          mapping[f.key] = hit;
          used.add(hit);
          break;
        }
      }
    }
  }
  return mapping;
}

/** Which rules this mapping can support. */
export function availableRules(mapping = {}) {
  const has = (k) => Boolean(mapping[k]);
  const out = [];
  if (has('firstContactAt') || has('attempts')) out.push('R1');
  if (has('lastCustomerMessageAt')) out.push('R2');
  if (has('nextFollowUpAt')) out.push('R3');
  if (has('lastActivityAt')) out.push('R4');
  if (has('status') && (has('attempts') || has('firstContactAt'))) out.push('R5');
  return out;
}

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
const NUMERIC_DATE = /^(\d{1,4})[/.\-](\d{1,2})[/.\-](\d{1,4})(?:[ T,]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?/i;

/**
 * Day-first (India, UK), month-first (US) or year-first? Decided from the data:
 * a first part above 12 means day-first, a second part above 12 month-first.
 * Ambiguous files default to day-first.
 */
export function detectDateOrder(values = []) {
  let dmy = 0;
  let mdy = 0;
  for (const v of values) {
    const m = String(v || '').trim().match(NUMERIC_DATE);
    if (!m) continue;
    if (m[1].length === 4) return 'YMD';
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a > 12 && b <= 12) dmy += 1;
    else if (b > 12 && a <= 12) mdy += 1;
  }
  return mdy > dmy ? 'MDY' : 'DMY';
}

/**
 * Parse a CRM date string into a Date. Numeric dates follow `order`; text
 * months ("5 Sep 2026", "Sep 5, 2026 3:10 PM") and ISO strings are understood
 * regardless. Values without a zone are read in the business's UTC offset.
 */
export function parseDate(value, order = 'DMY', tzOffsetMinutes = 330) {
  if (value == null) return null;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  const s = String(value).trim();
  if (!s) return null;
  // ISO with an explicit zone: trust it.
  if (/^\d{4}-\d{2}-\d{2}T.*(Z|[+-]\d{2}:?\d{2})$/i.test(s)) {
    const d = new Date(s);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  let y; let mo; let d; let hh = 0; let mi = 0; let ss = 0; let ampm = null;
  const m = s.match(NUMERIC_DATE);
  if (m) {
    const [p1, p2, p3] = [m[1], m[2], m[3]].map(Number);
    if (m[1].length === 4 || order === 'YMD') [y, mo, d] = [p1, p2, p3];
    else if (order === 'MDY') [mo, d, y] = [p1, p2, p3];
    else [d, mo, y] = [p1, p2, p3];
    hh = Number(m[4] || 0); mi = Number(m[5] || 0); ss = Number(m[6] || 0); ampm = m[7];
  } else {
    // "5 Sep 2026 3:10 PM", "Sep 5, 2026", "05-Sep-2026 15:10"
    const t = s.match(/^(?:(\d{1,2})[\s\-/]+([a-z]{3,9})\.?|([a-z]{3,9})\.?\s+(\d{1,2}),?)[\s\-/,]+(\d{2,4})(?:[ T,]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?/i);
    if (!t) return null;
    mo = MONTHS[(t[2] || t[3] || '').toLowerCase().slice(0, 3)];
    if (mo == null) return null;
    mo += 1;
    d = Number(t[1] || t[4]);
    y = Number(t[5]);
    hh = Number(t[6] || 0); mi = Number(t[7] || 0); ss = Number(t[8] || 0); ampm = t[9];
  }
  if (y < 100) y += 2000;
  if (ampm) {
    const pm = ampm.toLowerCase() === 'pm';
    if (hh === 12) hh = pm ? 12 : 0;
    else if (pm) hh += 12;
  }
  if (!(mo >= 1 && mo <= 12 && d >= 1 && d <= 31 && hh <= 23 && mi <= 59)) return null;
  const utc = Date.UTC(y, mo - 1, d, hh, mi, ss) - tzOffsetMinutes * 60 * 1000;
  const out = new Date(utc);
  // Reject roll-overs such as 31/02.
  const check = new Date(utc + tzOffsetMinutes * 60 * 1000);
  if (check.getUTCDate() !== d || check.getUTCMonth() !== mo - 1) return null;
  return out;
}

/** CRM status text → open / won / lost / unqualified. */
export function mapStatus(value) {
  const v = norm(value);
  if (!v) return 'open';
  if (/\b(unqualified|disqualified|junk|spam|invalid|wrong number|duplicate)\b/.test(v)) return 'unqualified';
  if (/\b(lost|closed lost|dead|not interested|dropped|rejected|cancelled|canceled|no response)\b/.test(v)) return 'lost';
  if (/\b(won|closed won|converted|customer|admitted|enrolled|booked|sold|paid|joined|purchased)\b/.test(v)) return 'won';
  return 'open';
}

const toNumber = (v) => {
  if (v == null || String(v).trim() === '') return undefined;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
};

/**
 * CSV rows (objects keyed by header) → leak records.
 * @returns {{ records: object[], skipped: number, dateOrder: string }}
 */
export function rowsToRecords(rows = [], mapping = {}, { dateOrder, tzOffsetMinutes = 330 } = {}) {
  const col = (row, key) => (mapping[key] ? row[mapping[key]] : undefined);
  const dateCols = ['createdAt', 'firstContactAt', 'lastActivityAt', 'nextFollowUpAt', 'lastCustomerMessageAt', 'lastReplyAt'];
  const order = dateOrder && dateOrder !== 'auto'
    ? dateOrder
    : detectDateOrder(rows.slice(0, 500).flatMap((r) => dateCols.map((k) => col(r, k))));
  const date = (row, key) => parseDate(col(row, key), order, tzOffsetMinutes);

  const records = [];
  let skipped = 0;
  rows.forEach((row, i) => {
    const createdAt = date(row, 'createdAt');
    if (!createdAt) { skipped += 1; return; }
    const lastIn = date(row, 'lastCustomerMessageAt');
    const lastOut = date(row, 'lastReplyAt');
    const rawStatus = col(row, 'status');
    records.push({
      id: `row-${i + 2}`, // spreadsheet row number (header is row 1)
      name: String(col(row, 'name') || '').trim() || `Row ${i + 2}`,
      phone: String(col(row, 'phone') || '').trim() || undefined,
      owner: String(col(row, 'owner') || '').trim() || undefined,
      source: String(col(row, 'source') || '').trim() || undefined,
      stage: rawStatus ? String(rawStatus).trim() : undefined,
      status: mapStatus(rawStatus),
      createdAt,
      firstContactAt: date(row, 'firstContactAt') || undefined,
      lastActivityAt: date(row, 'lastActivityAt') || undefined,
      nextFollowUpAt: date(row, 'nextFollowUpAt') || undefined,
      awaitingReplySince: lastIn && (!lastOut || lastOut < lastIn) ? lastIn : undefined,
      attempts: toNumber(col(row, 'attempts')),
    });
  });
  return { records, skipped, dateOrder: order };
}
