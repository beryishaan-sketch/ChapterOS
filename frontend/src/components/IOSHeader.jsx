import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

/**
 * iOS-style navigation header.
 * - Large title that collapses into the bar on scroll
 * - Optional back button, right action button
 */
export default function IOSHeader({
  title,
  subtitle,
  showBack = false,
  backLabel = 'Back',
  right,
  scrollRef,
  transparentUntilScroll = false,
}) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = scrollRef?.current ?? document.querySelector('main');
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 44);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollRef]);

  const collapsed = scrolled;

  return (
    <>
      {/* Fixed navigation bar */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: collapsed
          ? 'rgba(249,249,249,0.92)'
          : transparentUntilScroll ? 'transparent' : 'rgba(249,249,249,0.92)',
        backdropFilter: collapsed ? 'saturate(180%) blur(20px)' : 'none',
        WebkitBackdropFilter: collapsed ? 'saturate(180%) blur(20px)' : 'none',
        borderBottom: collapsed ? '0.5px solid rgba(0,0,0,0.15)' : 'none',
        transition: 'background 0.2s, border-color 0.2s',
        paddingTop: 'env(safe-area-inset-top)',
      }}>
        <div style={{
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: showBack ? 8 : 16,
          paddingRight: 16,
          position: 'relative',
        }}>
          {/* Left: back button */}
          <div style={{ minWidth: 80, display: 'flex', alignItems: 'center' }}>
            {showBack && (
              <button
                onClick={() => navigate(-1)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 2,
                  color: '#0F1C3F', fontWeight: 400, fontSize: 17,
                  background: 'none', border: 'none', padding: '8px 4px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                  WebkitTapHighlightColor: 'transparent',
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft size={22} strokeWidth={2} />
                <span style={{ marginLeft: -2 }}>{backLabel}</span>
              </button>
            )}
          </div>

          {/* Center: collapsed title */}
          <div style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            opacity: collapsed ? 1 : 0,
            transition: 'opacity 0.15s ease',
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: 17, fontWeight: 600, color: '#000',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              letterSpacing: '-0.02em',
              margin: 0,
            }}>{title}</p>
          </div>

          {/* Right: action button */}
          <div style={{ minWidth: 80, display: 'flex', justifyContent: 'flex-end' }}>
            {right}
          </div>
        </div>
      </div>

      {/* Large title */}
      <div style={{
        paddingLeft: 16, paddingRight: 16,
        paddingTop: 4, paddingBottom: 8,
        opacity: collapsed ? 0 : 1,
        transform: collapsed ? 'translateY(-8px)' : 'translateY(0)',
        transition: 'opacity 0.15s ease, transform 0.15s ease',
        pointerEvents: collapsed ? 'none' : 'auto',
        marginTop: collapsed ? -52 : 0,
      }}>
        <h1 style={{
          fontSize: 34, fontWeight: 700, color: '#000',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          letterSpacing: '-0.03em', lineHeight: 1.1,
          margin: 0,
        }}>{title}</h1>
        {subtitle && (
          <p style={{
            fontSize: 13, color: '#8E8E93', marginTop: 3,
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            margin: '3px 0 0',
          }}>{subtitle}</p>
        )}
      </div>
    </>
  );
}
