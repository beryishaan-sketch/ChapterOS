import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowLeft } from 'lucide-react';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-bold text-gray-900 mb-3">{title}</h2>
    <div className="text-sm text-gray-600 leading-relaxed space-y-3">{children}</div>
  </div>
);

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-navy rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-gold" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-gray-900">ChapterHQ</span>
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-500 text-sm">Privacy Policy</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8">
          <ArrowLeft size={14} /> Back to home
        </Link>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: March 2026</p>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <Section title="Overview">
            <p>ChapterHQ ("we", "us", "our") is committed to protecting the privacy of chapter officers, members, and users of our platform. This Privacy Policy explains what data we collect, how we use it, and your rights.</p>
            <p><strong>Short version:</strong> We collect only what's needed to run the platform. We don't sell your data. Member data belongs to your chapter.</p>
          </Section>

          <Section title="1. Information We Collect">
            <p><strong>Account information:</strong> Name, email address, password (hashed), organization name, school, and position within the chapter.</p>
            <p><strong>Member data:</strong> Information chapter administrators input about members — including names, emails, GPA, pledge class, major, phone number, dues status, and attendance records.</p>
            <p><strong>Usage data:</strong> How you interact with the platform, pages visited, features used, and error logs. This helps us improve the Service.</p>
            <p><strong>Payment information:</strong> Billing is processed by Stripe. We never store credit card numbers. We receive confirmation of payment status only.</p>
            <p><strong>Communications:</strong> Messages sent in chapter channels, announcements, and polls created within the platform.</p>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>To provide and operate the Service</li>
              <li>To authenticate users and maintain account security</li>
              <li>To send dues reminders and notifications on behalf of chapter admins</li>
              <li>To provide customer support</li>
              <li>To improve the platform based on usage patterns</li>
              <li>To send product updates and important service announcements</li>
            </ul>
            <p>We do not use member data for advertising, marketing, or any purpose beyond operating the Service for your chapter.</p>
          </Section>

          <Section title="3. Data Sharing">
            <p>We do not sell, rent, or trade your personal information to third parties.</p>
            <p>We share data only with:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Stripe</strong> — for payment processing</li>
              <li><strong>Email providers</strong> — to send dues reminders and notifications</li>
              <li><strong>Hosting providers</strong> — for infrastructure (Railway, managed databases)</li>
              <li><strong>Law enforcement</strong> — only when required by law</li>
            </ul>
            <p>All third-party providers are contractually required to protect your data.</p>
          </Section>

          <Section title="4. Data Isolation">
            <p>Each chapter's data is fully isolated. Members of one chapter cannot access data from another chapter under any circumstances. Chapter administrators can only access data for their own chapter.</p>
          </Section>

          <Section title="5. Data Retention">
            <p>We retain your data for as long as your account is active. If you cancel your subscription, we retain your data for 90 days to allow for reactivation, then delete it.</p>
            <p>You can request immediate deletion of your chapter's data by contacting us at admin@chapterhq.org.</p>
          </Section>

          <Section title="6. Security">
            <p>We implement industry-standard security measures including:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>All passwords hashed with bcrypt</li>
              <li>HTTPS encryption for all data in transit</li>
              <li>JWT-based authentication with expiry</li>
              <li>Rate limiting and account lockout protection</li>
              <li>Regular security updates</li>
            </ul>
            <p>No system is 100% secure. We encourage you to use a strong, unique password and to report any security concerns to admin@chapterhq.org.</p>
          </Section>

          <Section title="7. Your Rights">
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Access</strong> the personal data we hold about you</li>
              <li><strong>Correct</strong> inaccurate data</li>
              <li><strong>Delete</strong> your account and associated data</li>
              <li><strong>Export</strong> your chapter's data in CSV or PDF format</li>
            </ul>
            <p>To exercise these rights, contact us at admin@chapterhq.org or use the export tools in your account settings.</p>
          </Section>

          <Section title="8. Minors">
            <p>ChapterHQ is intended for use by college students (18+). We do not knowingly collect data from minors under 18. If you believe a minor has created an account, contact us immediately.</p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>We may update this Privacy Policy periodically. We will notify active subscribers of material changes. Continued use of the Service after changes constitutes acceptance of the updated policy.</p>
          </Section>

          <Section title="10. Contact">
            <p>Questions or concerns about privacy? Contact us at <a href="mailto:admin@chapterhq.org" className="text-navy hover:underline">admin@chapterhq.org</a>.</p>
          </Section>
        </div>
      </div>
    </div>
  );
}
