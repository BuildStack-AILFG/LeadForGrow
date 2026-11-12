// API Route: /api/automation/leads/export/excel
// File: app/api/automation/leads/export/excel/route.js

import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { withTenantAuth } from '@/lib/auth';
import { formatInTimeZone } from '@/lib/dates/localDateTime';

export const POST = withTenantAuth(async (request) => {
  try {
    const { leads, filter } = await request.json();

    if (!leads || leads.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No leads to export' },
        { status: 400 }
      );
    }

    if (leads.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Export limited to 5000 leads at a time' },
        { status: 400 }
      );
    }

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leads');

    // Define columns with proper widths
    worksheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 18 },
      { header: 'Service Interest', key: 'service', width: 25 },
      { header: 'Assigned To', key: 'assignedTo', width: 25 },
      { header: 'Source', key: 'source', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Received At', key: 'receivedAt', width: 20 }
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' } // Indigo
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Helper function to get priority
    const getPriority = (lead) => {
      const hoursSince = Math.floor((new Date() - new Date(lead.receivedAt)) / (1000 * 60 * 60));
      
      if (lead.status === 'new' && hoursSince < 2) {
        return { label: 'HOT', color: 'FFDC2626' }; // Red
      } else if (lead.status === 'new' && hoursSince < 24) {
        return { label: 'WARM', color: 'FFF97316' }; // Orange
      } else if (lead.status === 'new') {
        return { label: 'COLD', color: 'FF94A3B8' }; // Gray
      } else if (lead.status === 'contacted' || lead.status === 'follow-up') {
        return { label: 'ACTIVE', color: 'FF6366F1' }; // Indigo
      }
      return { label: 'LOW', color: 'FFCBD5E1' }; // Light gray
    };

    // Add data rows
    leads.forEach((lead, index) => {
      const priority = getPriority(lead);
      const row = worksheet.addRow({
        sno: index + 1,
        priority: priority.label,
        name: lead.name,
        email: lead.email || 'N/A',
        phone: lead.phone,
        service: lead.serviceInterest || 'N/A',
        assignedTo: lead.assignedTo?.email || 'Unassigned',
        source: lead.source || 'Direct',
        status: lead.status.charAt(0).toUpperCase() + lead.status.slice(1),
        receivedAt: formatInTimeZone(lead.receivedAt)
      });

      // Style data rows with alternating colors
      const fillColor = index % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF';
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: fillColor }
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });

      // Color-code priority cell
      const priorityCell = row.getCell('priority');
      priorityCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      priorityCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: priority.color }
      };
      priorityCell.alignment = { vertical: 'middle', horizontal: 'center' };

      // Bold S.No and Name
      row.getCell('sno').font = { bold: true };
      row.getCell('name').font = { bold: true };
    });

    // Add summary row at the top (before data)
    worksheet.insertRow(1, []);
    const summaryRow = worksheet.insertRow(1, [
      'Lead Export',
      '',
      `Total: ${leads.length}`,
      '',
      `Filter: ${(filter || 'all').toUpperCase()}`,
      '',
      `Date: ${new Date().toLocaleDateString()}`
    ]);
    summaryRow.font = { bold: true, size: 12 };
    summaryRow.height = 20;
    worksheet.mergeCells('A1:B1');
    worksheet.mergeCells('C1:D1');
    worksheet.mergeCells('E1:F1');
    worksheet.mergeCells('G1:J1');

    // Insert blank row after summary
    worksheet.insertRow(2, []);

    // Freeze header row (row 3 after summary)
    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 3 }
    ];

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=leads-${new Date().toISOString().split('T')[0]}.xlsx`
      }
    });

  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export to Excel' },
      { status: 500 }
    );
  }
});