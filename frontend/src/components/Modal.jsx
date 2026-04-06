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
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center sm:p-4"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-fade-in"
        style={{ background: 'rgba(7,11,20,0.75)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`relative w-full ${SIZES[size]} flex flex-col rounded-t-[20px] sm:rounded-[14px] animate-slide-up sm:animate-scale-in max-h-[92dvh] sm:max-h-[88vh]`}
        style={{
          background: '#131D2E',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden pt-3 pb-0 flex justify-center">
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.12)' }} />
        </div>

        {/* Header */}
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 24px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}>
            <h2 style={{ color: '#F8FAFC', fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', margin: 0 }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#475569', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 150ms ease',
              }}
              className="hover:bg-[rgba(255,255,255,0.1)] hover:text-[#94A3B8]"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain', padding: '20px 24px' }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: '14px 24px',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
