// Site fonts, self-hosted from files in this folder (latin subset, downloaded from Google Fonts, SIL OFL).
//
// They used to come from next/font/google, which downloads the fonts during every build. Google sometimes
// answers with a "/l/font?kit=…&skey=…" link, and Turbopack's font loader fails on it ("next/font/google
// queries have exactly one entry"), so builds broke at random. Local files make every build offline and
// identical. Variable names are unchanged, so globals.css and every className keep working.
import localFont from 'next/font/local';

export const inter = localFont({
  src: './inter-100-900.woff2',
  weight: '100 900',
  display: 'swap',
  variable: '--nf-inter',
});

export const interTight = localFont({
  src: './inter-tight-700-800.woff2',
  weight: '700 800',
  display: 'swap',
  variable: '--nf-inter-tight',
  preload: false,
});

export const plusJakarta = localFont({
  src: './plus-jakarta-sans-400-800.woff2',
  weight: '400 800',
  display: 'swap',
  variable: '--nf-plus-jakarta',
  preload: false,
});

export const barlow = localFont({
  src: [
    { path: './barlow-400.woff2', weight: '400', style: 'normal' },
    { path: './barlow-500.woff2', weight: '500', style: 'normal' },
    { path: './barlow-600.woff2', weight: '600', style: 'normal' },
    { path: './barlow-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--nf-barlow',
  preload: false,
});

export const libreBaskerville = localFont({
  src: './libre-baskerville-400-700.woff2',
  weight: '400 700',
  display: 'swap',
  variable: '--nf-libre-baskerville',
  preload: false,
  adjustFontFallback: 'Times New Roman',
});

export const plexSans = localFont({
  src: './ibm-plex-sans-400-600.woff2',
  weight: '400 600',
  display: 'swap',
  variable: '--font-plex-sans',
});

export const anton = localFont({
  src: './anton-400.woff2',
  weight: '400',
  display: 'swap',
});
