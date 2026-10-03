/**
 * Node ESM load hook for tests: compiles .jsx files on the fly with the same SWC that Next.js ships, so React components
 * can be rendered with react-dom/server under plain `node --test` (no browser, no bundler).
 * Use together with scripts/test-alias-hooks.mjs (which resolves the "@/" alias and extensionless imports):
 *
 *   register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));
 *   register(new URL('../scripts/test-jsx-hooks.mjs', import.meta.url));
 *
 * Files named .js that hold JSX (Next page files) are compiled when they live under app/ or are imported with a "?jsx" suffix.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, 'package.json'));
const APP_DIR = path.join(ROOT, 'app') + path.sep;
// Next page / component files under app/ are often .js but contain JSX; compile them too (same output for plain JS).
const isAppJs = (url) => url.endsWith('.js') && fileURLToPath(url).startsWith(APP_DIR);
let swcPromise;
const getSwc = () => {
  swcPromise ||= (async () => {
    const swc = require('next/dist/build/swc');
    await swc.loadBindings();
    return swc;
  })();
  return swcPromise;
};

export async function load(url, context, nextLoad) {
  // A .js file that contains JSX (Next page files) is compiled only when a test opts in: import('../app/x/page.js?jsx').
  const optIn = url.startsWith('file:') && (/\.js\?jsx$/.test(url) || isAppJs(url));
  if (url.startsWith('file:') && (url.endsWith('.jsx') || optIn)) {
    const filename = fileURLToPath(optIn ? url.replace(/\?jsx$/, '') : url);
    const source = await readFile(filename, 'utf8');
    const swc = await getSwc();
    const out = await swc.transform(source, {
      filename,
      jsc: {
        parser: { syntax: 'ecmascript', jsx: true },
        transform: { react: { runtime: 'automatic' } },
        target: 'es2022',
      },
      module: { type: 'es6' },
    });
    return { format: 'module', source: out.code, shortCircuit: true };
  }
  return nextLoad(url, context);
}
