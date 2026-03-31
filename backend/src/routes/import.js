const express = require('express');
const router = express.Router();
const { preview, importMembers, importPNMs, importEvents } = require('../controllers/importController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.use(verifyToken);
router.use(requireRole('admin', 'officer'));

router.post('/preview', preview);
router.post('/members', importMembers);
router.post('/pnms', importPNMs);
router.post('/events', importEvents);

// Clear all dues records for this org
router.delete('/dues', async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const records = await prisma.duesRecord.findMany({ where: { orgId }, select: { id: true } });
    const ids = records.map(r => r.id);
    if (ids.length) {
      await prisma.$executeRawUnsafe(`DELETE FROM "DuesPayment" WHERE "duesRecordId" = ANY(ARRAY[${ids.map(id => `'${id}'`).join(',')}])`);
      await prisma.$executeRawUnsafe(`DELETE FROM "DuesRecord" WHERE "orgId" = '${orgId}'`);
    }
    return res.json({ success: true, message: 'All dues cleared' });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// Clear all imported (ghost) members — email ends with .import@chapter.local
router.delete('/members', async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const ghosts = await prisma.member.findMany({
      where: { orgId, email: { endsWith: '.import@chapter.local' } },
      select: { id: true },
    });
    const ids = ghosts.map(m => m.id);
    if (ids.length) {
      const arr = ids.map(id => `'${id}'`).join(',');
      try { await prisma.$executeRawUnsafe(`DELETE FROM "DuesPayment" WHERE "memberId" = ANY(ARRAY[${arr}])`); } catch {}
      try { await prisma.$executeRawUnsafe(`DELETE FROM "Attendance" WHERE "memberId" = ANY(ARRAY[${arr}])`); } catch {}
      try { await prisma.$executeRawUnsafe(`DELETE FROM "Notification" WHERE "memberId" = ANY(ARRAY[${arr}])`); } catch {}
      try { await prisma.$executeRawUnsafe(`DELETE FROM "Transaction" WHERE "createdById" = ANY(ARRAY[${arr}])`); } catch {}
      await prisma.$executeRawUnsafe(`DELETE FROM "Member" WHERE id = ANY(ARRAY[${arr}])`);
    }
    return res.json({ success: true, deleted: ids.length });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
