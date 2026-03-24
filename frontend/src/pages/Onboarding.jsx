import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Check, Users, Palette, Mail, Plus, X,
  Upload, BookOpen, Calendar, Building2, Copy
} from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  { label: 'Chapter Details', icon: BookOpen, description: 'Tell us about your chapter' },
  { label: 'Customize', icon: Palette, description: 'Make it yours' },
  { label: 'Invite Members', icon: Users, description: 'Get your team started' },
];

const ACCENT_COLORS = [
  { name: 'Gold', value: '#C9A84C' },
  { name: 'Navy', value: '#0F1C3F' },
  { name: 'Crimson', value: '#DC2626' },
  { name: 'Forest', value: '#16A34A' },
  { name: 'Purple', value: '#7C3AED' },
  { name: 'Sky', value: '#0EA5E9' },
  { name: 'Orange', value: '#EA580C' },
  { name: 'Rose', value: '#E11D48' },
];

const ProgressBar = ({ currentStep }) => (
  <div className="mb-8">
    <div className="flex items-center justify-between mb-4">
      {STEPS.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        const Icon = step.icon;
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                ${done ? 'bg-gold text-navy-dark shadow-md' : active ? 'bg-navy text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                {done ? <Check size={16} /> : <Icon size={16} />}
              </div>
              <span className={`text-xs font-medium hidden sm:block transition-colors
                ${active ? 'text-gray-900' : done ? 'text-gold-dark' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 mx-2 h-0.5 rounded-full overflow-hidden bg-gray-200 mb-5">
                <div
                  className="h-full bg-gold transition-all duration-500 rounded-full"
                  style={{ width: done ? '100%' : '0%' }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
    <p className="text-sm text-gray-500 text-center">{STEPS[currentStep].description}</p>
  </div>
);

export default function Onboarding() {
  const { org, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [orgType, setOrgType] = useState('fraternity');
  const [greekLetters, setGreekLetters] = useState('');
  const [foundingYear, setFoundingYear] = useState('');
  const [chapterDesignation, setChapterDesignation] = useState('');

  // Step 2
  const [accentColor, setAccentColor] = useState('#C9A84C');
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  // Step 3
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const addEmailField = () => {
    if (inviteEmail && /\S+@\S+\.\S+/.test(inviteEmail)) {
      setEmails(prev => [...prev.filter(Boolean), inviteEmail, '']);
      setInviteEmail('');
    }
  };

  const removeEmail = (idx) => {
    setEmails(prev => prev.filter((_, i) => i !== idx));
  };

  const saveStep1 = async () => {
    if (!greekLetters.trim()) {
      setError('Please enter your greek letters.');
      return false;
    }
    try {
      await client.patch('/orgs/current', {
        type: orgType,
        greekLetters,
        foundingYear: foundingYear ? parseInt(foundingYear) : undefined,
        chapterDesignation,
      });
      return true;
    } catch {
      setError('Failed to save chapter details.');
      return false;
    }
  };

  const saveStep2 = async () => {
    try {
      const formData = new FormData();
      formData.append('accentColor', accentColor);
      if (logoFile) formData.append('logo', logoFile);
      await client.patch('/orgs/current', formData);
      return true;
    } catch {
      setError('Failed to save customization.');
      return false;
    }
  };

  const handleNext = async () => {
    setError('');
    setLoading(true);

    let ok = true;
    if (step === 0) ok = await saveStep1();
    if (step === 1) ok = await saveStep2();

    setLoading(false);
    if (ok) setStep(s => s + 1);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const validEmails = emails.filter(e => e && /\S+@\S+\.\S+/.test(e));
      if (validEmails.length > 0) {
        await client.post('/members/invite', { emails: validEmails });
      }
      await refreshUser();
      navigate('/dashboard');
    } catch {
      // Still navigate even if invites fail
      await refreshUser();
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    await refreshUser();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen gradient-navy flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-96 bg-gold/6 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="w-9 h-9 bg-gold rounded-xl flex items-center justify-center">
              <span className="text-navy-dark font-black">Χ</span>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">ChapterHQ</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-modal p-8">
          <ProgressBar currentStep={step} />

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-5 text-sm text-red-700">
              <X size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Step 1: Chapter Details */}
          {step === 0 && (
            <div className="animate-slide-up space-y-5">
              <div>
                <label className="label">Organization type</label>
                <div className="grid grid-cols-2 gap-3">
                  {['fraternity', 'sorority'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setOrgType(type)}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold capitalize transition-all
                        ${orgType === type
                          ? 'border-navy bg-navy/5 text-navy'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                      {type === 'fraternity' ? '🏛️' : '💐'} {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label" htmlFor="greekLetters">Greek letters</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-gray-400 pointer-events-none font-serif">Χ</span>
                  <input
                    id="greekLetters"
                    type="text"
                    className="input-field pl-10"
                    placeholder="e.g. ΑΒΓ"
                    value={greekLetters}
                    onChange={e => setGreekLetters(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="designation">Chapter designation</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      id="designation"
                      type="text"
                      className="input-field pl-10"
                      placeholder="e.g. Gamma Chapter"
                      value={chapterDesignation}
                      onChange={e => setChapterDesignation(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="foundingYear">Founding year</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      id="foundingYear"
                      type="number"
                      className="input-field pl-10"
                      placeholder="e.g. 1985"
                      min="1800"
                      max={new Date().getFullYear()}
                      value={foundingYear}
                      onChange={e => setFoundingYear(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Customize */}
          {step === 1 && (
            <div className="animate-slide-up space-y-6">
              <div>
                <label className="label">Chapter logo</label>
                <label
                  htmlFor="logoUpload"
                  className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-20 h-20 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                      <Upload size={24} className="text-gray-400" />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">{logoPreview ? 'Change logo' : 'Upload logo'}</p>
                    <p className="text-xs text-gray-400">PNG, JPG up to 2MB</p>
                  </div>
                  <input id="logoUpload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </label>
              </div>

              <div>
                <label className="label">Accent color</label>
                <div className="grid grid-cols-4 gap-2.5">
                  {ACCENT_COLORS.map(({ name, value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAccentColor(value)}
                      title={name}
                      className={`relative h-10 rounded-xl transition-all border-2 ${accentColor === value ? 'border-gray-900 scale-110 shadow-md' : 'border-transparent'}`}
                      style={{ backgroundColor: value }}
                    >
                      {accentColor === value && (
                        <Check size={14} className="absolute inset-0 m-auto text-white drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <label className="text-xs text-gray-500">Custom:</label>
                  <input
                    type="color"
                    value={accentColor}
                    onChange={e => setAccentColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                  />
                  <span className="text-sm text-gray-600 font-mono">{accentColor}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Invite Members */}
          {step === 2 && (
            <div className="animate-slide-up space-y-4">
              <p className="text-sm text-gray-600">
                Share your invite code or link with officers and brothers. They'll create their own account and join your chapter instantly.
              </p>

              {/* Invite Code */}
              <div>
                <label className="label">Your invite code</label>
                <div className="flex items-center gap-3 p-4 bg-navy/5 border-2 border-navy/20 rounded-xl">
                  <span className="flex-1 text-center font-mono text-3xl font-black tracking-[0.3em] text-navy">
                    {org?.inviteCode || '········'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(org?.inviteCode || '');
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="p-2 hover:bg-navy/10 rounded-lg transition-colors"
                  >
                    {copiedCode ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-navy" />}
                  </button>
                </div>
              </div>

              {/* Shareable Link */}
              <div>
                <label className="label">Shareable join link</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="flex-1 text-xs text-gray-600 truncate font-mono">
                    {window.location.origin}/register?code={org?.inviteCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/register?code=${org?.inviteCode}`);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                  >
                    {copiedLink ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-gray-500" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Brothers tap this link → code is pre-filled → they just add their name & password</p>
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700 border border-blue-100">
                <Users size={14} className="flex-shrink-0" />
                <span>Send this link in your chapter group chat. You can find the invite code anytime in Settings.</span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="btn-ghost"
              >
                Back
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              {step === 2 && (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="btn-ghost text-gray-500"
                >
                  Skip for now
                </button>
              )}

              {step < 2 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-navy-dark/30 border-t-navy-dark rounded-full animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    <>Continue <ChevronRight size={16} /></>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={loading}
                  className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-navy-dark/30 border-t-navy-dark rounded-full animate-spin" />
                      Finishing…
                    </span>
                  ) : (
                    <><Check size={16} /> Finish setup</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
