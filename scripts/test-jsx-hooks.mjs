/**
 * Node ESM load hook for tests: compiles .jsx files on the fly with the same SWC that Next.js ships, so React components
 * can be rendered with react-dom/server under plain `node --test` (no browser, no bundler).
 * Use together with scripts/test-alias-hooks.mjs (which resolves the "@/" alias and extensionless imports):
 *
 *   register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));
 *   register(new URL('../scripts/test-jsx-hooks.mjs', import.meta.url));
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, 'package.json'));
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
  if (url.startsWith('file:') && url.endsWith('.jsx')) {
    const filename = fileURLToPath(url);
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
