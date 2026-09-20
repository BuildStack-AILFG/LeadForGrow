/**
 * Node ESM resolve hook for tests: maps the Next.js "@/" alias (see jsconfig.json)
 * and extensionless relative imports onto real files, so lib/ modules can be
 * imported under plain `node --test` without the Next bundler.
 */
import { pathToFileURL, fileURLToPath } from 'node:url';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isFile = (p) => existsSync(p) && statSync(p).isFile();
const candidates = (base) => [base, `${base}.js`, `${base}.jsx`, `${base}.mjs`, path.join(base, 'index.js')];

export async function resolve(specifier, context, next) {
  let base = null;
  if (specifier.startsWith('@/')) {
    base = path.join(ROOT, specifier.slice(2));
  } else if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
    base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
  }
  if (base) {
    for (const c of candidates(base)) {
      if (isFile(c)) return next(pathToFileURL(c).href, context);
    }
  }
  try {
    return await next(specifier, context);
  } catch (err) {
    // Package subpaths like "next/server" resolve in the Next bundler but need ".js" in plain Node.
    if (err?.code === 'ERR_MODULE_NOT_FOUND' && !specifier.startsWith('.') && !specifier.startsWith('/') && !specifier.endsWith('.js')) {
      return next(`${specifier}.js`, context);
    }
    throw err;
  }
}
