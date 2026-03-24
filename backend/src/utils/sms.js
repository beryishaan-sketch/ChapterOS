/**
 * SMS utility — Twilio
 * Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE in .env
 * If not configured, logs to console (dev mode)
 */

const sendSMS = async ({ to, body }) => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE) {
    console.log(`[SMS DEV] To: ${to} | Message: ${body}`);
    return { success: true, dev: true };
  }

  try {
    const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const msg = await twilio.messages.create({
      body,
      from: TWILIO_PHONE,
      to: to.startsWith('+') ? to : `+1${to.replace(/\D/g, '')}`,
    });
    return { success: true, sid: msg.sid };
  } catch (e) {
    console.error('SMS error:', e.message);
    return { success: false, error: e.message };
  }
};

const sendDuesSMS = async ({ to, memberName, amount, dueDate, orgName }) => {
  const date = dueDate ? new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'soon';
  const body = `Hi ${memberName.split(' ')[0]} — ${orgName} dues of $${amount} are due by ${date}. Pay your treasurer or contact an officer to avoid social probation. - ChapterOS`;
  return sendSMS({ to, body });
};

const sendEventReminderSMS = async ({ to, memberName, eventTitle, eventDate, location }) => {
  const date = new Date(eventDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const body = `Hey ${memberName.split(' ')[0]}, reminder: ${eventTitle} is ${date}${location ? ` at ${location}` : ''}. - ChapterOS`;
  return sendSMS({ to, body });
};

module.exports = { sendSMS, sendDuesSMS, sendEventReminderSMS };
