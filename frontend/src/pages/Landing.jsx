import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, Users, DollarSign, CalendarDays, Shield, GraduationCap,
  FileText, TrendingUp, CheckCircle2, ArrowRight, Star,
  BarChart2, Bell, MessageSquare, ChevronDown, Menu, X,
  Smartphone, Download, Clock, AlertTriangle
} from 'lucide-react';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Why ChapterOS', href: '#why' },
];

const FEATURES = [
  {
    icon: DollarSign,
    color: 'bg-emerald-500',
    title: 'Dues Tracking & Auto-Reminders',
    desc: 'Create dues records, see who\'s paid at a glance, and auto-email reminders to everyone who hasn\'t. Stop chasing brothers in GroupMe.',
  },
  {
    icon: Users,
    color: 'bg-blue-500',
    title: 'Member Directory',
    desc: 'Full member roster with GPA tracking, study hours, academic standing, roles, and contact info — all in one place.',
  },
  {
    icon: CalendarDays,
    color: 'bg-purple-500',
    title: 'Events & Attendance',
    desc: 'Create events, track attendance via QR code check-in, manage guest lists, and export iCal invites. No more paper sign-in sheets.',
  },
  {
    icon: TrendingUp,
    color: 'bg-orange-500',
    title: 'Recruitment Pipeline',
    desc: 'Kanban board for PNMs, vote on bids anonymously, track rush event attendance, and convert more during recruitment week.',
  },
  {
    icon: GraduationCap,
    color: 'bg-gold',
    title: 'Academic Tracking',
    desc: 'Monitor chapter GPA, flag brothers on academic probation, log study hours, and generate academic reports for nationals.',
  },
  {
    icon: FileText,
    color: 'bg-navy',
    title: 'National HQ Reports',
    desc: '6 one-click PDF reports formatted for national HQ submission. Roster, financial, academic, events, risk, recruitment — done in seconds.',
  },
  {
    icon: Shield,
    color: 'bg-red-500',
    title: 'Risk Management',
    desc: 'Track required trainings (Title IX, AlcoholEdu, anti-hazing), monitor completion rates, and prove compliance to nationals.',
  },
  {
    icon: BarChart2,
    color: 'bg-teal-500',
    title: 'Analytics & Insights',
    desc: 'Chapter health score, dues collection rate, event attendance trends, and leaderboards — see your chapter\'s pulse at a glance.',
  },
];

const PAIN_POINTS = [
  { before: 'Chasing brothers in GroupMe for dues every semester', after: 'Auto-reminders go out. Treasurer just marks who paid.' },
  { before: 'Excel spreadsheet with 60 members, always out of date', after: 'Live member directory with GPA, standing, and contact info.' },
  { before: 'Paper sign-in sheets at every event', after: 'QR code check-in. Attendance tracked automatically.' },
  { before: '3 hours building HQ reports from scratch', after: 'One click. PDF ready. National-compliant.' },
  { before: 'Rush notes scattered across 10 different notepads', after: 'Kanban pipeline. Anonymous bid voting. One source of truth.' },
  { before: 'Finding out a brother is on academic probation too late', after: 'GPA alerts. Probation flags. Academic report at your fingertips.' },
];

const PLANS = [
  {
    name: 'Basic',
    price: 49,
    period: 'month',
    desc: 'For small chapters getting started',
    features: [
      'Up to 40 members',
      'Dues tracking',
      'Events & attendance',
      'Member directory',
      'Basic analytics',
    ],
    cta: 'Start free trial',
    highlighted: false,
  },
  {
    name: 'Standard',
    price: 89,
    period: 'month',
    desc: 'Most popular — covers 90% of chapters',
    features: [
      'Up to 100 members',
      'Everything in Basic',
      'Recruitment pipeline & bid voting',
      'Academic tracking',
      'Risk management',
      'HQ compliance reports',
      'Auto dues reminders',
      'Document storage',
    ],
    cta: 'Start free trial',
    highlighted: true,
  },
  {
    name: 'Pro',
    price: 150,
    period: 'month',
    desc: 'For large chapters or councils',
    features: [
      'Unlimited members',
      'Everything in Standard',
      'Multi-chapter dashboard',
      'Priority support',
      'Custom onboarding',
      'Data export (CSV, PDF)',
      'Budget & treasury tools',
      'Sponsorship tracking',
    ],
    cta: 'Contact us',
    highlighted: false,
  },
];

