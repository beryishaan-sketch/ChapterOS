const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { sendEmail } = require('../utils/email');

const prisma = new PrismaClient();

async function sendDuesReminders() {
  console.log('[DuesReminder] Running dues reminder check...');
  try {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Find unpaid dues that are due within 7 days or overdue
    const unpaidPayments = await prisma.duesPayment.findMany({
      where: {
        status: { in: ['unpaid', 'pending'] },
        duesRecord: {
          dueDate: { lte: in7Days },
        },
        // Only remind if we haven't reminded in the last 24h (use updatedAt as proxy)
        updatedAt: { lt: oneDayAgo },
      },
      include: {
        member: { select: { id: true, firstName: true, email: true } },
        duesRecord: { select: { semester: true, amount: true, dueDate: true, org: { select: { name: true } } } },
      },
    });

    console.log(`[DuesReminder] Found ${unpaidPayments.length} unpaid dues to remind`);

    for (const payment of unpaidPayments) {
      const { member, duesRecord } = payment;
      if (!member.email) continue;

      const isOverdue = new Date(duesRecord.dueDate) < now;
      const daysLeft = Math.ceil((new Date(duesRecord.dueDate) - now) / (1000 * 60 * 60 * 24));

      try {
        await sendEmail({
          to: member.email,
          subject: isOverdue
            ? `[${duesRecord.org.name}] Dues Overdue — ${duesRecord.semester}`
            : `[${duesRecord.org.name}] Dues Reminder — Due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
          html: `
            <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #0F1C3F; padding: 24px 32px; border-radius: 12px 12px 0 0;">
                <h2 style="color: white; margin: 0; font-size: 20px;">ChapterHQ</h2>
                <p style="color: #94A3B8; margin: 4px 0 0; font-size: 13px;">${duesRecord.org.name}</p>
              </div>
              <div style="background: white; border: 1px solid #E5E7EB; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
                <h3 style="margin: 0 0 8px; color: #111827;">Hey ${member.firstName},</h3>
                <p style="color: #4B5563; margin: 0 0 20px;">
                  ${isOverdue
                    ? `Your dues for <strong>${duesRecord.semester}</strong> are <span style="color:#EF4444;font-weight:600;">overdue</span>. Please pay as soon as possible to remain in good standing.`
                    : `Your dues for <strong>${duesRecord.semester}</strong> are due in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>.`
                  }
                </p>
                <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                  <p style="margin: 0; font-size: 13px; color: #6B7280;">Amount Due</p>
                  <p style="margin: 4px 0 0; font-size: 28px; font-weight: 700; color: #0F1C3F;">$${(payment.amount / 100).toFixed(2)}</p>
                  <p style="margin: 4px 0 0; font-size: 12px; color: #9CA3AF;">Due: ${new Date(duesRecord.dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <p style="color: #6B7280; font-size: 13px; margin: 0;">Log into ChapterHQ to mark as paid or contact your treasurer with questions.</p>
              </div>
            </div>
          `,
        });

        // Touch updatedAt to prevent re-sending within 24h
        await prisma.duesPayment.update({
          where: { id: payment.id },
          data: { updatedAt: now },
        });

        console.log(`[DuesReminder] Sent reminder to ${member.email}`);
      } catch (err) {
        console.error(`[DuesReminder] Failed to email ${member.email}:`, err.message);
      }
    }

    console.log('[DuesReminder] Done.');
  } catch (err) {
    console.error('[DuesReminder] Error:', err);
  }
}

function startDuesReminderCron() {
  // Run every day at 9 AM
  cron.schedule('0 9 * * *', sendDuesReminders, {
    timezone: 'America/New_York',
  });
  console.log('[DuesReminder] Cron scheduled — daily at 9 AM ET');
}

module.exports = { startDuesReminderCron, sendDuesReminders };
