import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, QrCode, Zap, AlertCircle } from 'lucide-react';
import client from '../api/client';

export default function CheckIn() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event');
  const memberId = searchParams.get('member');

  const [status, setStatus] = useState('loading'); // loading | success | already | error | invalid
  const [event, setEvent] = useState(null);
  const [member, setMember] = useState(null);

  useEffect(() => {
    if (!eventId) { setStatus('invalid'); return; }

    const doCheckIn = async () => {
      try {
        const res = await client.post('/attendance/checkin', { eventId, memberId });
        if (res.data.success) {
          setEvent(res.data.data?.event);
          setMember(res.data.data?.member);
          setStatus('success');
        }
      } catch (e) {
        if (e.response?.data?.error?.includes('already')) setStatus('already');
        else setStatus('error');
      }
    };
    doCheckIn();
  }, [eventId, memberId]);

  return (
    <div className="min-h-screen gradient-navy flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-gold rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-navy-dark" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold text-white">ChapterOS</span>
        </div>

        {status === 'loading' && (
          <div className="card p-10">
            <div className="w-12 h-12 border-3 border-navy/20 border-t-navy rounded-full animate-spin mx-auto mb-4" />
            <p className="font-medium text-gray-600">Checking you in…</p>
          </div>
        )}

        {status === 'success' && (
          <div className="card p-10">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Checked In! ✅</h2>
            {event && <p className="text-gray-500 mb-1">{event.title}</p>}
            {member && <p className="text-sm text-gray-400">Welcome, {member.firstName}!</p>}
          </div>
        )}

        {status === 'already' && (
          <div className="card p-10">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={32} className="text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Already Checked In</h2>
            <p className="text-gray-500 text-sm">You're already marked as attending this event.</p>
          </div>
        )}

        {(status === 'error' || status === 'invalid') && (
          <div className="card p-10">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Check-in Failed</h2>
            <p className="text-gray-500 text-sm">This QR code may be invalid or expired. Ask an officer for help.</p>
          </div>
        )}
      </div>
    </div>
  );
}
