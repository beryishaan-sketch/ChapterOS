import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Link, FileText, ChevronRight, Check, AlertCircle, Users, Star, ArrowRight, RefreshCw } from 'lucide-react';
import client from '../api/client';

const STEPS = ['Upload Source', 'Map Columns', 'Import'];
const KNOWN_FIELDS = [
  { value: '', label: 'Skip this column' },
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'major', label: 'Major' },
  { value: 'year', label: 'Year / Grade' },
  { value: 'pledgeClass', label: 'Pledge Class' },
  { value: 'gpa', label: 'GPA' },
  { value: 'position', label: 'Position / Role' },
  { value: 'mutualConnections', label: 'Mutual Connections' },
  { value: 'notes', label: 'Notes' },
];

export default function Import() {
  const navigate = useNavigate();
  const fileRef = useRef();

  const [step, setStep] = useState(0);
  const [importType, setImportType] = useState('members'); // members | pnms
  const [csvText, setCsvText] = useState('');
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [inputMode, setInputMode] = useState('file'); // file | url | paste
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 2
  const [headers, setHeaders] = useState([]);
  const [preview, setPreview] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [mapping, setMapping] = useState({});

  // Step 3
  const [result, setResult] = useState(null);

  const extractSheetId = (url) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target.result);
    reader.readAsText(file);
  };

  const handleFetchSheets = async () => {
    const id = extractSheetId(sheetsUrl);
    if (!id) { setError('Invalid Google Sheets URL'); return; }
    setLoading(true);
    setError('');
    try {
      const exportUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
      const res = await fetch(exportUrl);
      if (!res.ok) throw new Error('Could not fetch sheet — make sure it is set to "Anyone with the link can view"');
      const text = await res.text();
      setCsvText(text);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!csvText.trim()) { setError('No CSV data — upload a file, paste a link, or paste CSV text'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await client.post('/import/preview', { csv: csvText });
      if (res.data.success) {
        const { headers: h, preview: p, totalRows: t, suggestedMapping: sm } = res.data.data;
        setHeaders(h);
        setPreview(p);
        setTotalRows(t);
        setMapping(Object.fromEntries(h.map(col => [col, sm[Object.keys(sm).find(k => sm[k] === col)] || ''])));
        setStep(1);
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to parse CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = importType === 'members' ? '/import/members' : '/import/pnms';
      // Convert mapping: { columnName: fieldName } → { fieldName: columnName }
      const fieldMapping = {};
      Object.entries(mapping).forEach(([col, field]) => { if (field) fieldMapping[field] = col; });
      const res = await client.post(endpoint, { csv: csvText, mapping: fieldMapping });
      if (res.data.success) {
        setResult(res.data.data);
        setStep(2);
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto lg:max-w-4xl">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Import Data</h1>
        <p className="page-subtitle">Import members or PNMs from a CSV file or Google Sheet</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <React.Fragment key={i}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${done ? 'bg-gold text-navy-dark' : active ? 'bg-navy text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {done ? <Check size={14} /> : i + 1}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${active ? 'text-gray-900' : done ? 'text-gold-dark' : 'text-gray-400'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-3 rounded-full ${done ? 'bg-gold' : 'bg-gray-200'}`} />}
            </React.Fragment>
          );
        })}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg mb-5">
          <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Step 0: Upload */}
      {step === 0 && (
        <div className="card p-8">
          {/* Import type */}
          <div className="mb-6">
            <p className="label mb-2">What are you importing?</p>
            <div className="flex gap-3">
              {[
                { value: 'members', label: 'Members', icon: Users, desc: 'Add to your chapter roster' },
                { value: 'pnms', label: 'PNMs', icon: Star, desc: 'Add to recruitment pipeline' },
              ].map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  onClick={() => setImportType(value)}
                  className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${importType === value ? 'border-navy bg-navy/5' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <Icon size={20} className={importType === value ? 'text-navy mb-2' : 'text-gray-400 mb-2'} />
                  <p className={`font-semibold text-sm ${importType === value ? 'text-navy' : 'text-gray-700'}`}>{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Input mode tabs */}
          <div className="mb-5">
            <p className="label mb-2">Source</p>
            <div className="flex gap-2 mb-4">
              {[
                { value: 'file', label: 'Upload CSV', icon: Upload },
                { value: 'url', label: 'Google Sheets URL', icon: Link },
                { value: 'paste', label: 'Paste CSV', icon: FileText },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setInputMode(value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${inputMode === value ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            {inputMode === 'file' && (
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-navy rounded-xl p-10 text-center cursor-pointer transition-colors group"
              >
                <Upload size={32} className="text-gray-300 group-hover:text-navy mx-auto mb-3 transition-colors" />
                <p className="font-medium text-gray-700">Drop your CSV file here, or click to browse</p>
                <p className="text-sm text-gray-400 mt-1">Supports .csv files exported from Excel, Google Sheets, or any spreadsheet app</p>
                {csvText && <p className="mt-3 text-sm text-emerald-600 font-medium">✓ File loaded — {csvText.split('\n').length - 1} rows detected</p>}
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </div>
            )}

            {inputMode === 'url' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">Make sure your Google Sheet is set to <strong>"Anyone with the link can view"</strong></p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    className="input-field flex-1"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={sheetsUrl}
                    onChange={e => setSheetsUrl(e.target.value)}
                  />
                  <button onClick={handleFetchSheets} disabled={loading || !sheetsUrl} className="btn-navy whitespace-nowrap">
                    {loading ? <RefreshCw size={14} className="animate-spin" /> : 'Fetch Sheet'}
                  </button>
                </div>
                {csvText && <p className="text-sm text-emerald-600 font-medium">✓ Sheet loaded — {csvText.split('\n').length - 1} rows detected</p>}
              </div>
            )}

            {inputMode === 'paste' && (
              <textarea
                className="input-field h-40 font-mono text-xs"
                placeholder={"First Name,Last Name,Email,Major\nJohn,Smith,john@example.com,Finance\n..."}
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
              />
            )}
          </div>

          <button onClick={handlePreview} disabled={loading || !csvText} className="btn-primary w-full justify-center py-3">
            {loading ? <><RefreshCw size={14} className="animate-spin" /> Processing…</> : <>Continue <ChevronRight size={14} /></>}
          </button>
        </div>
      )}

      {/* Step 1: Column Mapping */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title">Map your columns</h2>
                <p className="text-sm text-gray-500 mt-0.5">{totalRows} rows detected — tell us what each column means</p>
              </div>
              <button onClick={() => { setStep(0); setError(''); }} className="btn-secondary text-sm">← Back</button>
            </div>

            <div className="space-y-3">
              {headers.map(col => (
                <div key={col} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-48 flex-shrink-0">
                    <p className="text-sm font-medium text-gray-700">{col}</p>
                    <p className="text-xs text-gray-400 truncate">{preview[0]?.[col] || '—'}</p>
                  </div>
                  <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />
                  <select
                    className="select-field flex-1"
                    value={mapping[col] || ''}
                    onChange={e => setMapping(m => ({ ...m, [col]: e.target.value }))}
                  >
                    {KNOWN_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview table */}
          <div className="card p-6">
            <h3 className="section-title mb-4">Preview (first {preview.length} rows)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>{headers.map(h => <th key={h} className="th">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="table-row">
                      {headers.map(h => <td key={h} className="td">{row[h] || '—'}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button onClick={handleImport} disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading ? <><RefreshCw size={14} className="animate-spin" /> Importing…</> : <>Import {totalRows} {importType === 'members' ? 'Members' : 'PNMs'}</>}
          </button>
        </div>
      )}

      {/* Step 2: Result */}
      {step === 2 && result && (
        <div className="card p-10 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Check size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Complete!</h2>
          <p className="text-gray-500 mb-6">
            <span className="font-semibold text-emerald-600">{result.created} records imported</span>
            {result.skipped > 0 && <span className="text-gray-400"> · {result.skipped} skipped (duplicates or missing name)</span>}
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate(importType === 'members' ? '/members' : '/recruitment')} className="btn-primary">
              View {importType === 'members' ? 'Members' : 'Recruitment'} →
            </button>
            <button onClick={() => { setStep(0); setCsvText(''); setResult(null); setError(''); }} className="btn-secondary">
              Import More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
