import React, { useState, useEffect } from 'react';
import { FileText, Download, Users, DollarSign, CalendarDays, GraduationCap, Shield, TrendingUp, Loader } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const T = {
  bg: '#070B14', card: '#0D1424', elevated: '#131D2E',
  accent: '#4F8EF7', gold: '#F0B429', success: '#34D399', warning: '#FBBF24', danger: '#F87171',
  text1: '#F8FAFC', text2: '#94A3B8', text3: '#475569',
  border: 'rgba(255,255,255,0.07)', borderStrong: 'rgba(255,255,255,0.12)',
};

const REPORT_TYPES = [
  {
    id: 'roster',
    title: 'Chapter Roster',
    description: 'Full member directory with contact info, roles, and standing',
    icon: Users,
    iconBg: 'rgba(79,142,247,0.12)',
    iconColor: T.accent,
  },
  {
    id: 'financial',
    title: 'Financial Summary',
    description: 'Dues collected, budget transactions, and financial overview',
    icon: DollarSign,
    iconBg: 'rgba(52,211,153,0.12)',
    iconColor: T.success,
  },
  {
    id: 'academic',
    title: 'Academic Report',
    description: 'GPA data, academic standings, probation list, and study hours',
    icon: GraduationCap,
    iconBg: 'rgba(240,180,41,0.12)',
    iconColor: T.gold,
  },
  {
    id: 'events',
    title: 'Event & Attendance Report',
    description: 'All chapter events with attendance rates and participation',
    icon: CalendarDays,
    iconBg: 'rgba(167,139,250,0.12)',
    iconColor: '#A78BFA',
  },
  {
    id: 'risk',
    title: 'Risk Management Report',
    description: 'Risk items, completion status, and compliance summary',
    icon: Shield,
    iconBg: 'rgba(248,113,113,0.12)',
    iconColor: T.danger,
  },
  {
    id: 'recruitment',
    title: 'Recruitment Report',
    description: 'PNM pipeline, conversion rates, and recruitment statistics',
    icon: TrendingUp,
    iconBg: 'rgba(251,191,36,0.12)',
    iconColor: T.warning,
  },
];

export default function Reports() {
  const { org } = useAuth();
  const [generating, setGenerating] = useState(null);

  const generate = async (type) => {
    setGenerating(type);
    try {
      const res = await client.get(`/reports/${type}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${org?.name || 'chapter'}-${type}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate report. Please try again.');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: T.bg }}>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: T.text1, margin: 0 }}>Reports</h1>
        <p style={{ color: T.text2, marginTop: 6, fontSize: 14 }}>Generate compliance reports for national HQ and chapter records</p>
      </div>

      {/* Info banner */}
      <div style={{
        background: 'rgba(79,142,247,0.08)',
        border: '1px solid rgba(79,142,247,0.2)',
        borderRadius: 10,
        padding: '14px 18px',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}>
        <div style={{ background: 'rgba(79,142,247,0.15)', borderRadius: 8, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FileText size={16} color={T.accent} />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: T.accent, margin: 0 }}>PDF reports ready to submit</p>
          <p style={{ fontSize: 12, color: T.text2, marginTop: 4, margin: '4px 0 0' }}>All reports include your chapter name, school, and generation date. Format is designed for national HQ submission.</p>
        </div>
      </div>

      {/* Report cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {REPORT_TYPES.map((report) => {
          const Icon = report.icon;
          const isLoading = generating === report.id;
          return (
            <div
              key={report.id}
              style={{
                background: T.card,
                border: '1px solid ' + T.border,
                borderRadius: 12,
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{
                background: report.iconBg,
                borderRadius: 10,
                padding: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 42,
                height: 42,
                marginBottom: 16,
              }}>
                <Icon size={20} color={report.iconColor} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: T.text1, margin: '0 0 6px' }}>{report.title}</h3>
              <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.6, margin: '0 0 20px', flex: 1 }}>{report.description}</p>
              <button
                onClick={() => generate(report.id)}
                disabled={!!generating}
                style={{
                  background: isLoading ? 'rgba(79,142,247,0.7)' : T.accent,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 16px',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: generating ? 'not-allowed' : 'pointer',
                  boxShadow: '0 0 20px rgba(79,142,247,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  opacity: generating && !isLoading ? 0.5 : 1,
                  transition: 'opacity 0.2s',
                  width: '100%',
                }}
              >
                {isLoading ? (
                  <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                ) : (
                  <><Download size={14} /> Download PDF</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Report history */}
      <div style={{
        background: T.card,
        border: '1px solid ' + T.border,
        borderRadius: 12,
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        padding: 24,
        marginTop: 24,
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: T.text1, margin: '0 0 4px' }}>Report History</h2>
        <p style={{ fontSize: 13, color: T.text2, margin: 0 }}>Reports are generated on-demand — no history is stored on our servers.</p>
        <div style={{ borderTop: '1px solid ' + T.border, marginTop: 16, paddingTop: 16 }}>
          <p style={{ fontSize: 12, color: T.text3, textAlign: 'center', padding: '12px 0', margin: 0 }}>Download a report above to get started</p>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
