import { jsPDF } from 'jspdf';

/**
 * Render a bill to a PDF Buffer using jsPDF.
 *
 * Professional-invoice layout:
 *   - Full-page frame + header: business logo (if uploaded) + business name
 *     (large), business phone/email/address (small, right side), a rule
 *     under the header
 *   - Two light "card" blocks: bill number + date + status badge on the
 *     left, "Billed to" customer block on the right
 *   - Line-item table with a dark filled header row + zebra-striped body
 *   - Totals right-aligned, with the grand TOTAL emphasized in a dark
 *     filled pill so it reads as the one number that matters at a glance
 *   - Footer: notes + GST number if provided, a divider, then a centered
 *     "Thank you" line and a small generated-on timestamp
 *
 * Explicitly does NOT stamp any LeadForGrow branding or a fixed brand hue —
 * this is the business's customer-facing document, so the palette here is
 * a neutral charcoal/slate scheme (typography + contrast + spacing carry
 * the "professional" look), not any particular company's brand color.
 *
 * @param logoDataUrl - Optional data URL of the business logo. When present,
 *   drawn top-left with the business name shifted right. The caller (send /
 *   pdf route) is responsible for fetching business.logo and converting to
 *   a data URL before calling — the renderer stays synchronous.
 */
export function renderBillPdf({ bill, business, logoDataUrl }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });

  const PAGE_W = doc.internal.pageSize.getWidth();
  const PAGE_H = doc.internal.pageSize.getHeight();
  const MARGIN = 40;
  const RIGHT_EDGE = PAGE_W - MARGIN;

  const INK = [15, 23, 42];       // slate-900 — primary text
  const MUTED = [100, 116, 139];  // slate-500 — secondary text
  const FAINT = [148, 163, 184];  // slate-400 — tertiary text
  const CARD_BG = [248, 250, 252]; // slate-50 — light card fill
  const CARD_LINE = [226, 232, 240]; // slate-200 — hairlines
  const DARK_FILL = [17, 24, 39]; // near-black — header row / total pill

  const STATUS_STYLES = {
    draft: { label: 'DRAFT', bg: [226, 232, 240], fg: [71, 85, 105] },
    sent: { label: 'SENT', bg: [219, 234, 254], fg: [29, 78, 216] },
    viewed: { label: 'VIEWED', bg: [237, 233, 254], fg: [109, 40, 217] },
    paid: { label: 'PAID', bg: [220, 252, 231], fg: [21, 128, 61] },
    void: { label: 'VOID', bg: [254, 226, 226], fg: [185, 28, 28] },
  };

  const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const setFill = (rgb) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  const setDraw = (rgb) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  const setText = (rgb) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  const line = (y, weight = 0.75, color = CARD_LINE) => {
    setDraw(color);
    doc.setLineWidth(weight);
    doc.line(MARGIN, y, RIGHT_EDGE, y);
  };

  // ── Full-page frame — a subtle border so the PDF reads as a designed
  // document rather than a plain text dump, regardless of content length.
  setDraw(CARD_LINE);
  doc.setLineWidth(1);
  doc.roundedRect(20, 20, PAGE_W - 40, PAGE_H - 40, 6, 6);

  // ── Header — logo (if any) + business identity ────────────────────────
  let nameLeft = MARGIN;
  if (logoDataUrl) {
    try {
      const fmtMatch = /^data:image\/(png|jpe?g|webp)/i.exec(logoDataUrl);
      const jsPdfFmt = fmtMatch ? fmtMatch[1].toUpperCase().replace('JPG', 'JPEG') : 'PNG';
      const props = doc.getImageProperties(logoDataUrl);
      const maxSide = 55;
      const ratio = props.width / props.height;
      const w = ratio >= 1 ? maxSide : maxSide * ratio;
      const h = ratio >= 1 ? maxSide / ratio : maxSide;
      const y = 34 + (maxSide - h) / 2;
      doc.addImage(logoDataUrl, jsPdfFmt, MARGIN, y, w, h);
      nameLeft = MARGIN + w + 14;
    } catch {
      nameLeft = MARGIN;
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  setText(INK);
  doc.text(business.businessName || 'Business', nameLeft, 62);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setText(MUTED);
  const contactLines = [business.phone || '', business.email || '', business.address || ''].filter(Boolean);
  let cy = 55;
  contactLines.forEach((str) => {
    doc.text(str, RIGHT_EDGE, cy, { align: 'right' });
    cy += 12;
  });

  line(96, 1, [203, 213, 225]);

  // ── Metadata cards — bill details (left) + billed-to (right) ───────────
  const cardTop = 116;
  const cardH = 78;
  const cardW = (RIGHT_EDGE - MARGIN - 16) / 2;
  const leftCardX = MARGIN;
  const rightCardX = MARGIN + cardW + 16;

  setFill(CARD_BG);
  setDraw(CARD_LINE);
  doc.setLineWidth(0.75);
  doc.roundedRect(leftCardX, cardTop, cardW, cardH, 4, 4, 'FD');
  doc.roundedRect(rightCardX, cardTop, cardW, cardH, 4, 4, 'FD');

  const padX = 14;

  // Left card: BILL label + number + status pill, then date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setText(MUTED);
  doc.text('BILL', leftCardX + padX, cardTop + 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  setText(INK);
  const billNoText = String(bill.billNumber || '');
  doc.text(billNoText, leftCardX + padX, cardTop + 40);

  const statusCfg = STATUS_STYLES[bill.status] || STATUS_STYLES.draft;
  const badgeLabel = statusCfg.label;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const badgeTextW = doc.getTextWidth(badgeLabel);
  const badgeW = badgeTextW + 16;
  const badgeH = 16;
  const badgeX = leftCardX + cardW - padX - badgeW;
  const badgeY = cardTop + 12;
  setFill(statusCfg.bg);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, badgeH / 2, badgeH / 2, 'F');
  setText(statusCfg.fg);
  doc.text(badgeLabel, badgeX + badgeW / 2, badgeY + badgeH / 2 + 3, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setText(MUTED);
  doc.text(
    `Date: ${new Date(bill.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    leftCardX + padX,
    cardTop + 58
  );

  // Right card: BILLED TO label + customer details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setText(MUTED);
  doc.text('BILLED TO', rightCardX + padX, cardTop + 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  setText(INK);
  doc.text(String(bill.customerName || ''), rightCardX + padX, cardTop + 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setText(MUTED);
  let contactY = cardTop + 52;
  if (bill.customerPhone) { doc.text(bill.customerPhone, rightCardX + padX, contactY); contactY += 12; }
  if (bill.customerEmail) { doc.text(bill.customerEmail, rightCardX + padX, contactY); }

  // ── Line-item table ────────────────────────────────────────────────────
  let tableY = cardTop + cardH + 30;
  const tableTop = tableY;
  const rowH0 = 26;

  setFill(DARK_FILL);
  doc.rect(MARGIN, tableY, RIGHT_EDGE - MARGIN, rowH0, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setText([255, 255, 255]);
  doc.text('DESCRIPTION', MARGIN + 12, tableY + 17);
  doc.text('QTY', RIGHT_EDGE - 220, tableY + 17, { align: 'right' });
  doc.text('RATE', RIGHT_EDGE - 110, tableY + 17, { align: 'right' });
  doc.text('AMOUNT', RIGHT_EDGE - 10, tableY + 17, { align: 'right' });

  tableY += rowH0;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const items = bill.lineItems || [];
  items.forEach((item, i) => {
    const desc = String(item.description || '');
    const wrapped = doc.splitTextToSize(desc, RIGHT_EDGE - MARGIN - 260);
    const rowH = Math.max(24, wrapped.length * 12 + 12);

    if (i % 2 === 0) {
      setFill([252, 253, 254]);
      doc.rect(MARGIN, tableY, RIGHT_EDGE - MARGIN, rowH, 'F');
    }

    setText(INK);
    doc.text(wrapped, MARGIN + 12, tableY + 16);
    doc.text(String(item.quantity ?? 1), RIGHT_EDGE - 220, tableY + 16, { align: 'right' });
    doc.text(fmt(item.rate), RIGHT_EDGE - 110, tableY + 16, { align: 'right' });
    doc.text(fmt(item.amount), RIGHT_EDGE - 10, tableY + 16, { align: 'right' });
    tableY += rowH;

    line(tableY, 0.5, [241, 245, 249]);
  });

  // Outer border around the whole table for a defined "block" feel.
  setDraw(CARD_LINE);
  doc.setLineWidth(0.75);
  doc.rect(MARGIN, tableTop, RIGHT_EDGE - MARGIN, tableY - tableTop);

  // ── Totals block, right-aligned ────────────────────────────────────────
  tableY += 22;
  const totalsLabelX = RIGHT_EDGE - 150;
  const totalsValueX = RIGHT_EDGE - 10;
  doc.setFontSize(10);

  const putRow = (label, value, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    setText(bold ? INK : MUTED);
    doc.text(label, totalsLabelX, tableY, { align: 'right' });
    doc.text(value, totalsValueX, tableY, { align: 'right' });
    tableY += 18;
  };

  putRow('Subtotal', fmt(bill.subtotal));
  if (Number(bill.discount) > 0) putRow('Discount', `- ${fmt(bill.discount)}`);
  if (Number(bill.taxRate) > 0) putRow(`Tax (${bill.taxRate}%)`, fmt(bill.taxAmount));

  // Grand total — a dark filled pill so it's the one number that jumps out.
  tableY += 6;
  const pillH = 30;
  const pillX = totalsLabelX - 20;
  const pillW = totalsValueX - pillX + 10;
  setFill(DARK_FILL);
  doc.roundedRect(pillX, tableY, pillW, pillH, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  setText([255, 255, 255]);
  doc.text('TOTAL', pillX + 12, tableY + pillH / 2 + 4);
  doc.text(fmt(bill.total), pillX + pillW - 12, tableY + pillH / 2 + 4, { align: 'right' });
  tableY += pillH;

  // ── Footer — notes + GST info ──────────────────────────────────────────
  let footerY = tableY + 40;
  if (bill.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setText([75, 85, 99]);
    doc.text('NOTES', MARGIN, footerY);
    doc.setFont('helvetica', 'normal');
    setText([51, 65, 85]);
    const wrapped = doc.splitTextToSize(String(bill.notes), RIGHT_EDGE - MARGIN);
    doc.text(wrapped, MARGIN, footerY + 14);
    footerY += 14 + wrapped.length * 12 + 20;
  }
  const effectiveGstin = (bill.gstNumber && bill.gstNumber.trim()) || business.gstin || '';
  if (effectiveGstin) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setText(MUTED);
    doc.text(`GSTIN: ${effectiveGstin}`, MARGIN, footerY);
    footerY += 16;
  }

  // Divider + closing lines, anchored to the bottom of the page so short
  // bills don't leave the footer floating awkwardly mid-page.
  const bottomY = PAGE_H - 44;
  line(bottomY - 20, 0.75, [226, 232, 240]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  setText([51, 65, 85]);
  doc.text('Thank you for your business.', PAGE_W / 2, bottomY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setText(FAINT);
  doc.text(
    `Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    PAGE_W / 2,
    bottomY + 13,
    { align: 'center' }
  );

  return Buffer.from(doc.output('arraybuffer'));
}
