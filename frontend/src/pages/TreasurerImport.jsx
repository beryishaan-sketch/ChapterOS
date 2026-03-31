import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, Upload, FileSpreadsheet, CheckCircle2,
  ArrowRight, ChevronLeft, AlertCircle, X, Users, Trash2
} from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const STEPS = ['Upload', 'Map Columns', 'Done'];

const SAMPLE_CSV = `Name,Paid,Amount
John Smith,Yes,250
Mike Jones,No,250
Alex Williams,Yes,250
Chris Brown,Partial,125`;

export default function TreasurerImport() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const [clearing, setClearing] = useState(null); // 'dues' | 'members' | null
  const [clearConfirm, setClearConfirm] = useState(null);

  const handleClear = async (type) => {
    setClearing(type);
    try {
      await client.delete(`/import/${type}`);
      setClearConfirm(null);
      navigate(type === 'dues' ? '/dues' : '/members');
    } catch (e) {
      setError(e.response?.data?.error || 'Clear failed');
    } finally { setClearing(null); }
  };

  const FIELD_OPTIONS = [
    { value: '',               label: '— Skip —' },
    { value: 'firstName',      label: 'First Name' },
    { value: 'lastName',       label: 'Last Name' },
    { value: 'fullName',       label: 'Full Name (First + Last)' },
    { value: 'email',          label: 'Email' },
    { value: 'duesAmount',     label: 'Total Dues Owed ($)' },
    { value: 'duesDiscount',   label: 'Discount / Reduction ($)' },
    { value: 'duesPaidWinter', label: 'Payments Made (Winter/Fall)' },
    { value: 'duesPaidSpring', label: 'Payments Made (Spring)' },
    { value: 'duesOwing',      label: 'A/R — Amount Still Owed ($)' },
    { value: 'duesPaid',       label: 'Paid? (Yes/No column)' },
    { value: 'notes',          label: 'Notes' },
  ];

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
      // Build mapping
      const m = {};
      h.forEach(col => {
        const matched = Object.keys(sm).find(k => sm[k] === col);
        m[col] = matched || '';
      });
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
      const res = await client.post('/import/members', { csv: csvText, mapping: fieldMapping });
      if (!res.data.success) throw new Error(res.data.error);
      setResult(res.data.data);
      setStep(2);
    } catch (e) { setError(e.response?.data?.error || e.message || 'Import failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/dues')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ChevronLeft size={18} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Dues Import</h1>
          <p className="text-sm text-gray-400">Upload your dues spreadsheet and sync it instantly</p>
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
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-700">
          <AlertCircle size={14} /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={13} /></button>
        </div>
      )}

      {/* Step 0: Upload */}
      {step === 0 && (
        <div className="space-y-4">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer
              ${dragOver ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'}`}
            onClick={() => document.getElementById('dues-file').click()}
          >
            <input id="dues-file" type="file" accept=".csv,.xlsx,.xls" className="hidden"
              onChange={e => handleFile(e.target.files[0])} />
            <FileSpreadsheet size={36} className={`mx-auto mb-3 ${dragOver ? 'text-emerald-500' : 'text-gray-300'}`} />
            {fileName ? (
              <>
                <p className="font-semibold text-gray-900">{fileName}</p>
                <p className="text-sm text-emerald-600 mt-1">✓ File loaded — click Continue</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-gray-700">Drop your dues spreadsheet here</p>
                <p className="text-sm text-gray-400 mt-1">CSV, Excel — any format works</p>
              </>
            )}
          </div>

          {/* Format tip */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Expected format</p>
            <pre className="text-xs text-gray-600 font-mono bg-white rounded-xl p-3 border border-gray-100 overflow-auto">{SAMPLE_CSV}</pre>
            <p className="text-xs text-gray-400 mt-2">Column names don't need to match exactly — we'll auto-detect them</p>
          </div>

          {/* Paste fallback */}
          {!fileName && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Or paste CSV text</p>
              <textarea
                className="input-field w-full font-mono text-xs resize-none"
                rows={5}
                placeholder="Paste CSV content here..."
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
              />
            </div>
          )}

          <button onClick={handlePreview} disabled={loading || (!csvText.trim() && !fileName)}
            className="btn-primary w-full justify-center py-3 gap-2">
            {loading ? 'Reading file…' : <>Continue <ArrowRight size={15} /></>}
          </button>
        </div>
      )}

      {/* Step 1: Map columns */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="font-bold text-gray-900">Map your columns</p>
              <p className="text-sm text-gray-400 mt-0.5">{totalRows} rows detected · Tell us what each column means</p>
            </div>
            <div className="divide-y divide-gray-50">
              {headers.map(col => (
                <div key={col} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{col}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">
                      {preview.slice(0, 2).map(r => r[col]).filter(Boolean).join(', ')}…
                    </p>
                  </div>
                  <ArrowRight size={13} className="text-gray-300 flex-shrink-0" />
                  <select
                    className="select-field text-sm py-2 flex-shrink-0"
                    style={{ width: '180px' }}
                    value={mapping[col] || ''}
                    onChange={e => setMapping(m => ({ ...m, [col]: e.target.value }))}>
                    {FIELD_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <p className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-50">Preview (first 3 rows)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>{headers.map(h => <th key={h} className="px-4 py-2 text-left text-gray-500 font-medium">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {preview.slice(0, 3).map((row, i) => (
                    <tr key={i}>{headers.map(h => <td key={h} className="px-4 py-2 text-gray-700">{row[h] || '—'}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="btn-secondary px-5">Back</button>
            <button onClick={handleImport} disabled={loading}
              className="btn-primary flex-1 justify-center py-3 gap-2">
              {loading ? 'Importing…' : <><DollarSign size={15} /> Import {totalRows} Members</>}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Done */}
      {step === 2 && result && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Import Complete</h2>
          <p className="text-gray-500 mb-6">{result.duesSummary || 'Dues data synced successfully'}</p>

          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto mb-6">
            <div className="bg-emerald-50 rounded-2xl p-4">
              <p className="text-2xl font-extrabold text-emerald-700">{result.created || 0}</p>
              <p className="text-xs text-emerald-600 mt-1">Dues updated</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-4">
              <p className="text-2xl font-extrabold text-amber-700">{result.skipped || 0}</p>
              <p className="text-xs text-amber-600 mt-1">Not matched</p>
            </div>
          </div>

          {/* Show unmatched names */}
          {result.errors?.length > 0 && (
            <div className="max-w-sm mx-auto mb-6 text-left">
              <p className="text-xs font-semibold text-amber-700 mb-2">⚠️ These names weren't found in Members — import members first, then re-import dues:</p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 max-h-40 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-amber-800 py-0.5">{e}</p>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <button onClick={() => navigate('/dues')} className="btn-primary w-full justify-center gap-2">
              <DollarSign size={15} /> View Dues →
            </button>
            <button onClick={() => { setStep(0); setCsvText(''); setFileName(''); setResult(null); }}
              className="btn-secondary w-full">Import Another File</button>
          </div>
        </div>
      )}

      {/* Danger zone — reset imported data */}
      <div className="mt-10 border border-red-100 rounded-2xl overflow-hidden">
        <div className="bg-red-50 px-4 py-3 border-b border-red-100">
          <p className="text-sm font-bold text-red-700">Reset Imported Data</p>
          <p className="text-xs text-red-500 mt-0.5">Use this if an import went wrong and you need to start fresh</p>
        </div>
        <div className="p-4 space-y-3">
          {/* Clear dues */}
          {clearConfirm === 'dues' ? (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
              <p className="flex-1 text-sm text-red-700 font-medium">Delete ALL dues records?</p>
              <button onClick={() => handleClear('dues')} disabled={clearing === 'dues'}
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors">
                {clearing === 'dues' ? 'Clearing…' : 'Yes, clear dues'}
              </button>
              <button onClick={() => setClearConfirm(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"><X size={14} /></button>
            </div>
          ) : (
            <button onClick={() => setClearConfirm('dues')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 hover:bg-red-50 transition-colors text-left group">
              <Trash2 size={15} className="text-red-400 group-hover:text-red-600" />
              <div>
                <p className="text-sm font-semibold text-gray-800">Clear All Dues</p>
                <p className="text-xs text-gray-400">Removes all dues records. Members stay.</p>
              </div>
            </button>
          )}
          {/* Clear ghost members */}
          {clearConfirm === 'members' ? (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
              <p className="flex-1 text-sm text-red-700 font-medium">Delete all imported ghost members?</p>
              <button onClick={() => handleClear('members')} disabled={clearing === 'members'}
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors">
                {clearing === 'members' ? 'Clearing…' : 'Yes, remove ghosts'}
              </button>
              <button onClick={() => setClearConfirm(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"><X size={14} /></button>
            </div>
          ) : (
            <button onClick={() => setClearConfirm('members')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 hover:bg-red-50 transition-colors text-left group">
              <Users size={15} className="text-red-400 group-hover:text-red-600" />
              <div>
                <p className="text-sm font-semibold text-gray-800">Clear Imported Members</p>
                <p className="text-xs text-gray-400">Removes ghost accounts created by bad imports. Your real account stays.</p>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
