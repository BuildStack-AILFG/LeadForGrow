'use client';

import { useId } from 'react';

/**
 * Real brand marks for messaging channels — Simple Icons paths. Monochrome (currentColor) by default so
 * they sit quietly in nav/cluster contexts and on coloured pills; pass `colored` for the official brand
 * colours (WhatsApp green, Instagram gradient, Facebook blue) — used for channel badges in the inbox.
 * Use these instead of lucide's generic MessageCircle / Instagram so the
 * inbox and chat surfaces show the actual product logo everyone recognises.
 */

export function WhatsAppIcon({ className = '', size, colored = false, ...rest }) {
  // Only set explicit width/height attrs when `size` is passed. When it isn't,
  // sizing falls to whatever className the caller provides (e.g. `w-5 h-5`
  // from the sidebar) — same escape hatch Lucide icons rely on.
  const sizeAttrs = size != null ? { width: size, height: size } : {};
  return (
    <svg
      viewBox="0 0 24 24"
      {...sizeAttrs}
      fill={colored ? '#25D366' : 'currentColor'}
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413" />
    </svg>
  );
}

/**
 * Monochrome envelope-with-M variant — used in nav / cluster contexts where
 * the multi-colour Gmail logo would fight the surrounding icons. Uses
 * currentColor so it inherits the nav's slate (or active-state tone).
 */
export function GmailMonoIcon({ className = '', size, ...rest }) {
  const sizeAttrs = size != null ? { width: size, height: size } : {};
  return (
    <svg
      viewBox="0 0 24 24"
      {...sizeAttrs}
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {/* Simple Icons Gmail mono path — envelope with the trapezoid M inside */}
      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
    </svg>
  );
}

/**
 * InboxChannelsIcon — three mini brand marks (WhatsApp / Instagram / Gmail)
 * clustered as one nav icon. Renders monochrome via currentColor so it
 * matches every other sidebar icon at rest and picks up the active tone
 * when the user is on the Inbox page. Purely visual; no interaction.
 *
 * Sized like a Lucide icon — accepts `className` for width/height and
 * inherits colour from the parent's text-color, same escape hatch the rest
 * of the brand icons use.
 */
export function InboxChannelsIcon({ className = '' }) {
  return (
    <span className={`inline-flex items-center ${className}`} aria-hidden="true">
      <span className="relative flex items-center -space-x-[3px]">
        <WhatsAppIcon size={11} />
        <InstagramIcon size={11} />
        <GmailMonoIcon size={11} />
      </span>
    </span>
  );
}

export function GmailIcon({ className = '', size = 12, colored: _colored, ...rest }) {
  // Multi-colour Gmail M — the trapezoid + coloured "M" mark, drawn without
  // currentColor so it renders in Google's actual palette even on dark hero.
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <path fill="#4285F4" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
      <path fill="#34A853" d="M5.455 21.003V11.73L0 7.638v11.729c0 .904.732 1.636 1.636 1.636z" />
      <path fill="#FBBC04" d="M18.545 21.003V11.73l5.455-4.093v11.729c0 .904-.732 1.636-1.636 1.636z" />
      <path fill="#EA4335" d="M18.545 4.638v7.093L24 7.637V5.457c0-2.024-2.31-3.178-3.927-1.965z" />
      <path fill="#C5221F" d="M0 7.637l5.455 4.093V4.639L3.928 3.493C2.309 2.28 0 3.434 0 5.457z" />
    </svg>
  );
}

export function FacebookIcon({ className = '', size, colored = false, ...rest }) {
  const sizeAttrs = size != null ? { width: size, height: size } : {};
  return (
    <svg
      viewBox="0 0 24 24"
      {...sizeAttrs}
      fill={colored ? '#1877F2' : 'currentColor'}
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function InstagramIcon({ className = '', size, colored = false, ...rest }) {
  const sizeAttrs = size != null ? { width: size, height: size } : {};
  // Unique gradient id per instance (many icons render in one list); strip characters that are awkward inside url(#…).
  const gid = `ig${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg
      viewBox="0 0 24 24"
      {...sizeAttrs}
      fill={colored ? `url(#${gid})` : 'currentColor'}
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {colored && (
        <defs>
          <linearGradient id={gid} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#FEDA75" />
            <stop offset="0.25" stopColor="#FA7E1E" />
            <stop offset="0.5" stopColor="#D62976" />
            <stop offset="0.75" stopColor="#962FBF" />
            <stop offset="1" stopColor="#4F5BD5" />
          </linearGradient>
        </defs>
      )}
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}
