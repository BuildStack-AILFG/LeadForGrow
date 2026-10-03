import { jsPDF } from 'jspdf';

/**
 * Render a bill to a PDF Buffer using jsPDF.
 *
 * Classic professional tax-invoice layout (the shape accountants and customers expect):
 *   - Thin ink bar on top; seller block (logo, name, address, contact, GSTIN) on the left,
 *     "TAX INVOICE" (or "INVOICE" without a GSTIN) + an invoice-details panel on the right
 *   - "Bill to" and "Payment" boxes side by side
 *   - Ruled item table: # / Item & description / Qty / Rate / Amount; long bills continue
 *     on the next page with the header repeated
 *   - Amount in words (Indian numbering) + notes on the left, a totals box on the right
 *   - A "PAID" stamp when the bill is paid; signature block (stamp image, "For <business>",
 *     signatory name + designation); "computer-generated" note and page numbers
 *
 * Neutral ink palette — this is the business's own customer-facing document, so it carries
 * no LeadForGrow branding. Fields the Bill model doesn't have are omitted rather than shown
 * empty.
 *
 * @param logoDataUrl  - Optional data URL of the business logo.
 * @param stampDataUrl - Optional data URL of the company stamp / seal.
 */
export function renderBillPdf({ bill, business, logoDataUrl, stampDataUrl }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });

  const PAGE_W = doc.internal.pageSize.getWidth();
  const PAGE_H = doc.internal.pageSize.getHeight();
  const M = 40;
  const R = PAGE_W - M;
  const W = R - M;
  const FOOTER_Y = PAGE_H - 30;
  const CONTENT_BOTTOM = PAGE_H - 60;

  const INK = [17, 24, 39];
  const BODY = [55, 65, 81];
  const MUTED = [107, 114, 128];
  const LINE = [229, 231, 235];
  const HEAD_BG = [243, 244, 246];
  const PANEL_BG = [249, 250, 251];
  const GREEN = [21, 128, 61];

  const setFill = (c) => doc.setFillColor(c[0], c[1], c[2]);
  const setDraw = (c) => doc.setDrawColor(c[0], c[1], c[2]);
  const setText = (c) => doc.setTextColor(c[0], c[1], c[2]);
  const font = (style, size) => { doc.setFont('helvetica', style); doc.setFontSize(size); };
  const num = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money = (n) => `Rs. ${num(n)}`;
  const date = (d) => new Date(d || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const gstin = (bill.gstNumber && bill.gstNumber.trim()) || business.gstin || '';
  const isPaid = bill.status === 'paid';
  const isVoid = bill.status === 'void';

  const drawImage = (dataUrl, x, y, maxW, maxH, alignRight = false) => {
    try {
      const m = /^data:image\/(png|jpe?g|webp)/i.exec(dataUrl);
      const fmt = m ? m[1].toUpperCase().replace('JPG', 'JPEG') : 'PNG';
      const p = doc.getImageProperties(dataUrl);
      const scale = Math.min(maxW / p.width, maxH / p.height);
      const w = p.width * scale;
      const h = p.height * scale;
      doc.addImage(dataUrl, fmt, alignRight ? x - w : x, y, w, h);
      return { w, h };
    } catch {
      return null;
    }
  };

  // ── Top ink bar ──────────────────────────────────────────────────────────
  setFill(INK);
  doc.rect(0, 0, PAGE_W, 5, 'F');

  // ── Seller block (left) ──────────────────────────────────────────────────
  let sy = 44;
  if (logoDataUrl) {
    const img = drawImage(logoDataUrl, M, sy - 8, 120, 44);
    if (img) sy += img.h + 6;
  }
  font('bold', 15);
  setText(INK);
  doc.text(String(business.businessName || 'Business'), M, sy + 8);
  sy += 24;
  font('normal', 8.5);
  setText(MUTED);
  const sellerLines = [];
  if (business.address) sellerLines.push(...doc.splitTextToSize(String(business.address), 230).slice(0, 3));
  const contact = [business.phone, business.email].filter(Boolean).join('  |  ');
  if (contact) sellerLines.push(contact);
  if (business.website) sellerLines.push(String(business.website));
  sellerLines.forEach((l) => { doc.text(l, M, sy); sy += 11.5; });
  if (gstin) {
    font('bold', 8.5);
    setText(BODY);
    doc.text(`GSTIN: ${gstin}`, M, sy);
    sy += 11.5;
  }

  // ── Title + invoice details (right) ─────────────────────────────────────
  font('bold', 22);
  setText(INK);
  doc.setCharSpace(1.5);
  doc.text(gstin ? 'TAX INVOICE' : 'INVOICE', R, 50, { align: 'right' });
  doc.setCharSpace(0);

  const details = [
    ['Invoice No.', bill.billNumber || '-'],
    ['Invoice Date', date(bill.createdAt)],
  ];
  if (bill.sentAt) details.push(['Sent On', date(bill.sentAt)]);
  if (isPaid && bill.paidAt) details.push(['Paid On', date(bill.paidAt)]);
  details.push(['Status', isPaid ? 'Paid' : isVoid ? 'Void' : bill.status === 'draft' ? 'Draft' : 'Due']);

  const panelW = 210;
  const panelX = R - panelW;
  const rowH = 17;
  const panelY = 66;
  const panelH = details.length * rowH + 10;
  setFill(PANEL_BG);
  setDraw(LINE);
  doc.setLineWidth(0.75);
  doc.rect(panelX, panelY, panelW, panelH, 'FD');
  details.forEach(([k, v], i) => {
    const y = panelY + 17 + i * rowH;
    font('normal', 8.5);
    setText(MUTED);
    doc.text(k, panelX + 10, y);
    font('bold', 9);
    setText(k === 'Status' ? (isPaid ? GREEN : isVoid ? [185, 28, 28] : INK) : INK);
    doc.text(String(v), R - 10, y, { align: 'right' });
  });

  // ── Bill to + Payment boxes ─────────────────────────────────────────────
  let y = Math.max(sy, panelY + panelH) + 22;
  const gap = 14;
  const boxW = (W - gap) / 2;
  const boxTop = y;

  const boxLabel = (label, x) => {
    font('bold', 7.5);
    setText(MUTED);
    doc.setCharSpace(0.8);
    doc.text(label, x + 12, boxTop + 16);
    doc.setCharSpace(0);
  };

  // Bill to
  boxLabel('BILL TO', M);
  font('bold', 11);
  setText(INK);
  doc.text(String(bill.customerName || ''), M + 12, boxTop + 33);
  font('normal', 9);
  setText(BODY);
  let by = boxTop + 47;
  if (bill.customerPhone) { doc.text(String(bill.customerPhone), M + 12, by); by += 12; }
  if (bill.customerEmail) { doc.text(String(bill.customerEmail), M + 12, by); by += 12; }

  // Payment
  const px = M + boxW + gap;
  boxLabel(isPaid ? 'PAYMENT RECEIVED' : 'AMOUNT DUE', px);
  font('bold', 16);
  setText(isPaid ? GREEN : INK);
  doc.text(money(bill.total), px + 12, boxTop + 36);
  font('normal', 8.5);
  setText(BODY);
  let pyy = boxTop + 50;
  const payLink = bill.paymentLink?.shortUrl;
  if (isPaid) {
    if (bill.paidAt) { doc.text(`Received on ${date(bill.paidAt)}`, px + 12, pyy); pyy += 12; }
    if (bill.paymentNote) {
      doc.text(doc.splitTextToSize(`Ref: ${bill.paymentNote}`, boxW - 24)[0], px + 12, pyy);
      pyy += 12;
    }
  } else if (payLink && !isVoid) {
    doc.text('Pay online:', px + 12, pyy);
    setText([29, 78, 216]);
    doc.textWithLink(String(payLink), px + 12 + doc.getTextWidth('Pay online: '), pyy, { url: /^https?:/i.test(payLink) ? payLink : `https://${payLink}` });
    pyy += 12;
  }

  const boxH = Math.max(by, pyy) - boxTop + 8;
  setDraw(LINE);
  doc.setLineWidth(0.75);
  doc.rect(M, boxTop, boxW, boxH);
  doc.rect(px, boxTop, boxW, boxH);
  // PAID / VOID stamp inside the payment box, right side.
  if (isPaid || isVoid) {
    const label = isPaid ? 'PAID' : 'VOID';
    const col = isPaid ? GREEN : [185, 28, 28];
    font('bold', 18);
    const tw = doc.getTextWidth(label);
    const sw = tw + 22;
    const sh = 30;
    const sx = R - 14 - sw;
    const sTop = boxTop + (boxH - sh) / 2;
    setDraw(col);
    setText(col);
    doc.setLineWidth(1.5);
    doc.roundedRect(sx, sTop, sw, sh, 3, 3);
    doc.text(label, sx + sw / 2, sTop + sh / 2 + 6, { align: 'center' });
  }
  y = boxTop + boxH + 22;

  // ── Item table ──────────────────────────────────────────────────────────
  const cNo = M + 10;
  const cDesc = M + 34;
  const cQty = R - 196;   // right-aligned
  const cRate = R - 104;  // right-aligned
  const cAmt = R - 10;    // right-aligned
  const descW = cQty - 40 - cDesc;
  const HEAD_H = 24;

  const drawHead = () => {
    setFill(HEAD_BG);
    setDraw(LINE);
    doc.setLineWidth(0.75);
    doc.rect(M, y, W, HEAD_H, 'FD');
    font('bold', 8);
    setText(BODY);
    doc.text('#', cNo, y + 15.5);
    doc.text('ITEM & DESCRIPTION', cDesc, y + 15.5);
    doc.text('QTY', cQty, y + 15.5, { align: 'right' });
    doc.text('RATE (Rs.)', cRate, y + 15.5, { align: 'right' });
    doc.text('AMOUNT (Rs.)', cAmt, y + 15.5, { align: 'right' });
    y += HEAD_H;
  };
  drawHead();

  const items = bill.lineItems || [];
  items.forEach((item, i) => {
    font('normal', 9.5);
    const lines = doc.splitTextToSize(String(item.description || ''), descW);
    const h = Math.max(26, lines.length * 12 + 14);
    if (y + h > CONTENT_BOTTOM) {
      doc.addPage();
      y = 48;
      drawHead();
      font('normal', 9.5);
    }
    setText(MUTED);
    doc.text(String(i + 1), cNo, y + 17);
    setText(INK);
    doc.text(lines, cDesc, y + 17);
    setText(BODY);
    doc.text(String(item.quantity ?? 1), cQty, y + 17, { align: 'right' });
    doc.text(num(item.rate), cRate, y + 17, { align: 'right' });
    font('bold', 9.5);
    setText(INK);
    doc.text(num(item.amount), cAmt, y + 17, { align: 'right' });
    setDraw(LINE);
    doc.setLineWidth(0.5);
    doc.line(M, y + h, R, y + h);
    // side rules keep the table reading as one bordered block
    doc.line(M, y, M, y + h);
    doc.line(R, y, R, y + h);
    y += h;
  });

  // ── Totals (right) + amount in words / notes (left) ─────────────────────
  const discount = Number(bill.discount) || 0;
  const taxAmt = Number(bill.taxAmount) || 0;
  const totals = [['Sub-total', num(bill.subtotal)]];
  if (discount > 0) totals.push(['Discount', `- ${num(discount)}`]);
  if (discount > 0 && taxAmt > 0) totals.push(['Taxable amount', num((Number(bill.subtotal) || 0) - discount)]);
  if (taxAmt > 0 || Number(bill.taxRate) > 0) {
    totals.push([`${gstin ? 'GST' : 'Tax'}${Number(bill.taxRate) ? ` @ ${bill.taxRate}%` : ''}`, num(taxAmt)]);
  }

  const totW = 236;
  const totX = R - totW;
  const TOT_ROW = 18;
  const totBlockH = totals.length * TOT_ROW + 12 + 30;
  if (y + 14 + totBlockH > CONTENT_BOTTOM - 70) { doc.addPage(); y = 48; }
  y += 14;
  const totTop = y;

  totals.forEach(([k, v]) => {
    font('normal', 9);
    setText(MUTED);
    doc.text(k, totX + 10, y + 12);
    setText(INK);
    doc.text(v, R - 10, y + 12, { align: 'right' });
    y += TOT_ROW;
  });
  y += 6;
  setFill(INK);
  doc.rect(totX, y, totW, 28, 'F');
  font('bold', 10.5);
  setText([255, 255, 255]);
  doc.text('Total (INR)', totX + 10, y + 18);
  doc.text(money(bill.total), R - 10, y + 18, { align: 'right' });
  y += 28;
  if (!isVoid) {
    font('bold', 9);
    setText(isPaid ? GREEN : INK);
    doc.text('Balance due', totX + 10, y + 16);
    doc.text(money(isPaid ? 0 : bill.total), R - 10, y + 16, { align: 'right' });
    y += 22;
  }

  // Left column beside the totals.
  const leftW = totX - M - 24;
  let ly = totTop + 12;
  font('bold', 7.5);
  setText(MUTED);
  doc.setCharSpace(0.8);
  doc.text('AMOUNT IN WORDS', M, ly);
  doc.setCharSpace(0);
  ly += 13;
  font('bold', 9);
  setText(INK);
  const words = doc.splitTextToSize(amountInWords(bill.total), leftW);
  doc.text(words, M, ly);
  ly += words.length * 12 + 12;

  if (bill.notes) {
    font('bold', 7.5);
    setText(MUTED);
    doc.setCharSpace(0.8);
    doc.text('NOTES & TERMS', M, ly);
    doc.setCharSpace(0);
    ly += 13;
    font('normal', 8.5);
    setText(BODY);
    const notes = doc.splitTextToSize(String(bill.notes), leftW).slice(0, 8);
    doc.text(notes, M, ly);
    ly += notes.length * 11 + 6;
  }
  y = Math.max(y, ly);

  // ── Signature block ─────────────────────────────────────────────────────
  const SIG_H = 96;
  if (y + 24 + SIG_H > CONTENT_BOTTOM) { doc.addPage(); y = 48; }
  const sigTop = y + 30;
  const sigW = 180;
  const sigX = R - sigW;
  font('bold', 9);
  setText(BODY);
  doc.text(`For ${business.businessName || 'Business'}`, R, sigTop + 10, { align: 'right' });
  const sigLineY = sigTop + 74;
  if (stampDataUrl) drawImage(stampDataUrl, sigX + sigW / 2 + 30, sigTop + 16, 60, 54, true);
  setDraw([156, 163, 175]);
  doc.setLineWidth(0.6);
  doc.line(sigX, sigLineY, R, sigLineY);
  font('bold', 9);
  setText(INK);
  doc.text(String(business.billSignatoryName || 'Authorised Signatory'), R, sigLineY + 13, { align: 'right' });
  if (business.billSignatoryName) {
    font('normal', 8);
    setText(MUTED);
    doc.text(String(business.billSignatoryTitle || 'Authorised Signatory'), R, sigLineY + 24, { align: 'right' });
  }

  font('bold', 10);
  setText(INK);
  doc.text('Thank you for your business.', M, sigLineY + 13);

  // ── Footer on every page ────────────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    setDraw(LINE);
    doc.setLineWidth(0.5);
    doc.line(M, FOOTER_Y - 12, R, FOOTER_Y - 12);
    font('normal', 7.5);
    setText(MUTED);
    doc.text('This is a computer-generated invoice.', M, FOOTER_Y);
    doc.text(`${bill.billNumber || ''}${bill.billNumber ? '  ·  ' : ''}Page ${p} of ${pages}`, R, FOOTER_Y, { align: 'right' });
  }

  return Buffer.from(doc.output('arraybuffer'));
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
  'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n) {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`;
}

function threeDigits(n) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return [h ? `${ONES[h]} Hundred` : '', rest ? twoDigits(rest) : ''].filter(Boolean).join(' ');
}

/** Integer → words in the Indian system (crore / lakh / thousand). */
function indianWords(n) {
  if (n === 0) return 'Zero';
  const parts = [];
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (crore) parts.push(`${indianWords(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (n) parts.push(threeDigits(n));
  return parts.join(' ');
}

/** 1234.5 → "Indian Rupees One Thousand Two Hundred Thirty Four and Fifty Paise Only" */
export function amountInWords(amount) {
  const value = Math.max(0, Math.round(Number(amount || 0) * 100));
  const rupees = Math.floor(value / 100);
  const paise = value % 100;
  return `Indian Rupees ${indianWords(rupees)}${paise ? ` and ${twoDigits(paise)} Paise` : ''} Only`;
}
