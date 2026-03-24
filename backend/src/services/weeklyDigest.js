const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { sendEmail } = require('../utils/email');

const prisma = new PrismaClient();

async function sendWeeklyDigest() {
  console.log('[WeeklyDigest] Sending weekly digests...');
  try {
    const orgs = await prisma.organization.findMany({
      where: { plan: { not: 'cancelled' } },
      include: {
        members: {
          where: { role: { in: ['admin', 'officer'] } },
          select: { email: true, firstName: true },
        },
      },
    });

    for (const org of orgs) {
      if (!org.members.length) continue;
      try {
        await sendDigestForOrg(org);
      } catch (e) {
        console.error(`[WeeklyDigest] Failed for org ${org.id}:`, e.message);
      }
    }
    console.log('[WeeklyDigest] Done.');
  } catch (e) {
    console.error('[WeeklyDigest] Error:', e);
  }
}

async function sendDigestForOrg(org) {
  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    totalMembers,
    newMembers,
    upcomingEvents,
    duesPaid,
    duesUnpaid,
    activePNMs,
  ] = await Promise.all([
    prisma.member.count({ where: { orgId: org.id } }),
    prisma.member.count({ where: { orgId: org.id, createdAt: { gte: weekAgo } } }),
    prisma.event.findMany({
      where: { orgId: org.id, date: { gte: now, lte: weekAhead } },
      select: { title: true, date: true, type: true },
      orderBy: { date: 'asc' },
      take: 5,
    }),
    prisma.duesPayment.count({ where: { member: { orgId: org.id }, status: 'paid' } }),
    prisma.duesPayment.count({ where: { member: { orgId: org.id }, status: 'unpaid' } }),
    prisma.pNM.count({ where: { orgId: org.id, stage: { notIn: ['pledged', 'dropped'] } } }),
  ]);

  const totalDues = duesPaid + duesUnpaid;
  const duesRate = totalDues > 0 ? Math.round((duesPaid / totalDues) * 100) : 0;

  const eventRows = upcomingEvents.map(e =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px;color:#374151;">${e.title}</td>
     <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px;color:#6B7280;">${new Date(e.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</td>
     <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:12px;"><span style="background:#EFF6FF;color:#3B82F6;padding:2px 8px;border-radius:99px;text-transform:capitalize;">${e.type}</span></td></tr>`
  ).join('');

  const html = `
<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#0F1C3F;padding:28px 32px;border-radius:12px 12px 0 0;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
      <div style="background:#C9A84C;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;">
        <span style="color:#0F1C3F;font-weight:900;font-size:16px;">⚡</span>
      </div>
      <span style="color:white;font-weight:800;font-size:18px;">ChapterOS</span>
    </div>
    <p style="color:#94A3B8;margin:8px 0 0;font-size:13px;">Weekly Digest — ${org.name}</p>
  </div>

  <div style="padding:28px 32px;border:1px solid #E5E7EB;border-top:none;">
    <h2 style="margin:0 0 20px;color:#111827;font-size:18px;">Chapter snapshot 📊</h2>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:28px;">
      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:16px;text-align:center;">
        <p style="margin:0;font-size:24px;font-weight:800;color:#0F1C3F;">${totalMembers}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#6B7280;">Members</p>
        ${newMembers > 0 ? `<p style="margin:4px 0 0;font-size:11px;color:#10B981;">+${newMembers} this week</p>` : ''}
      </div>
      <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:16px;text-align:center;">
        <p style="margin:0;font-size:24px;font-weight:800;color:#16A34A;">${duesRate}%</p>
        <p style="margin:4px 0 0;font-size:12px;color:#6B7280;">Dues paid</p>
        <p style="margin:4px 0 0;font-size:11px;color:#6B7280;">${duesUnpaid} still owe</p>
      </div>
      <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:16px;text-align:center;">
        <p style="margin:0;font-size:24px;font-weight:800;color:#EA580C;">${activePNMs}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#6B7280;">Active PNMs</p>
      </div>
    </div>

    ${upcomingEvents.length > 0 ? `
    <h3 style="margin:0 0 12px;color:#111827;font-size:15px;">Upcoming this week</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead><tr>
        <th style="text-align:left;font-size:11px;color:#9CA3AF;padding-bottom:8px;border-bottom:2px solid #F3F4F6;">EVENT</th>
        <th style="text-align:left;font-size:11px;color:#9CA3AF;padding-bottom:8px;border-bottom:2px solid #F3F4F6;">DATE</th>
        <th style="text-align:left;font-size:11px;color:#9CA3AF;padding-bottom:8px;border-bottom:2px solid #F3F4F6;">TYPE</th>
      </tr></thead>
      <tbody>${eventRows}</tbody>
    </table>` : '<p style="color:#9CA3AF;font-size:13px;margin-bottom:24px;">No events scheduled this week.</p>'}

    ${duesUnpaid > 0 ? `
    <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#92400E;font-weight:600;">💰 ${duesUnpaid} member${duesUnpaid !== 1 ? 's' : ''} still owe dues</p>
      <p style="margin:6px 0 0;font-size:12px;color:#B45309;">Automated reminders are going out. Log into ChapterOS to send manual reminders.</p>
    </div>` : ''}

    <a href="${process.env.FRONTEND_URL || 'https://chapteros.app'}/dashboard"
      style="display:block;text-align:center;background:#0F1C3F;color:white;padding:14px;border-radius:10px;font-weight:600;font-size:14px;text-decoration:none;">
      Open ChapterOS →
    </a>
  </div>

  <div style="padding:16px 32px;text-align:center;color:#9CA3AF;font-size:11px;border-top:1px solid #F3F4F6;">
    <p style="margin:0;">ChapterOS Weekly Digest · ${org.name} · <a href="#" style="color:#9CA3AF;">Unsubscribe</a></p>
  </div>
</div>`;

  for (const admin of org.members) {
    await sendEmail({
      to: admin.email,
      subject: `📊 ${org.name} Weekly Digest — ${new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'})}`,
      html,
    }).catch(() => {});
  }
}

function startWeeklyDigestCron() {
  // Every Monday at 8 AM ET
  cron.schedule('0 8 * * 1', sendWeeklyDigest, { timezone: 'America/New_York' });
  console.log('[WeeklyDigest] Cron scheduled — Mondays at 8 AM ET');
}

module.exports = { startWeeklyDigestCron, sendWeeklyDigest };
