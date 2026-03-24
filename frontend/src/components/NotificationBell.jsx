import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Calendar, DollarSign, Users, Megaphone, X } from 'lucide-react';
import client from '../api/client';

const TYPE_ICONS = {
  dues: DollarSign,
  event: Calendar,
  member: Users,
  announcement: Megaphone,
  default: Bell,
};

export default function NotificationBell() {
  const [data, setData] = useState({ notifications: [], unread: 0 });
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const load = () => client.get('/notifications').then(r => setData(r.data.data)).catch(() => {});

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await client.put('/notifications/read-all');
    load();
  };

  const markRead = async (id) => {
    await client.put(`/notifications/${id}/read`);
    load();
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
        <Bell size={18} />
        {data.unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
            {data.unread > 9 ? '9+' : data.unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-modal border border-gray-100 z-50 animate-scale-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {data.unread > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-navy hover:underline">
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded"><X size={14} /></button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {data.notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">You're all caught up!</p>
              </div>
            ) : (
              data.notifications.map(n => {
                const Icon = TYPE_ICONS[n.type] || TYPE_ICONS.default;
                return (
                  <button key={n.id} onClick={() => markRead(n.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0 ${!n.read ? 'bg-blue-50/40' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.read ? 'bg-navy/10' : 'bg-gray-100'}`}>
                      <Icon size={14} className={!n.read ? 'text-navy' : 'text-gray-400'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-tight ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-xs text-gray-300 mt-1">{new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 bg-navy rounded-full mt-1.5 flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
