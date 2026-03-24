import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Zap, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import client from '../api/client';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="min-h-screen gradient-navy flex items-center justify-center p-4">
        <div className="card p-8 w-full max-w-sm text-center">
          <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
          <h2 className="font-bold text-gray-900 mb-2">Invalid link</h2>
          <p className="text-sm text-gray-500 mb-4">This reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="btn-primary w-full flex items-center justify-center">Request a new link</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords don\'t match'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await client.post('/auth/reset-password', { token, password });
      if (res.data.success) setDone(true);
      else setError(res.data.error || 'Failed to reset password');
    } catch {
      setError('Something went wrong. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-navy flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gold rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-navy-dark" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-white">ChapterOS</span>
          </div>
        </div>

        <div className="card p-8">
          {done ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Password reset!</h2>
              <p className="text-sm text-gray-500 mb-6">You can now sign in with your new password.</p>
              <button onClick={() => navigate('/login')} className="btn-primary w-full">Sign in</button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Set new password</h2>
                <p className="text-sm text-gray-500 mt-1">Choose a strong password for your account.</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">New password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={show ? 'text' : 'password'}
                      className="input-field pl-9 pr-10"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoFocus
                    />
                    <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Confirm password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={show ? 'text' : 'password'}
                      className="input-field pl-9"
                      placeholder="Same as above"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Resetting…' : 'Reset password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
