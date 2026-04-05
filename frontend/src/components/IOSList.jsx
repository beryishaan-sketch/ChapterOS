import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * iOS-style grouped inset list section
 */
export function IOSSection({ label, children, footer }) {
  return (
    <div style={{ marginBottom: 32 }}>
      {label && (
        <p style={{
          fontSize: 13, fontWeight: 500, color: '#6C6C70',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          textTransform: 'uppercase', letterSpacing: '0.04em',
          marginLeft: 16, marginBottom: 6,
        }}>{label}</p>
      )}
      <div style={{
        background: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 0 0 0.5px rgba(0,0,0,0.1)',
        marginLeft: 0, marginRight: 0,
      }}>
        {children}
      </div>
      {footer && (
        <p style={{
          fontSize: 13, color: '#6C6C70',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          marginLeft: 16, marginTop: 6,
        }}>{footer}</p>
      )}
    </div>
  );
}

/**
 * Single iOS-style list row
 */
export function IOSRow({
  icon,
  iconBg,
  label,
  value,
  chevron = false,
  onClick,
  destructive = false,
  rightElement,
  subtitle,
  disabled = false,
}) {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 12px 11px 16px',
        cursor: onClick && !disabled ? 'pointer' : 'default',
        opacity: disabled ? 0.4 : 1,
        WebkitTapHighlightColor: 'transparent',
        position: 'relative',
      }}
      className={onClick && !disabled ? 'active:bg-gray-100 transition-colors duration-75' : ''}
    >
      {/* Icon */}
      {icon && (
        <div style={{
          width: 30, height: 30, borderRadius: 7,
          background: iconBg || '#0F1C3F',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: '#fff', display: 'flex', alignItems: 'center' }}>{icon}</span>
        </div>
      )}

      {/* Label + subtitle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 17, color: destructive ? '#FF3B30' : '#000',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          margin: 0, fontWeight: 400,
          letterSpacing: '-0.01em',
        }}>{label}</p>
        {subtitle && (
          <p style={{
            fontSize: 13, color: '#8E8E93', margin: '1px 0 0',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          }}>{subtitle}</p>
        )}
      </div>

      {/* Value */}
      {value !== undefined && (
        <span style={{
          fontSize: 17, color: '#8E8E93',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          flexShrink: 0,
        }}>{value}</span>
      )}

      {/* Right element */}
      {rightElement && <span style={{ flexShrink: 0 }}>{rightElement}</span>}

      {/* Chevron */}
      {chevron && <ChevronRight size={18} color="#C7C7CC" />}

      {/* Separator */}
      <div style={{
        position: 'absolute', bottom: 0, left: icon ? 58 : 16, right: 0,
        height: '0.5px', background: 'rgba(0,0,0,0.1)',
      }} />
    </div>
  );
}

/**
 * iOS-style stat card for dashboard
 */
export function IOSStatCard({ label, value, color = '#0F1C3F', icon, sub, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: 14,
        padding: 16,
        boxShadow: '0 0 0 0.5px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06)',
        cursor: onClick ? 'pointer' : 'default',
        WebkitTapHighlightColor: 'transparent',
      }}
      className={onClick ? 'active:scale-[0.97] transition-transform duration-100' : ''}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: color, opacity: 0.9,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: '#fff', display: 'flex' }}>{icon}</span>
        </div>
      </div>
      <p style={{
        fontSize: 28, fontWeight: 700, color: '#000', margin: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        letterSpacing: '-0.03em',
      }}>{value ?? '—'}</p>
      <p style={{
        fontSize: 13, color: '#8E8E93', margin: '3px 0 0',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      }}>{label}</p>
      {sub && (
        <p style={{
          fontSize: 12, color: '#34C759', margin: '3px 0 0', fontWeight: 500,
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}>{sub}</p>
      )}
    </div>
  );
}
