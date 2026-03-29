const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');

const prisma = new PrismaClient();

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL || 'admin@chapterhq.org'}`,
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

router.use(verifyToken);

// GET /api/push/vapid-key — return public key to frontend
router.get('/vapid-key', (req, res) => {
  res.json({ success: true, data: { publicKey: process.env.VAPID_PUBLIC_KEY || '' } });
});

// POST /api/push/subscribe — save push subscription for this member
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint) return res.status(400).json({ success: false, error: 'Invalid subscription' });

    await prisma.member.update({
      where: { id: req.user.id },
      data: { pushSubscription: JSON.stringify(subscription) }
    });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to save subscription' });
  }
});

// POST /api/push/unsubscribe
router.post('/unsubscribe', async (req, res) => {
  try {
    await prisma.member.update({ where: { id: req.user.id }, data: { pushSubscription: null } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to unsubscribe' });
  }
});

// Helper: send push to all members of an org
async function pushToOrg(orgId, payload, options = {}) {
  try {
    const members = await prisma.member.findMany({
      where: { orgId, pushSubscription: { not: null } },
      select: { id: true, pushSubscription: true }
    });

    const results = await Promise.allSettled(
      members.map(async (m) => {
        try {
          const sub = JSON.parse(m.pushSubscription);
          await webpush.sendNotification(sub, JSON.stringify(payload));
        } catch (e) {
          // If subscription expired/invalid, clear it
          if (e.statusCode === 410 || e.statusCode === 404) {
            await prisma.member.update({ where: { id: m.id }, data: { pushSubscription: null } });
          }
        }
      })
    );
    return results.filter(r => r.status === 'fulfilled').length;
  } catch (e) {
    console.error('Push error:', e);
    return 0;
  }
}

module.exports = { router, pushToOrg };
