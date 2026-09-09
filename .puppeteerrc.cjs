/**
 * Puppeteer config: skip downloading a bundled Chrome on every `npm install`.
 * Without this, `postinstall` tries to fetch a ~200MB Chrome build and any
 * network hiccup (as happened here) aborts the ENTIRE npm install, leaving
 * node_modules partially populated (e.g. `next` missing).
 * See https://pptr.dev/guides/configuration
 */
module.exports = {
  skipDownload: true,
};
