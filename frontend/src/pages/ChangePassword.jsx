import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Eye, EyeOff, Check } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match"); return; }
    setLoading(true); setError('');
    try {
      const res = await client.post('/auth/change-password', { password });
      if (!res.data.success) throw new Error(res.data.error);
      navigate('/dashboard');
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to update password');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen gradient-navy flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <ShieldAlert size={20} className="text-amber-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Set Your Password</h2>
              <p className="text-xs text-gray-400">Hey {user?.firstName} — create your own password to continue</p>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3 mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} className="input-field w-full pr-10"
                  placeholder="Min 8 characters" value={password}
                  onChange={e => setPassword(e.target.value)} required minLength={8} />
                <button type="button" onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input type={show ? 'text' : 'password'} className="input-field w-full"
                placeholder="Repeat password" value={confirm}
                onChange={e => setConfirm(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading || password.length < 8 || password !== confirm}
              className="btn-primary w-full justify-center py-3">
              {loading ? 'Saving…' : 'Set Password & Continue →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
