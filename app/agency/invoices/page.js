'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Search, FileText, Check, Clock, AlertCircle, Ban, Loader2, Settings, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { authFetch } from '@/lib/apiClient';



export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [agencyInfo, setAgencyInfo] = useState(null);
  
  const [formData, setFormData] = useState({
    clientId: '',
    amount: '',
    currency: 'INR',
    billingPeriod: { startDate: '', endDate: '' },
    notes: '',
    dueDate: '',
    projectTitle: '',
    lineItems: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
    agencyDetails: { name: '', address: '', phone: '', email: '', website: '' },
    clientDetails: { name: '', address: '', email: '' }
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, cliRes] = await Promise.all([
        authFetch('/api/agency/invoices'),
        authFetch('/api/agency/clients')
      ]);
      const invData = await invRes.json();
      const cliData = await cliRes.json();
      
      if (invData.success) {
        setInvoices(invData.invoices);
        setAgencyInfo(invData.agency);
      }
      if (cliData.success) setClients(cliData.clients.filter(c => c.status === 'active'));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const res = await authFetch('/api/agency/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setInvoices([data.invoice, ...invoices]);
        setShowModal(false);
        setFormData({ clientId: '', amount: '', currency: 'INR', billingPeriod: { startDate: '', endDate: '' }, notes: '', dueDate: '' });
      } else {
        setError(data.error || 'Failed to create invoice');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (invoiceId, newStatus) => {
    try {
      const res = await authFetch(`/api/agency/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setInvoices(invoices.map(inv => inv._id === invoiceId ? data.invoice : inv));
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  };

  const generatePDF = (invoice) => {
    const doc = new jsPDF();
    const primaryColor = [15, 23, 42]; // slate-900
    const secondaryColor = [100, 116, 139]; // slate-500
    const accentColor = [241, 245, 249]; // slate-100
    const lineColor = [226, 232, 240]; // slate-200

    // Helper: Formatter
    const currencyCode = invoice.currency || 'INR';
    const currencySymbol = currencyCode === 'USD' ? '$' : 'Rs.';
    const fmtMoney = (amt) => `${currencySymbol} ${(amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    // --- 1. Top Bar (Brand & Invoice ID) ---
    const agency = invoice.agencyDetails || agencyInfo || {};
    
    // Left: Agency Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.text(agency.name || 'Agency Name', 14, 20);

    // Right: Invoice Label & Number
    doc.setFontSize(24);
    doc.text('INVOICE', 196, 20, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...secondaryColor);
    doc.text(`# ${invoice.invoiceNumber}`, 196, 26, { align: 'right' });

    // --- 2. Context Bar (Dates & Status) ---
    const topMetaY = 35;
    doc.setDrawColor(...lineColor);
    doc.line(14, topMetaY, 196, topMetaY);
    
    const metaY = topMetaY + 5;
    
    // Status
    const statusColor = invoice.status === 'paid' ? [16, 185, 129] : [100, 116, 139];
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...secondaryColor);
    doc.text('STATUS', 14, metaY + 4);
    doc.setTextColor(...statusColor);
    doc.text(invoice.status.toUpperCase(), 14, metaY + 9);

    // Issue Date
    doc.setTextColor(...secondaryColor);
    doc.text('ISSUED', 50, metaY + 4);
    doc.setTextColor(...primaryColor);
    doc.text(new Date(invoice.createdAt).toLocaleDateString(), 50, metaY + 9);

    // Due Date
    doc.setTextColor(...secondaryColor);
    doc.text('DUE', 90, metaY + 4);
    doc.setTextColor(...primaryColor);
    doc.text(invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString() : 'On Receipt', 90, metaY + 9);

    // Amount Due (highlight)
    doc.setTextColor(...secondaryColor);
    doc.text('AMOUNT DUE', 196, metaY + 4, { align: 'right' });
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text(fmtMoney(invoice.amount), 196, metaY + 9, { align: 'right' });

    doc.line(14, metaY + 14, 196, metaY + 14);

    // --- 3. Addresses Section ---
    const addrY = metaY + 25;
    
    // From (Agency)
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...secondaryColor);
    doc.text('FROM', 14, addrY);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.text(agency.name || '', 14, addrY + 5);
    
    doc.setFontSize(9);
    doc.setTextColor(...secondaryColor);
    let fromY = addrY + 10;
    if (agency.address) {
       const lines = doc.splitTextToSize(agency.address, 80);
       doc.text(lines, 14, fromY);
       fromY += (lines.length * 4);
    }
    if (agency.email) { doc.text(agency.email, 14, fromY); fromY += 4; }
    if (agency.phone) { doc.text(agency.phone, 14, fromY); fromY += 4; }

    // To (Client)
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...secondaryColor);
    doc.text('BILL TO', 110, addrY);

    const client = invoice.clientDetails || {};
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.text(client.name || 'Client Name', 110, addrY + 5);

    doc.setFontSize(9);
    doc.setTextColor(...secondaryColor);
    let toY = addrY + 10;
    if (client.address) {
        const lines = doc.splitTextToSize(client.address, 80);
        doc.text(lines, 110, toY);
        toY += (lines.length * 4);
    }
    if (client.email) { doc.text(client.email, 110, toY); toY += 4; }
    
    // Project Context
    const contextY = Math.max(fromY, toY) + 10;
    if (invoice.projectTitle) {
      doc.setFontSize(9);
      doc.setTextColor(...secondaryColor);
      doc.text(`Project: ${invoice.projectTitle}`, 14, contextY);
    }

    // --- 4. Items Table ---
    const tableHeaders = [['Description', 'Qty', 'Rate', 'Amount']];
    const tableData = (invoice.lineItems && invoice.lineItems.length > 0) 
      ? invoice.lineItems.map(item => [
          item.description, 
          item.quantity, 
          fmtMoney(item.unitPrice), 
          fmtMoney(item.total)
        ])
      : [['General Service', 1, fmtMoney(invoice.amount), fmtMoney(invoice.amount)]];

    autoTable(doc, {
      startY: contextY + 10,
      head: tableHeaders,
      body: tableData,
      theme: 'plain',
      headStyles: { 
          fillColor: accentColor, 
          textColor: secondaryColor,
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'left',
          cellPadding: { top: 2, bottom: 2, left: 2, right: 2 }
      },
      styles: { 
          font: 'helvetica',
          fontSize: 9, 
          cellPadding: 3, 
          textColor: primaryColor,
          lineColor: lineColor,
          lineWidth: { bottom: 0.1 }
      },
      columnStyles: {
        0: { cellWidth: 'auto' }, 
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'right', cellWidth: 35 },
        3: { halign: 'right', fontStyle: 'bold', cellWidth: 35 }
      }
    });

    // --- 5. Totals & Footer ---
    const finalY = doc.lastAutoTable.finalY + 5;
    const rightEdge = 196;

    // Totals Block
    doc.setFontSize(9);
    doc.setTextColor(...secondaryColor);
    doc.text('Subtotal', rightEdge - 40, finalY + 5, { align: 'right' });
    doc.setTextColor(...primaryColor);
    doc.text(fmtMoney(invoice.amount), rightEdge, finalY + 5, { align: 'right' });

    doc.setTextColor(...secondaryColor);
    doc.text('Tax (0%)', rightEdge - 40, finalY + 10, { align: 'right' });
    doc.setTextColor(...primaryColor);
    doc.text(fmtMoney(0), rightEdge, finalY + 10, { align: 'right' });
    
    // Divider
    doc.setDrawColor(...lineColor);
    doc.line(rightEdge - 60, finalY + 14, rightEdge, finalY + 14);

    // Total
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text('Total', rightEdge - 40, finalY + 20, { align: 'right' });
    doc.text(fmtMoney(invoice.amount), rightEdge, finalY + 20, { align: 'right' });

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...secondaryColor);
    doc.text('Thank you for your business.', 14, pageHeight - 15);
    
    doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.clientId?.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    const matchesClient = filterClient === 'all' || invoice.clientId?._id === filterClient;
    return matchesSearch && matchesStatus && matchesClient;
  });

  const stats = {
    total: filteredInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
    paid: filteredInvoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + (inv.amount || 0), 0),
    pending: filteredInvoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((sum, inv) => sum + (inv.amount || 0), 0)
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[18px] font-semibold text-slate-900 dark:text-slate-50">Invoices</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Financial ledger for {invoices.length} transactions</p>
        </div>
        <button
          onClick={() => {
             setShowModal(true);
             // Pre-fill agency details if available
             if (agencyInfo) {
                setFormData(prev => ({
                   ...prev,
                   agencyDetails: {
                      name: agencyInfo.name || '',
                      address: agencyInfo.address || '',
                      phone: agencyInfo.phone || '',
                      email: agencyInfo.email || '',
                      website: agencyInfo.website || ''
                   }
                }));
             }
          }}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-all text-[13px] font-bold active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Create Invoice
        </button>
      </div>

      {/* KPI Band */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 rounded-xl flex flex-col justify-between h-[100px]">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Invoiced</p>
            <h3 className="text-[20px] font-bold text-slate-900 dark:text-slate-50">₹{stats.total.toLocaleString()}</h3>
         </div>
         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 rounded-xl flex flex-col justify-between h-[100px]">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Total Collected</p>
            <h3 className="text-[20px] font-bold text-emerald-600 dark:text-emerald-400">₹{stats.paid.toLocaleString()}</h3>
         </div>
         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 rounded-xl flex flex-col justify-between h-[100px]">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-amber-600 dark:text-amber-400">Outstanding</p>
            <h3 className="text-[20px] font-bold text-amber-600 dark:text-amber-400">₹{stats.pending.toLocaleString()}</h3>
         </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice number or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[12px] font-medium text-slate-600 dark:text-slate-300 outline-none">
              <option value="all">Any Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
           </select>
           <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[12px] font-medium text-slate-600 dark:text-slate-300 outline-none">
              <option value="all">All Clients</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.clientName}</option>)}
           </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Descriptor</th>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Client Name</th>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Amount</th>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Released</th>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[13px]">
            {filteredInvoices.map((inv) => (
              <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-slate-50">{inv.invoiceNumber}</td>
                <td className="px-6 py-4">
                   <p className="font-bold text-slate-900 dark:text-slate-50">{inv.clientId?.clientName || 'Deleted Client'}</p>
                </td>
                <td className="px-6 py-4 text-center font-bold text-slate-900 dark:text-slate-50">₹{inv.amount?.toLocaleString()}</td>
                <td className="px-6 py-4 text-center">
                   <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                      inv.status === 'paid' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' :
                      inv.status === 'overdue' ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                   }`}>
                      {inv.status}
                   </span>
                </td>
                <td className="px-6 py-4 text-slate-400 text-[12px]">{new Date(inv.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                   <div className="flex justify-end gap-2 text-right">
                      <button onClick={() => generatePDF(inv)} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-all bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/30" title="Download PDF"><Download className="w-4 h-4" /></button>
                      {inv.status === 'draft' && <button onClick={() => handleStatusChange(inv._id, 'sent')} className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md transition-all"><FileText className="w-4 h-4" /></button>}
                      {inv.status === 'sent' && <button onClick={() => handleStatusChange(inv._id, 'paid')} className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md transition-all"><Check className="w-4 h-4" /></button>}
                      <button className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 rounded-md transition-all"><Settings className="w-4 h-4" /></button>
                   </div>
                </td>
              </tr>
            ))}
            {filteredInvoices.length === 0 && (
              <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400 italic font-medium tracking-tight">No financial records matching criteria.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-[18px] font-semibold text-slate-900 dark:text-slate-50">New Financial Document</h2>
                 <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-50">✕</button>
              </div>

              {error && <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-xl text-rose-600 dark:text-rose-400 text-[12px] font-medium">{error}</div>}

              <form onSubmit={handleCreate} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-[12px] font-bold text-slate-900 dark:text-slate-50 uppercase tracking-tight">Billing Profiles</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Agency Address (Optional)</label>
                          <textarea 
                            value={formData.agencyDetails.address} 
                            onChange={(e) => setFormData({...formData, agencyDetails: {...formData.agencyDetails, address: e.target.value}})}
                            placeholder="Your agency business address..."
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] h-20 resize-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Client Address (Optional)</label>
                          <textarea 
                            value={formData.clientDetails.address} 
                            onChange={(e) => setFormData({...formData, clientDetails: {...formData.clientDetails, address: e.target.value}})}
                            placeholder="Client's billing address..."
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] h-20 resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                 <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Recipient Client *</label>
                    <select
                      required
                      value={formData.clientId}
                      onChange={(e) => {
                         const clientId = e.target.value;
                         const client = clients.find(c => c._id === clientId);
                         setFormData(prev => ({
                            ...prev, 
                            clientId,
                            clientDetails: client ? {
                               name: client.clientName,
                               email: client.primaryContact?.email || '',
                               address: prev.clientDetails.address // Keep existing input or add logic to finding address
                            } : prev.clientDetails
                         }));
                      }}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] outline-none"
                    >
                      <option value="">Select recipient...</option>
                      {clients.map(c => <option key={c._id} value={c._id}>{c.clientName}</option>)}
                    </select>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total Amount (Auto-calculated) *</label>
                        <input type="number" required readOnly value={formData.amount} className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] font-bold cursor-not-allowed" />
                     </div>
                    <div>
                       <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Currency</label>
                       <select value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px]">
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                       </select>
                    </div>
                 </div>

                  <div className="space-y-4">
                    <h3 className="text-[12px] font-bold text-slate-900 dark:text-slate-50 uppercase tracking-tight">Invoice Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Project / Service Name</label>
                        <input type="text" value={formData.projectTitle} onChange={(e) => setFormData({...formData, projectTitle: e.target.value})} placeholder="e.g. Q1 Marketing Campaign" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px]" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Due Date</label>
                        <input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px]" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[12px] font-bold text-slate-900 dark:text-slate-50 uppercase tracking-tight">Service Breakdown</h3>
                      <button type="button" onClick={() => setFormData({...formData, lineItems: [...formData.lineItems, { description: '', quantity: 1, unitPrice: 0, total: 0 }]})} className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">+ Add Item</button>
                    </div>
                    {formData.lineItems.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-6">
                          <label className="block text-[10px] text-slate-400 font-bold mb-1">Description</label>
                          <input type="text" value={item.description} onChange={(e) => {
                            const newItems = [...formData.lineItems];
                            newItems[idx].description = e.target.value;
                            setFormData({...formData, lineItems: newItems});
                          }} className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded text-[12px]" />
                        </div>
                        <div className="col-span-2">
                           <label className="block text-[10px] text-slate-400 font-bold mb-1">Qty</label>
                           <input type="number" value={item.quantity} onChange={(e) => {
                            const newItems = [...formData.lineItems];
                            newItems[idx].quantity = parseInt(e.target.value) || 0;
                            newItems[idx].total = newItems[idx].quantity * newItems[idx].unitPrice;
                            const totalAmount = newItems.reduce((sum, i) => sum + i.total, 0);
                            setFormData({...formData, lineItems: newItems, amount: totalAmount});
                          }} className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded text-[12px]" />
                        </div>
                        <div className="col-span-3">
                           <label className="block text-[10px] text-slate-400 font-bold mb-1">Rate</label>
                           <input type="number" value={item.unitPrice} onChange={(e) => {
                            const newItems = [...formData.lineItems];
                            newItems[idx].unitPrice = parseFloat(e.target.value) || 0;
                            newItems[idx].total = newItems[idx].quantity * newItems[idx].unitPrice;
                            const totalAmount = newItems.reduce((sum, i) => sum + i.total, 0);
                            setFormData({...formData, lineItems: newItems, amount: totalAmount});
                          }} className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded text-[12px]" />
                        </div>
                        <div className="col-span-1 pb-2">
                           <button type="button" onClick={() => {
                             const newItems = formData.lineItems.filter((_, i) => i !== idx);
                             const totalAmount = newItems.reduce((sum, i) => sum + i.total, 0);
                             setFormData({...formData, lineItems: newItems, amount: totalAmount});
                           }} className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-300">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Period Start</label>
                        <input type="date" required value={formData.billingPeriod.startDate} onChange={(e) => setFormData({...formData, billingPeriod: {...formData.billingPeriod, startDate: e.target.value}})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px]" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Period End</label>
                        <input type="date" required value={formData.billingPeriod.endDate} onChange={(e) => setFormData({...formData, billingPeriod: {...formData.billingPeriod, endDate: e.target.value}})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px]" />
                    </div>
                  </div>

                 <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 rounded-lg text-[13px] font-bold border border-slate-200 dark:border-slate-700">Cancel</button>
                    <button type="submit" disabled={creating} className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-[13px] font-bold active:scale-95 disabled:opacity-50">{creating ? 'Processing...' : 'Issue Document'}</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

