const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"ChapterHQ" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

const sendDuesReminder = async ({ to, memberName, amount, dueDate, orgName }) => {
  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0F1C3F; padding: 24px; text-align: center;">
        <h1 style="color: #C9A84C; margin: 0;">ChapterHQ</h1>
        <p style="color: white; margin: 8px 0 0;">${orgName}</p>
      </div>
      <div style="padding: 32px; background: #fff;">
        <h2 style="color: #0F1C3F;">Dues Reminder</h2>
        <p>Hi ${memberName},</p>
        <p>This is a reminder that your chapter dues of <strong>$${amount}</strong> are due on <strong>${new Date(dueDate).toLocaleDateString()}</strong>.</p>
        <p>Please log in to ChapterHQ to complete your payment.</p>
        <a href="${process.env.FRONTEND_URL}/dues" style="display: inline-block; background: #C9A84C; color: #0F1C3F; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 16px;">Pay Now</a>
      </div>
      <div style="padding: 16px; text-align: center; color: #666; font-size: 12px;">
        <p>Powered by ChapterHQ</p>
      </div>
    </div>
  `;
  return sendEmail({ to, subject: `Dues Reminder — ${orgName}`, html });
};

const sendMemberInvite = async ({ to, orgName, inviteToken }) => {
  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0F1C3F; padding: 24px; text-align: center;">
        <h1 style="color: #C9A84C; margin: 0;">ChapterHQ</h1>
      </div>
      <div style="padding: 32px; background: #fff;">
        <h2 style="color: #0F1C3F;">You've been invited to ${orgName}</h2>
        <p>Your chapter is using ChapterHQ to manage operations. Click below to create your account.</p>
        <a href="${process.env.FRONTEND_URL}/register?token=${inviteToken}" style="display: inline-block; background: #C9A84C; color: #0F1C3F; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 16px;">Accept Invitation</a>
      </div>
      <div style="padding: 16px; text-align: center; color: #666; font-size: 12px;">
        <p>Powered by ChapterHQ</p>
      </div>
    </div>
  `;
  return sendEmail({ to, subject: `You've been invited to join ${orgName} on ChapterHQ`, html });
};

module.exports = { sendEmail, sendDuesReminder, sendMemberInvite };
