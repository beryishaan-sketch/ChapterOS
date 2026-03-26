const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');

const prisma = new PrismaClient();
router.use(verifyToken);

// GET /api/leaderboard
router.get('/', async (req, res) => {
  try {
    const { orgId } = req.user;

    const members = await prisma.member.findMany({
      where: { orgId, role: { not: 'alumni' } },
      select: {
        id: true, firstName: true, lastName: true,
        role: true, position: true, avatarUrl: true,
        points: true, gpa: true, studyHours: true,
        attendances: { where: { checkedIn: true }, select: { id: true } },
        duesPayments: { where: { status: 'paid' }, select: { id: true } },
      },
      orderBy: { points: 'desc' },
    });

    const ranked = members.map((m, i) => ({
      rank: i + 1,
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      role: m.role,
      position: m.position,
      avatarUrl: m.avatarUrl,
      points: m.points || 0,
      gpa: m.gpa,
      studyHours: m.studyHours || 0,
      eventsAttended: m.attendances.length,
      duesPaid: m.duesPayments.length > 0,
    }));

    return res.json({ success: true, data: ranked });
  } catch (e) {
    console.error('Leaderboard error:', e);
    return res.status(500).json({ success: false, error: 'Failed to load leaderboard' });
  }
});

// POST /api/leaderboard/:id/points — award/deduct points (admin/officer)
router.post('/:id/points', async (req, res) => {
  try {
    const { orgId } = req.user;
    const { points, reason } = req.body;
    if (!points || isNaN(points)) return res.status(400).json({ success: false, error: 'Points required' });

    const member = await prisma.member.findFirst({ where: { id: req.params.id, orgId } });
    if (!member) return res.status(404).json({ success: false, error: 'Member not found' });

    const updated = await prisma.member.update({
      where: { id: req.params.id },
      data: { points: Math.max(0, (member.points || 0) + parseInt(points)) },
    });

    return res.json({ success: true, data: { points: updated.points } });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to update points' });
  }
});

module.exports = router;
