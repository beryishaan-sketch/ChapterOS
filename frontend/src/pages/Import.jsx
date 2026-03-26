import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Link, FileText, ChevronRight, Check, AlertCircle,
  Users, Star, Calendar, ArrowRight, RefreshCw, X, Info
} from 'lucide-react';
import client from '../api/client';

const IMPORT_TYPES = [
  { value: 'members', label: 'Brothers / Members', icon: Users, color: 'blue',
    desc: 'Your chapter roster — names, emails, GPA, major, pledge class', endpoint: '/import/members',
    nav: '/members', navLabel: 'View Members' },
  { value: 'pnms', label: 'PNMs / Rushees', icon: Star, color: 'amber',
    desc: 'Recruitment pipeline — prospects you\'re rushing', endpoint: '/import/pnms',
    nav: '/recruitment', navLabel: 'View Recruitment' },
  { value: 'events', label: 'Events', icon: Calendar, color: 'purple',
    desc: 'Past or upcoming events — name, date, location, type', endpoint: '/import/events',
    nav: '/events', navLabel: 'View Events' },
];

const FIELDS_BY_TYPE = {
  members: [
    { value: '',              label: '— Skip this column —' },
    { value: 'fullName',      label: 'Full Name (First + Last)' },
    { value: 'firstName',     label: 'First Name' },
    { value: 'lastName',      label: 'Last Name' },
    { value: 'email',         label: 'Email Address' },
    { value: 'phone',         label: 'Phone Number' },
    { value: 'major',         label: 'Major / Program' },
    { value: 'year',          label: 'Year / Class Standing' },
    { value: 'pledgeClass',   label: 'Pledge Class / Initiation Semester' },
    { value: 'gpa',           label: 'GPA' },
    { value: 'position',      label: 'Officer Position / Role' },
    { value: 'hometown',      label: 'Hometown' },
    { value: 'notes',         label: 'Notes' },
  ],
  pnms: [
    { value: '',                    label: '— Skip this column —' },
    { value: 'fullName',            label: 'Full Name (First + Last)' },
    { value: 'firstName',           label: 'First Name' },
    { value: 'lastName',            label: 'Last Name' },
    { value: 'email',               label: 'Email Address' },
    { value: 'phone',               label: 'Phone Number' },
    { value: 'major',               label: 'Major / Program' },
    { value: 'year',                label: 'Year / Class Standing' },
    { value: 'mutualConnections',   label: 'Mutual Connections / Referred By' },
    { value: 'notes',               label: 'Notes / Comments' },
  ],
  events: [
    { value: '',              label: '— Skip this column —' },
    { value: 'eventTitle',   label: 'Event Name / Title' },
    { value: 'eventDate',    label: 'Date' },
    { value: 'eventLocation',label: 'Location / Venue' },
    { value: 'eventType',    label: 'Type (social, philanthropy, etc.)' },
  ],
};

const STEPS = ['Choose & Upload', 'Map Columns', 'Done'];

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-500',   icon: 'text-blue-500',   badge: 'bg-blue-100 text-blue-700' },
  amber:  { bg: 'bg-amber-50',  border: 'border-amber-500',  icon: 'text-amber-500',  badge: 'bg-amber-100 text-amber-700' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-500', icon: 'text-purple-500', badge: 'bg-purple-100 text-purple-700' },
};

