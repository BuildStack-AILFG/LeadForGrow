import { jsPDF } from 'jspdf';

/**
 * Render a bill to a PDF Buffer using jsPDF.
 *
 * Modern teal "INVOICE" layout, inspired by a classic professional invoice:
 *   - Header: business logo + name (left), address + website (right)
 *   - A big "INVOICE" wordmark on the left, a prominent teal "Total Due" on
 *     the right — the one number a customer looks for first
 *   - Invoice meta (number / date / GSTIN) on the left, "Bill To" on the right
 *   - Line-item table with a teal header row: NO / ITEM DESCRIPTION / RATE /
 *     QTY / TOTAL, numbered rows, hairline separators
 *   - Totals right-aligned; the Grand Total sits in a filled teal band
 *   - Footer: a "Thank you" line + optional notes/terms on the left, and a
 *     signature block (business name + Authorised Signatory) on the right
 *
 * The accent is a neutral professional teal — this is the business's own
 * customer-facing document, so it carries no LeadForGrow branding. Fields the
 * lightweight Bill model doesn't have (account no, payment method, terms) are
 * derived where possible (notes → terms, Razorpay link → "pay online") or
 * omitted cleanly rather than shown empty.
 *
 * @param logoDataUrl - Optional data URL of the business logo, drawn top-left.
 */
