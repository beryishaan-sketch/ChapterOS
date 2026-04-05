import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { Zap, Eye, EyeOff, ArrowRight, Users, Plus } from 'lucide-react';

export default function Register() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [createForm, setCreateForm] = useState({ orgName: '', orgType: 'fraternity', school: '', firstName: '', lastName: '', email: '', password: '', position: '' });
  const [joinForm, setJoinForm] = useState({ inviteCode: '', firstName: '', lastName: '', email: '', password: '' });

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await client.post('/auth/register', createForm);
      if (!res.data.success) throw new Error(res.data.error);
      localStorage.setItem('token', res.data.data.token);
      await refreshUser();
      navigate('/onboarding');
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await client.post('/auth/join', {
        ...joinForm,
        inviteCode: joinForm.inviteCode.toUpperCase(),
      });
      if (!res.data.success) throw new Error(res.data.error);
      localStorage.setItem('token', res.data.data.token);
      await refreshUser();
      navigate('/dashboard');
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to join chapter');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen gradient-navy flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-navy-dark" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold text-white">ChapterOS</span>
          </Link>
        </div>

        {/* Mode picker */}
        {!mode && (
          <div className="card p-8">
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Get started</h1>
            <p className="text-gray-500 text-center text-sm mb-8">Are you setting up a new chapter or joining an existing one?</p>
            <div className="space-y-3">
              <button onClick={() => setMode('create')}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 hover:border-navy rounded-xl transition-all group">
                <div className="w-10 h-10 bg-navy/10 group-hover:bg-navy rounded-xl flex items-center justify-center transition-colors">
                  <Plus size={20} className="text-navy group-hover:text-white transition-colors" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Create a chapter</p>
                  <p className="text-sm text-gray-500">Set up ChapterOS for your organization</p>
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-navy ml-auto transition-colors" />
              </button>

              <button onClick={() => setMode('join')}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 hover:border-gold rounded-xl transition-all group">
                <div className="w-10 h-10 bg-gold/10 group-hover:bg-gold rounded-xl flex items-center justify-center transition-colors">
                  <Users size={20} className="text-gold-dark group-hover:text-white transition-colors" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Join a chapter</p>
                  <p className="text-sm text-gray-500">Use an invite code from your admin</p>
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-gold ml-auto transition-colors" />
              </button>
            </div>
            <p className="text-center text-sm text-gray-400 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-navy font-medium hover:underline">Sign in</Link>
            </p>
          </div>
        )}

        {/* Create chapter form */}
        {mode === 'create' && (
          <div className="card p-8">
            <button onClick={() => { setMode(null); setError(''); }} className="text-sm text-gray-400 hover:text-gray-600 mb-5 flex items-center gap-1">← Back</button>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your chapter</h1>
            <p className="text-gray-500 text-sm mb-6">You'll be the admin. Invite brothers after setup.</p>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">First Name</label>
                  <input className="input-field" placeholder="Marcus" value={createForm.firstName} onChange={e => setCreateForm(f => ({ ...f, firstName: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input className="input-field" placeholder="Johnson" value={createForm.lastName} onChange={e => setCreateForm(f => ({ ...f, lastName: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input-field" type="email" placeholder="marcus@university.edu" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="relative">
                <label className="label">Password</label>
                <input className="input-field pr-10" type={showPassword ? 'text' : 'password'} placeholder="Min 8 characters" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} required minLength={8} />
                <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <label className="label">Chapter Name</label>
                <input className="input-field" placeholder="Alpha Beta Gamma" value={createForm.orgName} onChange={e => setCreateForm(f => ({ ...f, orgName: e.target.value }))} required />
              </div>
              <div>
                <label className="label">School / University</label>
                <input className="input-field" placeholder="State University" value={createForm.school} onChange={e => setCreateForm(f => ({ ...f, school: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Type</label>
                  <select className="select-field" value={createForm.orgType} onChange={e => setCreateForm(f => ({ ...f, orgType: e.target.value }))}>
                    <option value="fraternity">Fraternity</option>
                    <option value="sorority">Sorority</option>
                    <option value="co-ed">Co-Ed</option>
                    <option value="honor_society">Honor Society</option>
                  </select>
                </div>
                <div>
                  <label className="label">Your Position</label>
                  <input className="input-field" placeholder="President" value={createForm.position} onChange={e => setCreateForm(f => ({ ...f, position: e.target.value }))} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? 'Creating chapter…' : 'Create Chapter'} {!loading && <ArrowRight size={15} />}
              </button>
            </form>
          </div>
        )}

        {/* Join chapter form */}
        {mode === 'join' && (
          <div className="card p-8">
            <button onClick={() => { setMode(null); setError(''); }} className="text-sm text-gray-400 hover:text-gray-600 mb-5 flex items-center gap-1">← Back</button>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Join your chapter</h1>
            <p className="text-gray-500 text-sm mb-6">Get your invite code from your chapter admin or president.</p>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="label">Invite Code</label>
                <input className="input-field text-center tracking-[0.3em] font-mono text-lg uppercase font-bold"
                  placeholder="XXXXXXXX" maxLength={8}
                  value={joinForm.inviteCode}
                  onChange={e => setJoinForm(f => ({ ...f, inviteCode: e.target.value.toUpperCase() }))}
                  required />
                <p className="text-xs text-gray-400 mt-1">8-character code — ask your chapter admin</p>
              </div>
              <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="label">First Name</label>
                  <input className="input-field" placeholder="Tyler" value={joinForm.firstName} onChange={e => setJoinForm(f => ({ ...f, firstName: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input className="input-field" placeholder="Williams" value={joinForm.lastName} onChange={e => setJoinForm(f => ({ ...f, lastName: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input-field" type="email" placeholder="tyler@university.edu" value={joinForm.email} onChange={e => setJoinForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="relative">
                <label className="label">Password</label>
                <input className="input-field pr-10" type={showPassword ? 'text' : 'password'} placeholder="Min 8 characters" value={joinForm.password} onChange={e => setJoinForm(f => ({ ...f, password: e.target.value }))} required minLength={8} />
                <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? 'Joining chapter…' : 'Join Chapter'} {!loading && <ArrowRight size={15} />}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-xs text-white/30 mt-6">
          By signing up you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
