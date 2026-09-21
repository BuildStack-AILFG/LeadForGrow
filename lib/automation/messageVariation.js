/**
 * Message variation — makes automated replies look human, not bot-spam.
 *
 * Two authoring styles, combinable:
 *   1. Full variants separated by "|||"
 *        "Thanks! 🙏 ||| Got it, thank you! ||| Appreciate it!"
 *      → one whole variant is picked at random.
 *   2. Inline spintax with a pipe inside braces
 *        "{Hi|Hey|Hello} there!"
 *      → one option per group is picked at random.
 *
 * Sending slightly different text to each recipient is one of the strongest
 * anti-spam signals — identical bulk text is what platforms flag. Only groups
 * that actually contain a "|" are treated as spintax, so template tokens like
 * {{customer_name}} are never touched.
 */
export function pickVariant(text) {
  if (!text || typeof text !== 'string') return text || '';

  let base = text;

  // 1. Whole-message variants.
  if (base.includes('|||')) {
    const variants = base.split('|||').map((s) => s.trim()).filter(Boolean);
    if (variants.length) base = variants[Math.floor(Math.random() * variants.length)];
  }

  // 2. Inline spintax — only { ... | ... } groups (must contain a pipe).
  return base.replace(/\{([^{}]*\|[^{}]*)\}/g, (_, group) => {
    const opts = group.split('|');
    return opts[Math.floor(Math.random() * opts.length)].trim();
  });
}

/** True if the text uses any variation syntax (for UI hints/validation). */
export function hasVariation(text) {
  if (!text) return false;
  return text.includes('|||') || /\{[^{}]*\|[^{}]*\}/.test(text);
}

export default { pickVariant, hasVariation };
