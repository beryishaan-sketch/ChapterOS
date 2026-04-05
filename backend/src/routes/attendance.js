const express = require('express');
const router = express.Router();
const { getAttendance, checkIn, bulkCheckIn, getAttendanceReport } = require('../controllers/attendanceController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

router.use(verifyToken);

router.get('/', getAttendance);
router.get('/report', getAttendanceReport);
// History returns per-event summaries: [{eventTitle, date, attended, total}]
router.get('/history', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const [events, totalMembers] = await Promise.all([
      prisma.event.findMany({
        where: { orgId: req.user.orgId },
        include: { attendances: { select: { checkedIn: true } } },
        orderBy: { date: 'desc' },
      }),
      prisma.member.count({ where: { orgId: req.user.orgId } }),
    ]);
    const history = events.map(e => ({
      eventTitle: e.title,
      date: e.date,
      attended: e.attendances.filter(a => a.checkedIn).length,
      total: totalMembers,
    }));
    return res.json({ success: true, data: history });
  } catch (e) { return res.status(500).json({ success: false, error: 'Failed to fetch history' }); }
});
router.post('/checkin', checkIn);
router.post('/bulk', requireRole('admin', 'officer'), bulkCheckIn);

module.exports = router;
