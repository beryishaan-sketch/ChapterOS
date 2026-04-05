import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Trash2, Download, Plus, FolderOpen, Link2, File, FileImage, Archive } from 'lucide-react';
import client from '../api/client';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['bylaws', 'risk-management', 'finances', 'contracts', 'recruitment', 'meeting-minutes', 'nationals', 'other'];

const CAT_LABELS = {
  'bylaws': 'Bylaws', 'risk-management': 'Risk Management', 'finances': 'Finances',
  'contracts': 'Contracts', 'recruitment': 'Recruitment', 'meeting-minutes': 'Meeting Minutes',
  'nationals': 'Nationals', 'other': 'Other',
};

const CAT_COLORS = {
  bylaws: 'bg-navy/10 text-navy', 'risk-management': 'bg-red-100 text-red-700',
  finances: 'bg-emerald-100 text-emerald-700', contracts: 'bg-purple-100 text-purple-700',
  recruitment: 'bg-gold/15 text-gold-dark', 'meeting-minutes': 'bg-blue-100 text-blue-700',
  nationals: 'bg-orange-100 text-orange-700', other: 'bg-gray-100 text-gray-600',
};

const getFileIcon = (url) => {
  if (!url) return File;
  if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return FileImage;
  if (url.match(/\.(zip|rar|tar)$/i)) return Archive;
  return FileText;
};

export default function Documents() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [uploadMode, setUploadMode] = useState('file'); // file | url
  const [form, setForm] = useState({ title: '', category: 'bylaws', url: '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const isAdmin = ['admin', 'officer'].includes(user?.role);

  const load = () => {
    setLoading(true);
    client.get('/documents').then(r => setDocs(r.data.data || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('category', form.category);
      if (uploadMode === 'file' && file) {
        formData.append('file', file);
      } else {
        formData.append('url', form.url);
      }
      await client.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowModal(false);
      setForm({ title: '', category: 'bylaws', url: '' });
      setFile(null);
      load();
    } catch (e) { alert('Upload failed') }
    finally { setSaving(false); }
  };

  const deleteDoc = async (id) => {
    if (!confirm('Delete this document?')) return;
    await client.delete(`/documents/${id}`);
    load();
  };

  const filtered = filter === 'all' ? docs : docs.filter(d => d.category === filter);
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = filtered.filter(d => d.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="max-w-2xl mx-auto lg:max-w-5xl">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Document Vault</h1>
            <p className="page-subtitle">Chapter bylaws, contracts, risk docs — all in one place</p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Upload size={16} /> Upload Document
            </button>
          )}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${filter === 'all' ? 'bg-navy text-white border-navy' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
          All ({docs.length})
        </button>
        {CATEGORIES.filter(c => docs.some(d => d.category === c)).map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${filter === cat ? 'bg-navy text-white border-navy' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
            {CAT_LABELS[cat]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-400">Loading…</div>
      ) : docs.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderOpen size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="font-semibold text-gray-500 mb-2">No documents yet</p>
          <p className="text-sm text-gray-400 mb-5">Upload your chapter bylaws, risk docs, and contracts</p>
          {isAdmin && <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">Upload First Document</button>}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{CAT_LABELS[cat]}</h3>
              <div className="grid gap-2">
                {items.map(doc => {
                  const Icon = getFileIcon(doc.url);
                  return (
                    <div key={doc.id} className="card px-5 py-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${CAT_COLORS[doc.category] || 'bg-gray-100'}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{doc.title}</p>
                        <p className="text-xs text-gray-400">{new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a href={doc.url.startsWith('/') ? doc.url : doc.url}
                          target="_blank" rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-navy hover:bg-navy/10 rounded-lg transition-colors">
                          {doc.url.startsWith('/') ? <Download size={15} /> : <Link2 size={15} />}
                        </a>
                        {isAdmin && (
                          <button onClick={() => deleteDoc(doc.id)} className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Upload Document">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Document Title</label>
            <input className="input-field" placeholder="e.g. Chapter Bylaws 2024" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="select-field" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
            </select>
          </div>

          <div className="flex gap-2">
            {['file', 'url'].map(m => (
              <button key={m} type="button" onClick={() => setUploadMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all ${uploadMode === m ? 'border-navy bg-navy/5 text-navy' : 'border-gray-200 text-gray-500'}`}>
                {m === 'file' ? '📁 Upload File' : '🔗 Link URL'}
              </button>
            ))}
          </div>

          {uploadMode === 'file' ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); setFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-navy bg-navy/5' : 'border-gray-200 hover:border-gray-300'}`}>
              <Upload size={24} className="text-gray-300 mx-auto mb-2" />
              {file ? (
                <p className="text-sm font-medium text-navy">{file.name}</p>
              ) : (
                <>
                  <p className="text-sm text-gray-500">Drop file here or click to browse</p>
                  <p className="text-xs text-gray-300 mt-1">PDF, DOCX, XLSX, images — up to 20MB</p>
                </>
              )}
              <input ref={fileRef} type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
            </div>
          ) : (
            <div>
              <label className="label">Document URL</label>
              <input className="input-field" type="url" placeholder="https://drive.google.com/..." value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
              <p className="text-xs text-gray-400 mt-1">Google Drive, Dropbox, or any public link</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving || (uploadMode === 'file' && !file)} className="btn-primary flex-1">
              {saving ? 'Uploading…' : 'Upload Document'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
