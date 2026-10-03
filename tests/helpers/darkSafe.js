/**
 * Dark-mode safety for rendered markup. A surface is safe when it uses a theme token
 * (bg-canvas, border-line, text-fg …, which switch in dark mode) or pairs a fixed light
 * colour with a `dark:` counterpart. Returns the class strings that are light-only.
 */
const LIGHT_ONLY = [
  { re: /(?:^|\s)bg-(?:white|slate-(?:50|100|200))(?:\s|$)/, pair: /(?:^|\s)dark:bg-/ },
  { re: /(?:^|\s)border-slate-(?:100|200|300)(?:\s|$)/, pair: /(?:^|\s)dark:border-/ },
  { re: /(?:^|\s)text-slate-(?:700|800|900)(?:\s|$)/, pair: /(?:^|\s)dark:text-/ },
];

export function lightOnlyClasses(html) {
  const bad = [];
  for (const [, cls] of html.matchAll(/class="([^"]*)"/g)) {
    if (LIGHT_ONLY.some(({ re, pair }) => re.test(cls) && !pair.test(cls))) bad.push(cls);
  }
  return bad;
}

/** True when the markup has at least one themed surface and nothing light-only. */
export function isDarkSafe(html) {
  return lightOnlyClasses(html).length === 0;
}
