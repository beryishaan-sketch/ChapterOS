import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, Upload, FileSpreadsheet, CheckCircle2,
  ArrowRight, ChevronLeft, AlertCircle, X, Trash2
} from 'lucide-react';
import client from '../api/client';

const STEPS = ['Upload', 'Map Columns', 'Done'];

const SAMPLE_CSV = `Date,Description,Category,Type,Amount
2026-01-15,National Dues Payment,dues,expense,1900
2026-01-20,Spring Social Venue,venue,expense,800
2026-02-01,Dues Collected,dues,income,5200
2026-02-14,Valentine Social Food,food,expense,350`;

const FIELD_OPTIONS = [
  { value: '',             label: '— Skip —' },
  { value: 'txDate',       label: 'Date' },
  { value: 'txDescription',label: 'Description / Memo' },
  { value: 'txCategory',   label: 'Category' },
  { value: 'txType',       label: 'Type (income/expense)' },
  { value: 'txAmount',     label: 'Amount ($) — combined' },
  { value: 'txIncome',     label: 'Income / Credit ($)' },
  { value: 'txExpense',    label: 'Expense / Debit ($)' },
];

export default function TreasuryImport() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState([]);
  const [preview, setPreview] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [mapping, setMapping] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setCsvText(e.target.result);
    reader.readAsText(file);
    setError('');
  };

  const handlePreview = async () => {
    if (!csvText.trim()) { setError('Upload a file or paste CSV text first'); return; }
    setLoading(true); setError('');
    try {
      const res = await client.post('/import/preview', { csv: csvText });
      if (!res.data.success) throw new Error(res.data.error);
      const { headers: h, preview: p, totalRows: t, suggestedMapping: sm } = res.data.data;
      setHeaders(h); setPreview(p); setTotalRows(t);
      const m = {};
      h.forEach(col => { const matched = Object.keys(sm).find(k => sm[k] === col); m[col] = matched || ''; });
      setMapping(m);
      setStep(1);
    } catch (e) { setError(e.response?.data?.error || e.message); }
    finally { setLoading(false); }
  };

  const handleImport = async () => {
    setLoading(true); setError('');
    try {
      const fieldMapping = {};
      Object.entries(mapping).forEach(([col, field]) => { if (field) fieldMapping[field] = col; });
      const res = await client.post('/import/transactions', { csv: csvText, mapping: fieldMapping });
      if (!res.data.success) throw new Error(res.data.error);
      setResult(res.data.data);
      setStep(2);
    } catch (e) { setError(e.response?.data?.error || e.message || 'Import failed'); }
    finally { setLoading(false); }
  };

  const handleClearTransactions = async () => {
    setClearing(true);
    try {
      await client.delete('/import/transactions');
      setClearConfirm(false);
      navigate('/budget');
    } catch (e) { setError(e.response?.data?.error || 'Clear failed'); }
    finally { setClearing(false); }
  };

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/budget')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ChevronLeft size={18} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Treasury Import</h1>
          <p className="text-sm text-gray-400">Upload your transaction ledger and sync it instantly</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
              ${step === i ? 'bg-navy text-white' : step > i ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
              {step > i ? <CheckCircle2 size={11} /> : <span>{i + 1}</span>}
              {s}
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px ${step > i ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-700">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Step 0: Upload */}
      {step === 0 && (
        <div className="space-y-5">
          <div
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${dragOver ? 'border-navy bg-navy/5' : 'border-gray-200 hover:border-gray-300'}`}
            onClick={() => document.getElementById('treasury-file').click()}
          >
            <input id="treasury-file" type="file" accept=".csv,.txt" className="hidden"
              onChange={e => handleFile(e.target.files[0])} />
            <FileSpreadsheet size={32} className="text-gray-300 mx-auto mb-3" />
            {fileName
              ? <p className="text-sm font-semibold text-gray-800">{fileName}</p>
              : <>
                  <p className="text-sm font-semibold text-gray-600">Drop CSV or click to upload</p>
                  <p className="text-xs text-gray-400 mt-1">Supports any bank export, QuickBooks, or custom ledger</p>
                </>
            }
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">or paste CSV</span></div>
          </div>

          <textarea
            className="w-full h-32 input-field font-mono text-xs resize-none"
            placeholder="Paste CSV text here..."
            value={csvText}
            onChange={e => { setCsvText(e.target.value); setFileName(''); }}
          />

          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">Example format</p>
            <pre className="text-xs text-gray-500 font-mono whitespace-pre-wrap">{SAMPLE_CSV}</pre>
          </div>

          <button onClick={handlePreview} disabled={loading || !csvText.trim()}
            className="btn-primary w-full justify-center gap-2">
            {loading ? 'Reading…' : <><Upload size={15} /> Preview Columns <ArrowRight size={14} /></>}
          </button>
        </div>
      )}

      {/* Step 1: Map columns */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">Map your columns</p>
            <p className="text-xs text-blue-600">{totalRows} rows detected. Tell us what each column means — columns can be skipped.</p>
          </div>

          <div className="card divide-y divide-gray-50">
            {headers.map(col => (
              <div key={col} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{col}</p>
                  {preview[0]?.[col] && <p className="text-xs text-gray-400 truncate mt-0.5">e.g. {preview[0][col]}</p>}
                </div>
                <select
                  className="input-field w-48 text-sm py-1.5"
                  value={mapping[col] || ''}
                  onChange={e => setMapping(m => ({ ...m, [col]: e.target.value }))}
                >
                  {FIELD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="btn-secondary flex-1">← Back</button>
            <button onClick={handleImport} disabled={loading} className="btn-primary flex-1 justify-center gap-2">
              {loading ? 'Importing…' : <><Wallet size={15} /> Import Transactions</>}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Done */}
      {step === 2 && result && (
        <div className="text-center py-8 space-y-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Import Complete</h2>
            <p className="text-sm text-gray-400 mt-1">Your transactions are now in the treasury</p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <div className="bg-emerald-50 rounded-2xl p-4">
              <p className="text-2xl font-extrabold text-emerald-700">{result.created || 0}</p>
              <p className="text-xs text-emerald-600 mt-1">Transactions added</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-4">
              <p className="text-2xl font-extrabold text-blue-700">{result.skipped || 0}</p>
              <p className="text-xs text-blue-600 mt-1">Skipped</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <button onClick={() => navigate('/budget')} className="btn-primary w-full justify-center gap-2">
              <Wallet size={15} /> View Treasury →
            </button>
            <button onClick={() => { setStep(0); setCsvText(''); setFileName(''); setResult(null); }}
              className="btn-secondary w-full">Import Another File</button>
          </div>
        </div>
      )}

      {/* Danger zone */}
      <div className="mt-10 border border-red-100 rounded-2xl overflow-hidden">
        <div className="bg-red-50 px-4 py-3 border-b border-red-100">
          <p className="text-sm font-bold text-red-700">Reset Transaction Data</p>
          <p className="text-xs text-red-500 mt-0.5">Remove all imported transactions and start fresh</p>
        </div>
        <div className="p-4">
          {clearConfirm ? (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
              <p className="flex-1 text-sm text-red-700 font-medium">Delete ALL transactions?</p>
              <button onClick={handleClearTransactions} disabled={clearing}
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors">
                {clearing ? 'Clearing…' : 'Yes, clear all'}
              </button>
              <button onClick={() => setClearConfirm(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"><X size={14} /></button>
            </div>
          ) : (
            <button onClick={() => setClearConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 hover:bg-red-50 transition-colors text-left group">
              <Trash2 size={15} className="text-red-400 group-hover:text-red-600" />
              <div>
                <p className="text-sm font-semibold text-gray-800">Clear All Transactions</p>
                <p className="text-xs text-gray-400">Removes all treasury transactions permanently.</p>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
