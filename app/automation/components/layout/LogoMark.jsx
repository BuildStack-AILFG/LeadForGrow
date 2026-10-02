import cx from '@/app/components/ui/cx';

/**
 * LeadForGrow logo mark in the brand accent (owner decision 2026-10-03).
 * The source PNG is purple; using it as a CSS mask lets the shape render in
 * --accent without redrawing or replacing the logo file.
 */
export default function LogoMark({ size = 20, className }) {
  const mask = {
    WebkitMaskImage: 'url(/image.png)',
    maskImage: 'url(/image.png)',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
  };
  return <span role="img" aria-label="LeadForGrow" style={{ width: size, height: size, ...mask }} className={cx('block shrink-0 bg-accent', className)} />;
}
