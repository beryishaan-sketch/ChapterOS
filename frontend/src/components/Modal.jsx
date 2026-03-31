import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const SIZES = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-xl', xl: 'sm:max-w-3xl', full: 'sm:max-w-5xl' };

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  const backdropRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={backdropRef} className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center sm:p-4"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}>

      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />

      {/* Sheet */}
      <div className={`relative w-full ${SIZES[size]} bg-white flex flex-col
          rounded-t-[28px] sm:rounded-2xl animate-slide-up sm:animate-scale-in
          max-h-[92dvh] sm:max-h-[88vh]`}
        style={{ boxShadow: '0 -2px 40px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.08)' }}>

        {/* Mobile handle */}
        <div className="sm:hidden pt-3 pb-0 flex justify-center">
          <div className="w-9 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-gray-100">
            <h2 className="text-[17px] font-bold text-gray-900 tracking-tight">{title}</h2>
            <button onClick={onClose}
              className="w-7 h-7 flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-full transition-colors">
              <X size={15} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 pt-3 pb-5 border-t border-gray-100 flex items-center justify-end gap-2.5"
            style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
