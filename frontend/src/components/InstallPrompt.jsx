import React, { useState, useEffect } from 'react';
import { Download, X, Zap } from 'lucide-react';

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed or dismissed this session
    const isDismissed = sessionStorage.getItem('pwa-dismissed');
    if (isDismissed) return;

    // Don't show if running as standalone (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (window.navigator.standalone === true) return; // iOS standalone

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      // Show after 30s or on second visit
      const visits = parseInt(localStorage.getItem('pwa-visits') || '0') + 1;
      localStorage.setItem('pwa-visits', visits);
      if (visits >= 2) {
        setTimeout(() => setShow(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
      setPrompt(null);
    }
  };

  const dismiss = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem('pwa-dismissed', '1');
  };

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up md:left-auto md:right-6 md:w-80">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-start gap-3">
        <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center flex-shrink-0">
          <Zap size={18} className="text-gold" strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900">Add ChapterHQ to home screen</p>
          <p className="text-xs text-gray-400 mt-0.5 mb-3">Install the app for faster access — works offline too.</p>
          <div className="flex gap-2">
            <button onClick={install}
              className="flex items-center gap-1.5 bg-navy text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
              <Download size={12} /> Install
            </button>
            <button onClick={dismiss} className="text-xs text-gray-400 px-2 py-1.5">Not now</button>
          </div>
        </div>
        <button onClick={dismiss} className="text-gray-300 hover:text-gray-500 flex-shrink-0 mt-0.5">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
