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
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Leads
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="bg-slate-900 p-8 text-white relative">
            {/* Status Diagnostic */}
            <div className="absolute top-2 right-4 text-[10px] font-mono text-slate-500 uppercase">
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
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Bulk Lead Upload</h1>
                  <p className="text-slate-400">Import leads via CSV with automated staggering</p>
                </div>
              </div>
              
              {(status === 'idle' || status === 'ready' || status === 'completed') && (
                <label
                  htmlFor="csv-upload-input"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  {data.length > 0 ? 'Change CSV' : 'Select CSV'}
                </label>
              )}
            </div>
          </div>

          <div className="p-8">
            {status === 'idle' ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl">
                <LayoutGrid className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">No file selected</h3>
                <p className="text-slate-500 mb-6">Upload a CSV file with headers like Name, Email, Phone</p>
                <label
                  htmlFor="csv-upload-input"
                  className="px-8 py-4 bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-bold hover:bg-slate-100 transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Choose CSV File
                </label>
              </div>
            ) : status === 'parsing' ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-xl font-bold text-slate-900">Parsing CSV...</h3>
                <p className="text-slate-500">Wait a moment while we process your file</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-sm font-semibold text-slate-500 mb-1">Total Leads</p>
                    <p className="text-3xl font-bold text-slate-900">{data.length}</p>
                  </div>
                  <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                    <p className="text-sm font-semibold text-emerald-600 mb-1">Successful</p>
                    <p className="text-3xl font-bold text-emerald-700">{results.success}</p>
                  </div>
                  <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                    <p className="text-sm font-semibold text-red-600 mb-1">Failed</p>
                    <p className="text-3xl font-bold text-red-700">{results.failed}</p>
                  </div>
                  <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                    <p className="text-sm font-semibold text-indigo-600 mb-1">Remaining</p>
                    <p className="text-3xl font-bold text-indigo-700">{data.length - currentIndex}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span className="text-slate-700">Overall Progress</span>
                    <span className="text-indigo-600">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  {status === 'processing' && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 animate-pulse">
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
                      className="flex-1 py-4 bg-amber-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-amber-600 transition-all shadow-lg shadow-amber-100"
                    >
                      <Pause className="w-5 h-5" />
                      Pause
                    </button>
                  ) : status === 'completed' ? (
                    <button
                      onClick={() => router.push('/automation/leads')}
                      className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Finish & Return
                    </button>
                  ) : (
                    <button
                      onClick={startProcessing}
                      className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                      <Play className="w-5 h-5" />
                      {currentIndex > 0 ? 'Resume Processing' : 'Start Processing'}
                    </button>
                  )}
                  
                  {status !== 'completed' && (
                    <button
                      onClick={cancelProcessing}
                      className="px-8 py-4 bg-white text-red-600 border border-red-100 rounded-2xl font-bold hover:bg-red-50 transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Logs */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-slate-400" />
                    Activity Log
                  </h3>
                  <div className="bg-slate-50 rounded-2xl p-6 h-64 overflow-y-auto font-mono text-sm space-y-2 border border-slate-100">
                    {logs.length === 0 ? (
                      <p className="text-slate-400 italic">No activity yet</p>
                    ) : (
                      logs.map((log, i) => (
                        <div key={i} className="text-slate-700">{log}</div>
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