export default function Import({ onboardingMode = false, onDone }) {
  const navigate = useNavigate();
  const fileRef = useRef();
  const dropRef = useRef();

  const [step, setStep] = useState(0);
  const [importType, setImportType] = useState('members');
  const [csvText, setCsvText] = useState('');
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [inputMode, setInputMode] = useState('file');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);

  const [headers, setHeaders] = useState([]);
  const [preview, setPreview] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [mapping, setMapping] = useState({});

  const [result, setResult] = useState(null);

  const selectedType = IMPORT_TYPES.find(t => t.value === importType);
  const colors = COLOR_MAP[selectedType.color];

  const extractSheetId = (url) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const extractGid = (url) => {
    const match = url.match(/gid=(\d+)/);
    return match ? match[1] : null;
  };

  const loadFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target.result);
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      loadFile(file);
    } else {
      setError('Please drop a .csv file');
    }
  }, []);

  const handleFetchSheets = async () => {
    const id = extractSheetId(sheetsUrl);
    if (!id) { setError('Invalid Google Sheets URL — paste the full URL from your browser'); return; }
    setLoading(true); setError('');
    try {
      const gid = extractGid(sheetsUrl);
      let exportUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
      if (gid) exportUrl += `&gid=${gid}`;
      const res = await fetch(exportUrl);
      if (!res.ok) throw new Error('Could not fetch — make sure the sheet is set to "Anyone with the link can view"');
      const text = await res.text();
      if (text.includes('<!DOCTYPE html>')) throw new Error('Sheet is private. Set sharing to "Anyone with the link can view" and try again.');
      setCsvText(text);
      setFileName('Google Sheet');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handlePreview = async () => {
    if (!csvText.trim()) { setError('No data yet — upload a file, paste a Google Sheets link, or paste CSV text'); return; }
    setLoading(true); setError('');
    try {
      const res = await client.post('/import/preview', { csv: csvText });
      if (!res.data.success) throw new Error(res.data.error);
      const { headers: h, preview: p, totalRows: t, suggestedMapping: sm } = res.data.data;
      if (h.length === 0) throw new Error('No columns detected — make sure your CSV has a header row');
      setHeaders(h);
      setPreview(p);
      setTotalRows(t);
      // Build mapping: { columnHeader -> fieldName }
      const m = {};
      h.forEach(col => {
        const matchedField = Object.keys(sm).find(k => sm[k] === col);
        m[col] = matchedField || '';
      });
      setMapping(m);
      setStep(1);
    } catch (e) { setError(e.response?.data?.error || e.message || 'Failed to parse'); }
    finally { setLoading(false); }
  };

  const handleImport = async () => {
    setLoading(true); setError('');
    try {
      // Convert { colName: fieldName } → { fieldName: colName }
      const fieldMapping = {};
      Object.entries(mapping).forEach(([col, field]) => { if (field) fieldMapping[field] = col; });

      const res = await client.post(selectedType.endpoint, { csv: csvText, mapping: fieldMapping });
      if (!res.data.success) throw new Error(res.data.error);
      setResult(res.data.data);
      setStep(2);
    } catch (e) { setError(e.response?.data?.error || e.message || 'Import failed'); }
    finally { setLoading(false); }
  };

  const reset = () => {
    setStep(0); setCsvText(''); setResult(null); setError(''); setFileName(''); setSheetsUrl('');
  };

  const rowCount = csvText ? csvText.split('\n').filter(l => l.trim()).length - 1 : 0;

  return (
    <div className={onboardingMode ? '' : 'max-w-2xl mx-auto lg:max-w-4xl'}>
      {!onboardingMode && (
        <div className="page-header">
          <h1 className="page-title">Import Data</h1>
          <p className="page-subtitle">Drop your Google Sheet or CSV — we'll map it automatically</p>
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-6">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <React.Fragment key={i}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${done ? 'bg-emerald-500 text-white' : active ? 'bg-navy text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {done ? <Check size={12} /> : i + 1}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${active ? 'text-gray-900' : done ? 'text-emerald-600' : 'text-gray-400'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-3 rounded-full ${done ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
            </React.Fragment>
          );
        })}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl mb-5">
          <AlertCircle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-red-700 font-medium">{error}</p>
            <button onClick={() => setError('')} className="text-xs text-red-400 hover:text-red-600 mt-0.5">Dismiss</button>
          </div>
        </div>
      )}

      {/* ── STEP 0: Upload ────────────────────────────────────────── */}
      {step === 0 && (
        <div className="card p-6 space-y-6">

          {/* What are you importing */}
          <div>
            <p className="label mb-2">What are you importing?</p>
            <div className="grid grid-cols-3 gap-2">
              {IMPORT_TYPES.map(({ value, label, icon: Icon, desc, color }) => {
                const c = COLOR_MAP[color];
                const active = importType === value;
                return (
                  <button key={value} onClick={() => { setImportType(value); setError(''); }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${active ? `${c.bg} ${c.border}` : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                    <Icon size={18} className={`mb-2 ${active ? c.icon : 'text-gray-300'}`} />
                    <p className={`font-semibold text-xs leading-snug ${active ? 'text-gray-900' : 'text-gray-600'}`}>{label}</p>
                    <p className="text-xs text-gray-400 mt-1 leading-snug hidden sm:block">{desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Source tabs */}
          <div>
            <p className="label mb-2">Where's your data?</p>
            <div className="flex gap-2 mb-4 flex-wrap">
              {[
                { value: 'file',  label: '📁 Upload CSV',         icon: Upload },
                { value: 'url',   label: '📊 Google Sheets URL',  icon: Link },
                { value: 'paste', label: '📋 Paste CSV text',     icon: FileText },
              ].map(({ value, label }) => (
                <button key={value} onClick={() => { setInputMode(value); setError(''); setCsvText(''); setFileName(''); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border
                    ${inputMode === value ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* File drop zone */}
            {inputMode === 'file' && (
              <div
                ref={dropRef}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
                  ${dragging ? 'border-navy bg-navy/5 scale-[1.01]' : 'border-gray-300 hover:border-navy hover:bg-gray-50'}`}
              >
                {fileName ? (
                  <div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Check size={24} className="text-emerald-600" />
                    </div>
                    <p className="font-semibold text-gray-900">{fileName}</p>
                    <p className="text-sm text-emerald-600 mt-1">{rowCount} rows ready to import</p>
                    <button onClick={(e) => { e.stopPropagation(); setCsvText(''); setFileName(''); }}
                      className="mt-2 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mx-auto">
                      <X size={11} /> Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload size={32} className={`mx-auto mb-3 transition-colors ${dragging ? 'text-navy' : 'text-gray-300'}`} />
                    <p className="font-semibold text-gray-700">Drop your CSV file here</p>
                    <p className="text-sm text-gray-400 mt-1">or click to browse</p>
                    <p className="text-xs text-gray-400 mt-3">Exported from Google Sheets? File → Download → CSV</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => loadFile(e.target.files[0])} />
              </div>
            )}

            {/* Google Sheets URL */}
            {inputMode === 'url' && (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <Info size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    Your sheet must be set to <strong>"Anyone with the link can view"</strong> in Google Sheets sharing settings.
                    You can also paste a specific tab URL to import just that tab.
                  </p>
                </div>
                <div className="flex gap-2">
                  <input type="url" className="input-field flex-1"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={sheetsUrl}
                    onChange={e => setSheetsUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleFetchSheets()}
                  />
                  <button onClick={handleFetchSheets} disabled={loading || !sheetsUrl} className="btn-navy whitespace-nowrap flex items-center gap-2">
                    {loading ? <RefreshCw size={13} className="animate-spin" /> : null}
                    {loading ? 'Fetching…' : 'Fetch Sheet'}
                  </button>
                </div>
                {fileName === 'Google Sheet' && csvText && (
                  <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                    <Check size={14} /> Sheet loaded — {rowCount} rows ready
                  </p>
                )}
              </div>
            )}

            {/* Paste */}
            {inputMode === 'paste' && (
              <div>
                <textarea
                  className="input-field h-44 font-mono text-xs resize-none"
                  placeholder={"Name,Email,Major,GPA,Pledge Class\nJohn Smith,john@rutgers.edu,Finance,3.4,Fall 2023\n..."}
                  value={csvText}
                  onChange={e => setCsvText(e.target.value)}
                />
                {rowCount > 0 && (
                  <p className="text-xs text-emerald-600 mt-1 font-medium">{rowCount} rows detected</p>
                )}
              </div>
            )}
          </div>

          <button onClick={handlePreview} disabled={loading || !csvText.trim()}
            className="btn-primary w-full justify-center py-3 gap-2">
            {loading
              ? <><RefreshCw size={14} className="animate-spin" /> Analyzing…</>
              : <>Map Columns <ChevronRight size={14} /></>}
          </button>
        </div>
      )}

      {/* ── STEP 1: Column Mapping ────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-900">Map your columns</h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {totalRows} rows detected — we auto-mapped what we could recognize
                </p>
              </div>
              <button onClick={() => { setStep(0); setError(''); }} className="text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1">
                ← Back
              </button>
            </div>

            <div className="space-y-2">
              {headers.map(col => {
                const currentVal = mapping[col] || '';
                const isAutoMapped = !!currentVal;
                return (
                  <div key={col} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors
                    ${isAutoMapped ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="w-40 flex-shrink-0 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{col}</p>
                      <p className="text-xs text-gray-400 truncate">{preview[0]?.[col] || '—'}</p>
                    </div>
                    <ArrowRight size={13} className={`flex-shrink-0 ${isAutoMapped ? 'text-emerald-400' : 'text-gray-300'}`} />
                    <select
                      className={`select-field flex-1 text-sm ${isAutoMapped ? 'border-emerald-300 bg-white' : ''}`}
                      value={currentVal}
                      onChange={e => setMapping(m => ({ ...m, [col]: e.target.value }))}
                    >
                      {(FIELDS_BY_TYPE[importType] || FIELDS_BY_TYPE.members).map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                    {isAutoMapped && (
                      <span className="text-xs text-emerald-600 font-medium whitespace-nowrap hidden sm:block">auto ✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview table */}
          {preview.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Preview (first {preview.length} rows)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {headers.map(h => (
                        <th key={h} className="text-left py-2 px-3 font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {preview.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {headers.map(h => (
                          <td key={h} className="py-2 px-3 text-gray-600 whitespace-nowrap max-w-[140px] truncate">{row[h] || '—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button onClick={handleImport} disabled={loading}
            className="btn-primary w-full justify-center py-3 gap-2">
            {loading
              ? <><RefreshCw size={14} className="animate-spin" /> Importing…</>
              : <>Import {totalRows} {selectedType.label} <ChevronRight size={14} /></>}
          </button>
        </div>
      )}

      {/* ── STEP 2: Done ─────────────────────────────────────────── */}
      {step === 2 && result && (
        <div className="card p-10 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Check size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Done!</h2>
          <div className="flex items-center justify-center gap-4 text-sm mb-6">
            <span className="font-semibold text-emerald-600 text-lg">{result.created} imported</span>
            {result.skipped > 0 && (
              <span className="text-gray-400">{result.skipped} skipped (duplicates or empty name)</span>
            )}
          </div>
          {result.errors?.length > 0 && (
            <div className="text-left bg-red-50 rounded-xl p-4 mb-6 text-xs text-red-600">
              <p className="font-semibold mb-1">Some rows had errors:</p>
              {result.errors.map((e, i) => <p key={i}>• {e}</p>)}
            </div>
          )}
          <div className="flex gap-3 justify-center flex-wrap">
            {onboardingMode ? (
              <button onClick={onDone} className="btn-primary">Continue Setup →</button>
            ) : (
              <button onClick={() => navigate(selectedType.nav)} className="btn-primary">
                {selectedType.navLabel} →
              </button>
            )}
            <button onClick={reset} className="btn-secondary">Import More</button>
          </div>
        </div>
      )}
    </div>
  );
}
