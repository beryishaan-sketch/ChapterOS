import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-install-dismissed', '1');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-slide-up">
      <div className="card p-4 shadow-lg border border-navy/20">
        <button onClick={dismiss} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
        <div className="flex items-start gap-3 pr-4">
          <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center flex-shrink-0">
            <Download size={18} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Install ChapterHQ</p>
            <p className="text-xs text-gray-500 mt-0.5">Add to your home screen for quick access — works offline too.</p>
            <button onClick={install} className="btn-primary text-xs px-3 py-1.5 mt-2">
              Install App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