export function renderBillPdf({ bill, business, logoDataUrl, stampDataUrl }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });

  const PAGE_W = doc.internal.pageSize.getWidth();
  const PAGE_H = doc.internal.pageSize.getHeight();
  const MARGIN = 44;
  const RIGHT_EDGE = PAGE_W - MARGIN;

  const INK = [17, 24, 39];        // near-black — primary text
  const MUTED = [100, 116, 139];   // slate-500 — secondary text
  const FAINT = [148, 163, 184];   // slate-400 — tertiary text
  const CARD_LINE = [226, 232, 240]; // slate-200 — hairlines
  const ACCENT = [20, 160, 146];     // teal — brand accent for this document
  const ACCENT_INK = [13, 118, 110]; // darker teal — accent text on white

  const STATUS_STYLES = {
    draft: { label: 'DRAFT', bg: [226, 232, 240], fg: [71, 85, 105] },
    sent: { label: 'SENT', bg: [219, 234, 254], fg: [29, 78, 216] },
    viewed: { label: 'VIEWED', bg: [237, 233, 254], fg: [109, 40, 217] },
    paid: { label: 'PAID', bg: [204, 251, 241], fg: [13, 118, 110] },
    void: { label: 'VOID', bg: [254, 226, 226], fg: [185, 28, 28] },
  };

  const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const setFill = (rgb) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  const setDraw = (rgb) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  const setText = (rgb) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);

  // Subtle full-page frame so the document reads as designed, not a text dump.
  setDraw(CARD_LINE);
  doc.setLineWidth(1);
  doc.roundedRect(22, 22, PAGE_W - 44, PAGE_H - 44, 8, 8);

  // ── Header: logo + name (left), address + website (right) ───────────────
  let nameLeft = MARGIN;
  let logoBottom = 58;
  if (logoDataUrl) {
    try {
      const fmtMatch = /^data:image\/(png|jpe?g|webp)/i.exec(logoDataUrl);
      const jsPdfFmt = fmtMatch ? fmtMatch[1].toUpperCase().replace('JPG', 'JPEG') : 'PNG';
      const props = doc.getImageProperties(logoDataUrl);
      const maxSide = 46;
      const ratio = props.width / props.height;
      const w = ratio >= 1 ? maxSide : maxSide * ratio;
      const h = ratio >= 1 ? maxSide / ratio : maxSide;
      doc.addImage(logoDataUrl, jsPdfFmt, MARGIN, 42, w, h);
      nameLeft = MARGIN + w + 12;
      logoBottom = 42 + h;
    } catch {
      nameLeft = MARGIN;
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  setText(INK);
  doc.text(business.businessName || 'Business', nameLeft, 60);

  // Right header block: address (wrapped) + website in accent.
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let ry = 50;
  if (business.address) {
    setText(MUTED);
    const addr = doc.splitTextToSize(String(business.address), 200);
    addr.slice(0, 3).forEach((str) => { doc.text(str, RIGHT_EDGE, ry, { align: 'right' }); ry += 12; });
  }
  const contact = [business.phone, business.email].filter(Boolean).join('  ·  ');
  if (contact) { setText(MUTED); doc.text(contact, RIGHT_EDGE, ry, { align: 'right' }); ry += 12; }
  if (business.website) {
    setText(ACCENT_INK);
    doc.text(String(business.website), RIGHT_EDGE, ry, { align: 'right' });
    ry += 12;
  }

  // ── "INVOICE" wordmark (left) + Total Due (right) ───────────────────────
  const bandY = Math.max(logoBottom, ry) + 34;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(34);
  setText(INK);
  doc.text('INVOICE', MARGIN, bandY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setText(MUTED);
  doc.text('Total Due', RIGHT_EDGE, bandY - 18, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  setText(ACCENT_INK);
  doc.text(fmt(bill.total), RIGHT_EDGE, bandY, { align: 'right' });

  // Status badge under the wordmark.
  const statusCfg = STATUS_STYLES[bill.status] || STATUS_STYLES.draft;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const badgeTextW = doc.getTextWidth(statusCfg.label);
  const badgeW = badgeTextW + 16;
  const badgeH = 16;
  setFill(statusCfg.bg);
  doc.roundedRect(MARGIN, bandY + 10, badgeW, badgeH, badgeH / 2, badgeH / 2, 'F');
  setText(statusCfg.fg);
  doc.text(statusCfg.label, MARGIN + badgeW / 2, bandY + 10 + badgeH / 2 + 3, { align: 'center' });

  // ── Meta (left: invoice no/date/gstin) + Bill To (right) ────────────────
  const metaY = bandY + 48;
  const labelVal = (label, value, x, y) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setText(MUTED);
    doc.text(label, x, y);
    doc.setFont('helvetica', 'bold');
    setText(INK);
    doc.text(String(value), x + 74, y);
  };

  let ly = metaY;
  labelVal('Invoice No', bill.billNumber || '', MARGIN, ly); ly += 15;
  labelVal('Invoice Date', new Date(bill.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), MARGIN, ly); ly += 15;
  const effectiveGstin = (bill.gstNumber && bill.gstNumber.trim()) || business.gstin || '';
  if (effectiveGstin) { labelVal('GSTIN', effectiveGstin, MARGIN, ly); ly += 15; }

  // Bill To (right column).
  const billToX = MARGIN + (RIGHT_EDGE - MARGIN) * 0.56;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setText(ACCENT_INK);
  doc.text('BILL TO', billToX, metaY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  setText(INK);
  doc.text(String(bill.customerName || ''), billToX, metaY + 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setText(MUTED);
  let by = metaY + 31;
  if (bill.customerPhone) { doc.text(String(bill.customerPhone), billToX, by); by += 12; }
  if (bill.customerEmail) { doc.text(String(bill.customerEmail), billToX, by); by += 12; }

  // ── Line-item table ─────────────────────────────────────────────────────
  let tableY = Math.max(ly, by) + 22;
  const tableTop = tableY;
  const headH = 24;

  // Column anchors (right-aligned numeric columns).
  const colNo = MARGIN + 10;
  const colDesc = MARGIN + 42;
  const colRate = RIGHT_EDGE - 210;
  const colQty = RIGHT_EDGE - 110;
  const colTotal = RIGHT_EDGE - 10;

  setFill(ACCENT);
  doc.rect(MARGIN, tableY, RIGHT_EDGE - MARGIN, headH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  setText([255, 255, 255]);
  doc.text('NO.', colNo, tableY + 16);
  doc.text('ITEM DESCRIPTION', colDesc, tableY + 16);
  doc.text('RATE', colRate, tableY + 16, { align: 'right' });
  doc.text('QTY', colQty, tableY + 16, { align: 'right' });
  doc.text('TOTAL', colTotal, tableY + 16, { align: 'right' });

  tableY += headH;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const items = bill.lineItems || [];
  items.forEach((item, i) => {
    const desc = String(item.description || '');
    const wrapped = doc.splitTextToSize(desc, colRate - colDesc - 14);
    const rowH = Math.max(24, wrapped.length * 12 + 12);

    if (i % 2 === 1) {
      setFill([247, 250, 250]); // faint teal-tinted zebra
      doc.rect(MARGIN, tableY, RIGHT_EDGE - MARGIN, rowH, 'F');
    }

    setText(MUTED);
    doc.text(String(i + 1).padStart(2, '0'), colNo, tableY + 16);
    setText(INK);
    doc.text(wrapped, colDesc, tableY + 16);
    setText(MUTED);
    doc.text(fmt(item.rate), colRate, tableY + 16, { align: 'right' });
    doc.text(String(item.quantity ?? 1), colQty, tableY + 16, { align: 'right' });
    setText(INK);
    doc.setFont('helvetica', 'bold');
    doc.text(fmt(item.amount), colTotal, tableY + 16, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    tableY += rowH;
    setDraw([236, 240, 243]);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, tableY, RIGHT_EDGE, tableY);
  });

  // ── Totals block, right-aligned ─────────────────────────────────────────
  tableY += 20;
  const totalsLabelX = RIGHT_EDGE - 150;
  const totalsValueX = RIGHT_EDGE - 10;
  doc.setFontSize(10);
  const putRow = (label, value) => {
    doc.setFont('helvetica', 'normal');
    setText(MUTED);
    doc.text(label, totalsLabelX, tableY, { align: 'right' });
    setText(INK);
    doc.text(value, totalsValueX, tableY, { align: 'right' });
    tableY += 17;
  };
  putRow('Sub-Total', fmt(bill.subtotal));
  if (Number(bill.discount) > 0) putRow('Discount', `- ${fmt(bill.discount)}`);
  putRow(`Tax Vat${Number(bill.taxRate) ? ` (${bill.taxRate}%)` : ''}`, fmt(bill.taxAmount));

  // Grand Total — filled teal band.
  tableY += 6;
  const bandH = 32;
  const bandX = totalsLabelX - 26;
  const bandW = totalsValueX - bandX + 10;
  setFill(ACCENT);
  doc.roundedRect(bandX, tableY, bandW, bandH, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  setText([255, 255, 255]);
  doc.text('Grand Total', bandX + 12, tableY + bandH / 2 + 4);
  doc.text(fmt(bill.total), bandX + bandW - 12, tableY + bandH / 2 + 4, { align: 'right' });
  tableY += bandH;

  // ── Footer — thank you + notes/terms (left), signature (right) ──────────
  const payLink = bill.paymentLink?.shortUrl;
  const bottomY = PAGE_H - 56;

  // Left column: thank-you, optional pay link, notes as terms.
  let fy = tableY + 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setText(ACCENT_INK);
  doc.text('Thank you for your business!', MARGIN, fy);
  fy += 18;

  if (payLink) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setText(MUTED);
    doc.text('Pay online:', MARGIN, fy);
    setText(ACCENT_INK);
    doc.text(String(payLink), MARGIN + 54, fy);
    fy += 16;
  }

  if (bill.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    setText(MUTED);
    doc.text('TERMS & CONDITIONS', MARGIN, fy);
    fy += 13;
    doc.setFont('helvetica', 'normal');
    setText([71, 85, 105]);
    const wrapped = doc.splitTextToSize(String(bill.notes), (RIGHT_EDGE - MARGIN) * 0.55);
    doc.text(wrapped.slice(0, 4), MARGIN, fy);
  }

  // Right column: signature block anchored near the bottom — company stamp /
  // seal (if uploaded) above a rule, then the signatory name + designation.
  const sigX = RIGHT_EDGE;
  const sigLineY = bottomY - 14;

  if (stampDataUrl) {
    try {
      const fmtMatch = /^data:image\/(png|jpe?g|webp)/i.exec(stampDataUrl);
      const jsPdfFmt = fmtMatch ? fmtMatch[1].toUpperCase().replace('JPG', 'JPEG') : 'PNG';
      const props = doc.getImageProperties(stampDataUrl);
      const maxSide = 62;
      const ratio = props.width / props.height;
      const w = ratio >= 1 ? maxSide : maxSide * ratio;
      const h = ratio >= 1 ? maxSide / ratio : maxSide;
      // Centred over the signature line, sitting just above it.
      const sx = sigX - 75 - w / 2;
      const sy = sigLineY - h - 2;
      doc.addImage(stampDataUrl, jsPdfFmt, sx, sy, w, h);
    } catch { /* ignore a bad stamp image; the printed name still renders */ }
  }

  setDraw(CARD_LINE);
  doc.setLineWidth(0.75);
  doc.line(sigX - 150, sigLineY, sigX, sigLineY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  setText(INK);
  doc.text(String(business.billSignatoryName || business.businessName || ''), sigX, sigLineY + 14, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  setText(MUTED);
  doc.text(String(business.billSignatoryTitle || 'Authorised Signatory'), sigX, sigLineY + 26, { align: 'right' });

  // Generated-on timestamp, centered at the very bottom.
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setText(FAINT);
  doc.text(
    `Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    PAGE_W / 2,
    PAGE_H - 32,
    { align: 'center' }
  );

  return Buffer.from(doc.output('arraybuffer'));
}
