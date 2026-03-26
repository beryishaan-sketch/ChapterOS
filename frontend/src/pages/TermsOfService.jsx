import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowLeft } from 'lucide-react';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-bold text-gray-900 mb-3">{title}</h2>
    <div className="text-sm text-gray-600 leading-relaxed space-y-3">{children}</div>
  </div>
);

export default function TermsOfService() {
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
          <span className="text-gray-500 text-sm">Terms of Service</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8">
          <ArrowLeft size={14} /> Back to home
        </Link>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: March 2026</p>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <Section title="1. Acceptance of Terms">
            <p>By accessing or using ChapterHQ ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.</p>
            <p>These terms apply to all users including chapter administrators, officers, members, and anyone else who accesses or uses ChapterHQ.</p>
          </Section>

          <Section title="2. Description of Service">
            <p>ChapterHQ is a chapter management platform for fraternities, sororities, and similar organizations. The Service includes member management, dues tracking, event management, recruitment pipeline tools, communications features, and related functionality.</p>
          </Section>

          <Section title="3. Account Registration">
            <p>To use the Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information as necessary.</p>
            <p>You are responsible for safeguarding your account credentials. You agree to notify us immediately of any unauthorized use of your account. ChapterHQ is not liable for any loss resulting from unauthorized use of your account.</p>
            <p>One account per chapter. The account administrator (typically the chapter president) is responsible for all activity under the chapter's account.</p>
          </Section>

          <Section title="4. Subscription and Payment">
            <p>ChapterHQ offers a 30-day free trial. After the trial period, continued use requires a paid subscription. Subscriptions are billed monthly.</p>
            <p>You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. We do not offer refunds for partial months.</p>
            <p>We reserve the right to change pricing with 30 days' notice to active subscribers.</p>
          </Section>

          <Section title="5. Acceptable Use">
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Harass, bully, or harm other users</li>
              <li>Share illegal content or promote illegal activities</li>
              <li>Attempt to gain unauthorized access to the Service or other accounts</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Use the Service in any way that could disable or impair it</li>
            </ul>
            <p>We reserve the right to terminate accounts that violate these terms.</p>
          </Section>

          <Section title="6. Data and Privacy">
            <p>Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference.</p>
            <p>You retain ownership of all data you input into ChapterHQ. By using the Service, you grant ChapterHQ a limited license to store and process that data for the purpose of providing the Service.</p>
            <p>We do not sell your data to third parties. Member personal information (names, emails, GPA, etc.) is used solely to provide the Service to your chapter.</p>
          </Section>

          <Section title="7. Intellectual Property">
            <p>ChapterHQ and its original content, features, and functionality are owned by ChapterHQ and protected by copyright, trademark, and other intellectual property laws.</p>
            <p>You may not copy, reproduce, distribute, or create derivative works of the Service without explicit written permission.</p>
          </Section>

          <Section title="8. Disclaimers">
            <p>The Service is provided "as is" without warranties of any kind, express or implied. We do not warrant that the Service will be uninterrupted, error-free, or completely secure.</p>
            <p>ChapterHQ is not responsible for decisions made by chapter leadership based on data in the platform, including but not limited to bid decisions, academic probation, or financial matters.</p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>To the fullest extent permitted by law, ChapterHQ shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.</p>
            <p>Our total liability for any claim arising out of these Terms or your use of the Service shall not exceed the amount you paid us in the 12 months preceding the claim.</p>
          </Section>

          <Section title="10. Termination">
            <p>You may terminate your account at any time by contacting us or through the account settings.</p>
            <p>We may terminate or suspend your account immediately if you violate these Terms. Upon termination, your right to use the Service ceases immediately. We will provide a 30-day window to export your data.</p>
          </Section>

          <Section title="11. Changes to Terms">
            <p>We may update these Terms from time to time. We will notify active subscribers of material changes via email or in-app notification. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>
          </Section>

          <Section title="12. Contact">
            <p>Questions about these Terms? Contact us at <a href="mailto:admin@chapterhq.org" className="text-navy hover:underline">admin@chapterhq.org</a>.</p>
          </Section>
        </div>
      </div>
    </div>
  );
}
