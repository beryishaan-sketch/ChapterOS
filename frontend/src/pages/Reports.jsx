import React, { useState, useEffect } from 'react';
import { FileText, Download, Users, DollarSign, CalendarDays, GraduationCap, Shield, TrendingUp, Loader } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const REPORT_TYPES = [
  {
    id: 'roster',
    title: 'Chapter Roster',
    description: 'Full member directory with contact info, roles, and standing',
    icon: Users,
    color: 'bg-blue-50 text-blue-600',
    border: 'border-blue-200',
  },
  {
    id: 'financial',
    title: 'Financial Summary',
    description: 'Dues collected, budget transactions, and financial overview',
    icon: DollarSign,
    color: 'bg-emerald-50 text-emerald-600',
    border: 'border-emerald-200',
  },
  {
    id: 'academic',
    title: 'Academic Report',
    description: 'GPA data, academic standings, probation list, and study hours',
    icon: GraduationCap,
    color: 'bg-gold/10 text-gold-dark',
    border: 'border-gold/30',
  },
  {
    id: 'events',
    title: 'Event & Attendance Report',
    description: 'All chapter events with attendance rates and participation',
    icon: CalendarDays,
    color: 'bg-purple-50 text-purple-600',
    border: 'border-purple-200',
  },
  {
    id: 'risk',
    title: 'Risk Management Report',
    description: 'Risk items, completion status, and compliance summary',
    icon: Shield,
    color: 'bg-red-50 text-red-600',
    border: 'border-red-200',
  },
  {
    id: 'recruitment',
    title: 'Recruitment Report',
    description: 'PNM pipeline, conversion rates, and recruitment statistics',
    icon: TrendingUp,
    color: 'bg-orange-50 text-orange-600',
    border: 'border-orange-200',
  },
];

export default function Reports() {
  const { org } = useAuth();
  const [generating, setGenerating] = useState(null);
  const [preview, setPreview] = useState(null);

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
    <div className="max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Generate compliance reports for national HQ and chapter records</p>
        </div>
      </div>

      <div className="bg-navy/5 border border-navy/10 rounded-2xl p-4 mb-8 flex items-start gap-3">
        <FileText size={18} className="text-navy mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-navy">PDF reports ready to submit</p>
          <p className="text-xs text-gray-500 mt-0.5">All reports include your chapter name, school, and generation date. Format is designed for national HQ submission.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_TYPES.map((report) => {
          const Icon = report.icon;
          const isLoading = generating === report.id;
          return (
            <div key={report.id} className={`card p-6 border ${report.border} hover:shadow-md transition-shadow`}>
              <div className={`w-11 h-11 ${report.color} rounded-xl flex items-center justify-center mb-4`}>
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{report.title}</h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">{report.description}</p>
              <button
                onClick={() => generate(report.id)}
                disabled={!!generating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-navy text-white rounded-xl text-sm font-semibold hover:bg-navy/90 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <><Loader size={14} className="animate-spin" /> Generating…</>
                ) : (
                  <><Download size={14} /> Download PDF</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="card p-6 mt-8">
        <h2 className="section-title mb-1">Report History</h2>
        <p className="text-sm text-gray-400">Reports are generated on-demand — no history is stored on our servers.</p>
        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-300 text-center py-4">Download a report above to get started</p>
        </div>
      </div>
    </div>
  );
}
