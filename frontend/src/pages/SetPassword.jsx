import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function SetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken: authLogin } = useAuth();
  const token = params.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 'strong' :
    password.length >= 8 ? 'ok' : 'weak';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords don\'t match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try {
      const res = await client.post('/auth/set-password', { token, password });
      if (!res.data.success) throw new Error(res.data.error);
      // Auto-login
      const { token: authToken, member, org } = res.data.data;
      authLogin(authToken, member, org);
      navigate('/dashboard');
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to set password');
    } finally { setLoading(false); }
  };

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-red-500 font-semibold">Invalid link — please ask your president for a new one.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen gradient-navy flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap size={28} className="text-gold" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Set Your Password</h1>
          <p className="text-white/50 text-sm mt-2">Welcome to ChapterHQ — create your password to get started</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-600">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  className="input-field w-full pr-10"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required minLength={8}
                />
                <button type="button" onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {password && (
                <div className="mt-1.5">
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${
                      strength === 'strong' ? 'bg-emerald-500 w-full' :
                      strength === 'ok' ? 'bg-amber-500 w-2/3' : 'bg-red-400 w-1/3'
                    }`} />
                  </div>
                  <p className={`text-xs mt-1 ${strength === 'strong' ? 'text-emerald-600' : strength === 'ok' ? 'text-amber-600' : 'text-red-500'}`}>
                    {strength === 'strong' ? '✓ Strong password' : strength === 'ok' ? 'Add uppercase & numbers for stronger password' : 'Too short'}
                  </p>
                </div>
              )}
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input
                type={show ? 'text' : 'password'}
                className="input-field w-full"
                placeholder="Repeat password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
              {confirm && password !== confirm && (
                <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
              )}
              {confirm && password === confirm && confirm.length >= 8 && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><Check size={11} /> Passwords match</p>
              )}
            </div>
            <button type="submit" disabled={loading || password !== confirm || password.length < 8}
              className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? 'Setting password…' : 'Set Password & Sign In →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
