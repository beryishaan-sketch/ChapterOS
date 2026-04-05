import React, { useEffect, useRef } from 'react';

/**
 * iOS-style bottom sheet modal
 */
export default function BottomSheet({ isOpen, onClose, title, children, height = '80vh' }) {
  const backdropRef = useRef(null);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen && !children) return null;

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: isOpen ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
        backdropFilter: isOpen ? 'blur(2px)' : 'none',
        WebkitBackdropFilter: isOpen ? 'blur(2px)' : 'none',
        transition: 'background 0.3s, backdrop-filter 0.3s',
        pointerEvents: isOpen ? 'auto' : 'none',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}
    >
      <div style={{
        background: '#F2F2F7',
        borderRadius: '16px 16px 0 0',
        maxHeight: height,
        transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -4px 40px rgba(0,0,0,0.2)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 36, height: 5, borderRadius: 3, background: 'rgba(60,60,67,0.3)' }} />
        </div>

        {/* Title bar */}
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 16px 12px',
            borderBottom: '0.5px solid rgba(0,0,0,0.12)',
            flexShrink: 0,
          }}>
            <p style={{
              fontSize: 17, fontWeight: 600, color: '#000',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              margin: 0, flex: 1, textAlign: 'center',
            }}>{title}</p>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(120,120,128,0.16)', border: 'none',
                borderRadius: '50%', width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#3C3C43',
                fontSize: 16, fontWeight: 600,
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                WebkitTapHighlightColor: 'transparent',
              }}
            >✕</button>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
