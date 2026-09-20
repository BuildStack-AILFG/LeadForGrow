/**
 * Conversation-list preview text for EMAIL rows.
 *
 * Newsletters are often just images and links, and the text version of them starts with things like
 * "[https://d15k2d11r6t6rl.cloudfront.net/public/user…" — a wall of URL in a one-line preview. This removes bracketed and bare
 * URLs and, when nothing readable is left, says "Link" instead of showing an empty row.
 * Display-only (nothing stored is changed).
 */
export function cleanEmailPreview(text) {
  const original = String(text || '').trim();
  if (!original) return '';
  const hadUrl = /https?:\/\//i.test(original);
  const cleaned = original
    // "[https://example.com/…]" and truncated "[https://example.com/…" (the stored preview is cut, so the ] may be missing)
    .replace(/\[\s*https?:\/\/[^\]\s]*\]?/gi, ' ')
    .replace(/<\s*https?:\/\/[^>\s]*>?/gi, ' ')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\[\s*\]|\(\s*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned) return cleaned;
  return hadUrl ? 'Link' : original;
}

export default { cleanEmailPreview };
