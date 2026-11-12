import { NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { withTenantAuth } from '@/lib/auth';
import { formatInTimeZone } from '@/lib/dates/localDateTime';

const MAX_EXPORT_ROWS = 5000;

export const POST = withTenantAuth(async (request) => {
  try {
    const { leads, filter } = await request.json();

    if (!leads || leads.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No leads to export' },
        { status: 400 }
      );
    }

    if (leads.length > MAX_EXPORT_ROWS) {
      return NextResponse.json(
        { success: false, error: `Export limited to ${MAX_EXPORT_ROWS} leads at a time` },
        { status: 400 }
      );
    }

    const getPriority = (lead) => {
      const hoursSince = Math.floor(
        (Date.now() - new Date(lead.receivedAt)) / (1000 * 60 * 60)
      );

      if (lead.status === 'new' && hoursSince < 2)
        return { label: 'HOT', color: [220, 38, 38] };
      if (lead.status === 'new' && hoursSince < 24)
        return { label: 'WARM', color: [249, 115, 22] };
      if (lead.status === 'new')
        return { label: 'COLD', color: [148, 163, 184] };
      if (lead.status === 'contacted' || lead.status === 'follow-up')
        return { label: 'ACTIVE', color: [99, 102, 241] };

      return { label: 'LOW', color: [203, 213, 225] };
    };

    const hotLeads = leads.filter(l => getPriority(l).label === 'HOT').length;
    const warmLeads = leads.filter(l => getPriority(l).label === 'WARM').length;
    const coldLeads = leads.filter(l => getPriority(l).label === 'COLD').length;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Title
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text('Lead Management Report', 148, 15, { align: 'center' });

    // Subtitle
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${formatInTimeZone(new Date())}`, 148, 22, { align: 'center' });
    doc.text(
      `Filter: ${(filter || 'all').toUpperCase()} | Total Leads: ${leads.length}`,
      148,
      27,
      { align: 'center' }
    );

    // Priority summary
    doc.setFontSize(9);
    doc.setTextColor(220, 38, 38);
    doc.text(`HOT: ${hotLeads}`, 20, 35);
    doc.setTextColor(249, 115, 22);
    doc.text(`WARM: ${warmLeads}`, 50, 35);
    doc.setTextColor(100, 116, 139);
    doc.text(`COLD: ${coldLeads}`, 85, 35);

    const tableData = leads.map((lead, index) => {
      const priority = getPriority(lead);
      return [
        String(index + 1),
        priority.label,
        lead.name || 'N/A',
        lead.email || 'N/A',
        lead.phone || 'N/A',
        lead.source || 'Direct',
        lead.assignedTo?.email || 'Unassigned',
        lead.status?.charAt(0).toUpperCase() + lead.status?.slice(1),
        new Date(lead.receivedAt).toLocaleDateString()
      ];
    });

    autoTable(doc, {
      startY: 42,
      head: [['S.No', 'Priority', 'Name', 'Email', 'Phone', 'Source', 'Assigned', 'Status', 'Date']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
        textColor: [30, 41, 59]
      },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 35, fontStyle: 'bold' },
        3: { cellWidth: 45 },
        4: { cellWidth: 28 },
        5: { cellWidth: 22 },
        6: { cellWidth: 35 },
        7: { cellWidth: 22, halign: 'center' },
        8: { cellWidth: 25 }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didParseCell(data) {
        if (data.column.index === 1 && data.section === 'body') {
          const priority = getPriority(leads[data.row.index]);
          data.cell.styles.fillColor = priority.color;
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      didDrawCell(data) {
        if (data.column.index === 0 && data.section === 'body') {
          const priority = getPriority(leads[data.row.index]);
          doc.setDrawColor(...priority.color);
          doc.setLineWidth(1);
          doc.line(
            data.cell.x,
            data.cell.y,
            data.cell.x,
            data.cell.y + data.cell.height
          );
        }
      },
      margin: { top: 42, left: 10, right: 10, bottom: 20 },
      didDrawPage() {
        const pageCount = doc.internal.getNumberOfPages();
        const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;

        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Page ${pageNumber} of ${pageCount}`,
          148,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }
    });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=leads-${new Date()
          .toISOString()
          .split('T')[0]}.pdf`
      }
    });
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export to PDF' },
      { status: 500 }
    );
  }
});