const SOCIAL_PROOF = [
  {
    quote: "We recovered $3,200 in unpaid dues in the first month. The auto-reminders actually work.",
    name: "Chapter Treasurer",
    org: "Large Midwest University",
    role: "Sigma fraternity",
  },
  {
    quote: "Our HQ report used to take 4 hours. Now it's one button. Our risk manager almost cried.",
    name: "Chapter President",
    org: "Southeast Conference School",
    role: "Phi fraternity",
  },
  {
    quote: "Rush got so much more organized. We went from sticky notes to a real pipeline. Bid day was smooth.",
    name: "Recruitment Chair",
    org: "ACC University",
    role: "Beta fraternity",
  },
];

export default function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-gold" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold text-gray-900">ChapterOS</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors">{l.label}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">Sign in</Link>
            <Link to="/register" className="btn-primary text-sm px-4 py-2">Start free trial <ArrowRight size={14} /></Link>
          </div>
          <button className="md:hidden p-2" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-700 py-2">{l.label}</a>
            ))}
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
              <Link to="/login" className="btn-secondary text-sm text-center">Sign in</Link>
              <Link to="/register" className="btn-primary text-sm text-center">Start free trial</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 gradient-navy relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-1/4 w-64 h-64 bg-gold rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-48 h-48 bg-blue-400 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-gold/15 border border-gold/30 rounded-full px-4 py-1.5 mb-6">
            <Star size={13} className="text-gold" fill="currentColor" />
            <span className="text-gold text-xs font-semibold tracking-wide">30-DAY FREE TRIAL · NO CREDIT CARD</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
            Your chapter runs on<br />
            <span className="text-gold">6 different apps.</span><br />
            Kill them all.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            ChapterOS replaces GroupMe lists, Excel spreadsheets, Venmo chasing, Google Docs, and whatever your treasurer uses — with one platform built for Greek life.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold/90 text-navy-dark font-bold px-8 py-4 rounded-xl text-base transition-all hover:-translate-y-0.5 shadow-lg">
              Start your free trial <ArrowRight size={18} />
            </Link>
            <a href="#features" className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-8 py-4 rounded-xl text-base transition-all border border-white/20">
              See how it works
            </a>
          </div>
          <p className="mt-4 text-white/40 text-sm">$2.50 per brother, per month. Less than a Red Bull.</p>
        </div>

        {/* Fake stat bar */}
        <div className="max-w-3xl mx-auto mt-16 grid grid-cols-3 gap-4">
          {[
            { value: '9,000+', label: 'Chapters in the US' },
            { value: '$2.50', label: 'Per brother / month' },
            { value: '30 days', label: 'Free trial, no card' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-2xl sm:text-3xl font-extrabold text-gold">{value}</p>
              <p className="text-white/50 text-xs sm:text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pain points — before/after */}
      <section id="why" className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Sound familiar?
            </h2>
            <p className="text-gray-500 mt-3 text-lg">Every chapter deals with the same problems. ChapterOS fixes them.</p>
          </div>
          <div className="space-y-4">
            {PAIN_POINTS.map(({ before, after }, i) => (
              <div key={i} className="grid sm:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-gray-200">
                <div className="flex items-start gap-3 p-5 bg-white">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X size={12} className="text-red-500" />
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{before}</p>
                </div>
                <div className="flex items-start gap-3 p-5 bg-navy/5 border-t sm:border-t-0 sm:border-l border-gray-200">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                  </div>
                  <p className="text-sm text-gray-700 font-medium leading-relaxed">{after}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Everything your chapter needs
            </h2>
            <p className="text-gray-500 mt-3 text-lg max-w-xl mx-auto">Built specifically for fraternities and sororities — not generic software crammed into the wrong use case.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="card p-6 hover:shadow-md transition-shadow group">
                <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-2">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI callout */}
      <section className="py-16 px-4 sm:px-6 gradient-navy">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: DollarSign, value: '$3,000+', label: 'Average dues recovered per semester from auto-reminders' },
              { icon: Clock, value: '8 hrs/mo', label: 'Saved by the treasurer on manual tracking and reporting' },
              { icon: AlertTriangle, value: '0', label: 'Compliance issues when nationals show up for a review' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={value} className="text-center">
                <div className="w-12 h-12 bg-gold/15 border border-gold/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon size={22} className="text-gold" />
                </div>
                <p className="text-3xl font-extrabold text-white">{value}</p>
                <p className="text-white/50 text-sm mt-2 leading-relaxed">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center mb-12">
            What chapter officers are saying
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {SOCIAL_PROOF.map(({ quote, name, org, role }, i) => (
              <div key={i} className="card p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} size={14} className="text-gold" fill="currentColor" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">"{quote}"</p>
                <div>
                  <p className="text-xs font-bold text-gray-900">{name}</p>
                  <p className="text-xs text-gray-400">{role} · {org}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Simple pricing</h2>
            <p className="text-gray-500 mt-3 text-lg">Split across 60 brothers, every plan costs less than a cup of coffee per person.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 items-stretch">
            {PLANS.map(({ name, price, period, desc, features, cta, highlighted }) => (
              <div key={name} className={`card p-7 flex flex-col ${highlighted ? 'border-2 border-navy ring-4 ring-navy/10 relative' : ''}`}>
                {highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-navy text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>
                  </div>
                )}
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-gray-900">{name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">${price}</span>
                  <span className="text-gray-400 text-sm">/{period}</span>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">≈ ${(price / 60).toFixed(2)}/brother/mo</p>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register"
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${highlighted ? 'btn-primary' : 'btn-secondary'}`}>
                  {cta} <ArrowRight size={14} />
                </Link>
                {name !== 'Pro' && <p className="text-center text-xs text-gray-400 mt-3">30-day free trial, no credit card required</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile CTA */}
      <section className="py-16 px-4 sm:px-6 bg-navy/5 border-y border-navy/10">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-6">
          <div className="w-14 h-14 bg-navy rounded-2xl flex items-center justify-center flex-shrink-0">
            <Smartphone size={26} className="text-gold" />
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-bold text-gray-900">Installable on any phone</h3>
            <p className="text-gray-500 text-sm mt-1">ChapterOS works as a Progressive Web App — add it to your home screen on iOS or Android. No app store required.</p>
          </div>
          <Link to="/register" className="btn-primary whitespace-nowrap flex-shrink-0 flex items-center gap-2">
            <Download size={16} /> Get started
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 gradient-navy text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-gold/15 border border-gold/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap size={28} className="text-gold" strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to actually run your chapter?
          </h2>
          <p className="text-white/60 mt-4 text-lg">
            Set up takes 10 minutes. Your brothers join with an invite link. You'll wonder how you managed without it.
          </p>
          <Link to="/register"
            className="inline-flex items-center gap-2 mt-8 bg-gold hover:bg-gold/90 text-navy-dark font-bold px-10 py-4 rounded-xl text-base transition-all hover:-translate-y-0.5 shadow-lg">
            Start free — no credit card <ArrowRight size={18} />
          </Link>
          <p className="text-white/30 text-sm mt-4">30-day free trial · Cancel anytime · Setup in 10 minutes</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-navy border border-white/10 rounded-lg flex items-center justify-center">
              <Zap size={13} className="text-gold" strokeWidth={2.5} />
            </div>
            <span className="text-white font-bold text-sm">ChapterOS</span>
          </div>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">{l}</a>
            ))}
          </div>
          <p className="text-gray-600 text-xs">© 2025 ChapterOS. Built for Greek life.</p>
        </div>
      </footer>
    </div>
  );
}
