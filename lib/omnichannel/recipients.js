const EMAIL_RE = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]+$/;

/**
 * Normalise Cc/Bcc input into `[{ email, name? }]`.
 *
 * Callers send it in different shapes: the New Email window sends a
 * comma-separated string, the thread composer sends `[{ email }]`, drafts and
 * synced mail use `[{ name, address }]`. Anything that isn't a valid-looking
 * address is dropped, and duplicates are removed (case-insensitive).
 */
export function normalizeRecipients(input) {
  if (!input) return [];
  const items = typeof input === 'string'
    ? input.split(/[,;\n]/)
    : Array.isArray(input) ? input : [input];
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const raw = typeof item === 'string' ? item : item?.email || item?.address || '';
    // Accept "Name <a@b.com>" as well as a bare address.
    const match = String(raw).match(/<([^>]+)>/);
    const email = (match ? match[1] : String(raw)).trim();
    if (!EMAIL_RE.test(email)) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const name = typeof item === 'object' && item?.name ? String(item.name).trim() : '';
    out.push(name ? { email, name } : { email });
  }
  return out;
}
