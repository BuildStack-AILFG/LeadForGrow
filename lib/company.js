/**
 * Single source for company identity used across the public site.
 *
 * ScaleDesk Technology Private Limited is the legal entity; LeadForGrow is the product it operates (not a separate company).
 *
 * Address rules (owner's instruction):
 *  - PUBLIC pages (Contact, About, footer) show the shortened address, WITHOUT the "C/O" line.
 *  - LEGAL pages (Privacy, Terms, GDPR, DPA, other policies) show the full registered office exactly as recorded in
 *    the incorporation documents, including the "C/O" line.
 * Only facts supplied by the owner live here: no registration numbers, tax ids, phone numbers or emails.
 */
export const LEGAL_NAME = 'ScaleDesk Technology Private Limited';
export const PRODUCT_NAME = 'LeadForGrow';
export const PRODUCT_STATEMENT = `${PRODUCT_NAME} is a product operated by ${LEGAL_NAME}.`;

const CARE_OF_LINE = 'C/O Ramp Pravesh Singh,';

/** Shortened address for public-facing pages (no care-of line). */
export const PUBLIC_ADDRESS_LINES = [
  'Mill Road, Pardaha,',
  'Mau, Sadar,',
  'Mau – 275101,',
  'Uttar Pradesh, India',
];

/** Complete registered office, exactly as recorded in the incorporation documents. */
export const FULL_ADDRESS_LINES = [CARE_OF_LINE, ...PUBLIC_ADDRESS_LINES];
