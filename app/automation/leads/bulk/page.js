'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Upload, 
  FileSpreadsheet, 
  Play, 
  Pause, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  LayoutGrid
} from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';
import { authFetch, getAuthToken } from '@/lib/apiClient';
import { useConfirm } from '@/app/components/ConfirmProvider';

export default function BulkUploadPage() {
  const confirm = useConfirm();
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [status, setStatus] = useState('idle'); // idle, processing, paused, completed
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState({ success: 0, failed: 0 });
  const [logs, setLogs] = useState([]);

  const handleFileUpload = (e) => {
    console.log('File upload triggered');
    const selectedFile = e.target.files[0];
    if (!selectedFile) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', selectedFile.name, 'Size:', selectedFile.size);
    setFile(selectedFile);
    setStatus('parsing'); // New intermediate status
    
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        console.log('CSV Parsing Complete. Columns:', results.meta.fields);
        console.log('Rows found:', results.data.length);
        
        if (results.data && results.data.length > 0) {
          setData(results.data);
          setStatus('ready');
          setCurrentIndex(0);
          setResults({ success: 0, failed: 0 });
          setLogs([]);
          toast.success(`Successfully loaded ${results.data.length} leads`);
        } else {
          console.error('CSV parsed but no data found');
          setStatus('idle');
          toast.error('The CSV file appears to be empty or formatting is incorrect');
        }
        
        // Reset input so same file can be picked again
        if (e.target) e.target.value = '';
      },
      error: (error) => {
        console.error('PapaParse Error:', error);
        setStatus('idle');
        toast.error(`Failed to read CSV: ${error.message || 'Unknown error'}`);
        if (e.target) e.target.value = '';
      }
    });
  };

  const processBatch = async (index) => {
    if (index >= data.length) {
      setStatus('completed');
      toast.success('Bulk upload completed!');
      return;
    }

    if (status === 'paused') return;

    setStatus('processing');
    const lead = data[index];
    if (!getAuthToken()) {
      toast.error('User ID not found in session. Please log in again.');
      setStatus('idle');
      return;
    }

    try {
      // Improved header mapping (case-insensitive and trimmed)
      const findValue = (keys) => {
        const foundKey = Object.keys(lead).find(k => 
          keys.some(key => k.toLowerCase().trim() === key.toLowerCase())
        );
        return foundKey ? String(lead[foundKey]).trim() : '';
      };

      const location = {
        country: findValue(['country', 'nation']),
        city: findValue(['city', 'town']),
        state: findValue(['state', 'region', 'province']),
        postalCode: findValue(['postal code', 'postalcode', 'zip', 'zip code', 'pincode', 'pin code']),
        street: findValue(['street', 'address', 'street address']),
      };
      const cleanedLocation = Object.fromEntries(
        Object.entries(location).filter(([, value]) => value)
      );

      const leadPayload = {
        name: findValue(['name', 'full name', 'fullname', 'customer', 'lead name']) || 'Unknown',
        email: findValue(['email', 'email address', 'e-mail']),
        phone: findValue(['phone', 'phone number', 'phonenumber', 'mobile', 'cell', 'contact']),
        serviceInterest: findValue(['service', 'interest', 'serviceinterest', 'product']),
        source: 'bulk',
        message: findValue(['message', 'notes', 'note', 'comment', 'comments', 'description']) || 'Imported via bulk upload',
        ...(Object.keys(cleanedLocation).length ? { location: cleanedLocation } : {}),
      };

      console.log('Sending lead payload:', leadPayload);

      const res = await authFetch('/api/automation/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadPayload),
      });

      const result = await res.json();

      if (result.success) {
        setResults(prev => ({ ...prev, success: prev.success + 1 }));
        setLogs(prev => [`✅ [${index + 1}/${data.length}] Successfully added: ${leadPayload.name}`, ...prev]);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setResults(prev => ({ ...prev, failed: prev.failed + 1 }));
      setLogs(prev => [`❌ [${index + 1}/${data.length}] Failed: ${lead.Name || 'Unknown'} - ${error.message}`, ...prev]);
    }

    const nextIndex = index + 1;
    setCurrentIndex(nextIndex);

    if (nextIndex < data.length) {
      // Reduced delay to 500ms
      setTimeout(() => {
        processBatch(nextIndex);
      }, 500);
    } else {
      setStatus('completed');
      toast.success('Bulk upload completed!');
    }
  };

  const startProcessing = () => {
    if (data.length === 0) {
      toast.error('Please upload a CSV file first');
      return;
    }
    setStatus('processing');
    processBatch(currentIndex);
  };

  const pauseProcessing = () => {
    setStatus('paused');
    toast('Processing paused');
  };

  const cancelProcessing = async () => {
    if (await confirm({ title: 'Cancel uploads', message: 'Are you sure you want to cancel the remaining uploads?', confirmLabel: 'Cancel uploads', cancelLabel: 'Keep going', danger: true })) {
      setStatus('idle');
      setCurrentIndex(0);
      setData([]);
      setFile(null);
      setResults({ success: 0, failed: 0 });
      setLogs([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const progress = data.length > 0 ? (currentIndex / data.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-canvas p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-fg-tertiary hover:text-accent-fg transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Leads
        </button>

        <div className="bg-canvas rounded-lg border border-line overflow-hidden mb-8">
          <div className="bg-slate-900 p-8 text-white relative">
            {/* Status Diagnostic */}
            <div className="absolute top-2 right-4 text-meta font-mono text-fg-tertiary">
              UI Status: {status} | Data: {data.length}
            </div>

            <input 
              type="file" 
              id="csv-upload-input"
              ref={fileInputRef} 
              className="hidden" 
              accept=".csv" 
              onChange={handleFileUpload}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-canvas/10 rounded-lg flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-page font-semibold text-fg">Bulk Lead Upload</h1>
                  <p className="text-fg-tertiary">Import leads via CSV with automated staggering</p>
                </div>
              </div>
              
              {(status === 'idle' || status === 'ready' || status === 'completed') && (
                <label
                  htmlFor="csv-upload-input"
                  className="px-6 py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent-hover transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  {data.length > 0 ? 'Change CSV' : 'Select CSV'}
                </label>
              )}
            </div>
          </div>

          <div className="p-8">
            {status === 'idle' ? (
              <div className="text-center py-12 border-2 border-dashed border-line rounded-lg">
                <LayoutGrid className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-fg mb-2">No file selected</h3>
                <p className="text-fg-tertiary mb-6">Upload a CSV file with headers like Name, Email, Phone</p>
                <label
                  htmlFor="csv-upload-input"
                  className="px-8 py-4 bg-subtle text-fg-secondary border border-line rounded-lg font-semibold hover:bg-muted transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Choose CSV File
                </label>
              </div>
            ) : status === 'parsing' ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-fg">Parsing CSV...</h3>
                <p className="text-fg-tertiary">Wait a moment while we process your file</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-subtle p-6 rounded-lg border border-line">
                    <p className="text-sm font-semibold text-fg-tertiary mb-1">Total Leads</p>
                    <p className="text-hero font-semibold text-fg">{data.length}</p>
                  </div>
                  <div className="bg-accent-subtle p-6 rounded-lg border border-line">
                    <p className="text-sm font-semibold text-accent-fg mb-1">Successful</p>
                    <p className="text-hero font-semibold text-accent-fg">{results.success}</p>
                  </div>
                  <div className="bg-danger-subtle p-6 rounded-lg border border-danger/30">
                    <p className="text-sm font-semibold text-danger mb-1">Failed</p>
                    <p className="text-hero font-semibold text-danger">{results.failed}</p>
                  </div>
                  <div className="bg-accent-subtle p-6 rounded-lg border border-line">
                    <p className="text-sm font-semibold text-accent-fg mb-1">Remaining</p>
                    <p className="text-hero font-semibold text-accent-fg">{data.length - currentIndex}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="text-fg-secondary">Overall Progress</span>
                    <span className="text-accent-fg">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  {status === 'processing' && (
                    <div className="flex items-center gap-2 text-sm text-fg-tertiary animate-pulse">
                      <Clock className="w-4 h-4" />
                      Processing lead...
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4">
                  {status === 'processing' ? (
                    <button
                      onClick={pauseProcessing}
                      className="flex-1 py-4 bg-warning text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-warning transition-all shadow-popover"
                    >
                      <Pause className="w-5 h-5" />
                      Pause
                    </button>
                  ) : status === 'completed' ? (
                    <button
                      onClick={() => router.push('/automation/leads')}
                      className="flex-1 py-4 bg-accent text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-accent-hover transition-all shadow-popover"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Finish & Return
                    </button>
                  ) : (
                    <button
                      onClick={startProcessing}
                      className="flex-1 py-4 bg-accent text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-accent-hover transition-all shadow-popover"
                    >
                      <Play className="w-5 h-5" />
                      {currentIndex > 0 ? 'Resume Processing' : 'Start Processing'}
                    </button>
                  )}
                  
                  {status !== 'completed' && (
                    <button
                      onClick={cancelProcessing}
                      className="px-8 py-4 bg-canvas text-danger border border-danger/30 rounded-lg font-semibold hover:bg-danger-subtle transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Logs */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-fg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-fg-tertiary" />
                    Activity Log
                  </h3>
                  <div className="bg-subtle rounded-lg p-6 h-64 overflow-y-auto font-mono text-sm space-y-2 border border-line">
                    {logs.length === 0 ? (
                      <p className="text-fg-tertiary italic">No activity yet</p>
                    ) : (
                      logs.map((log, i) => (
                        <div key={i} className="text-fg-secondary">{log}</div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
