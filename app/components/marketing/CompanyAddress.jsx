import { LEGAL_NAME, PUBLIC_ADDRESS_LINES, FULL_ADDRESS_LINES } from '@/lib/company';

/**
 * The company name and registered office as an <address> block.
 *  - variant="public": shortened address (Contact page and other public pages) - no "C/O" line.
 *  - variant="full":   complete registered office incl. the "C/O" line (legal pages).
 */
export default function CompanyAddress({ variant = 'public', className = '' }) {
  const lines = variant === 'full' ? FULL_ADDRESS_LINES : PUBLIC_ADDRESS_LINES;
  return (
    <address className={`not-italic min-w-0 ${className}`}>
      <p className="font-semibold text-[#111827] dark:text-slate-100">{LEGAL_NAME}</p>
      <p className="mt-3 font-medium text-[#111827] dark:text-slate-100">Registered Office:</p>
      <p className="mt-1 leading-relaxed">
        {lines.map((line, i) => (
          <span key={line}>
            {line}
            {i < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    </address>
  );
}
