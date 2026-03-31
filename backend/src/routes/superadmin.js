const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simple super-admin auth via env var token
const SUPER_ADMIN_KEY = process.env.SUPER_ADMIN_KEY || 'chapterhq-superadmin-2026';

const requireSuperAdmin = (req, res, next) => {
  const key = req.headers['x-super-admin-key'] || req.query.key;
  if (key !== SUPER_ADMIN_KEY) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  next();
};

// GET /api/superadmin/stats
router.get('/stats', requireSuperAdmin, async (req, res) => {
  try {
    const [
      totalOrgs,
      totalMembers,
      trialOrgs,
      paidOrgs,
      recentOrgs,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.member.count(),
      prisma.organization.count({ where: { plan: 'trial' } }),
      prisma.organization.count({ where: { plan: { not: 'trial' } } }),
      prisma.organization.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          _count: { select: { members: true, events: true } }
        }
      })
    ]);

    return res.json({
      success: true,
      data: {
        totalOrgs,
        totalMembers,
        trialOrgs,
        paidOrgs,
        recentOrgs,
        mrr: paidOrgs * 89, // estimate at standard plan
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/superadmin/orgs
router.get('/orgs', requireSuperAdmin, async (req, res) => {
  try {
    const orgs = await prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { members: true, events: true, duesRecords: true } }
      }
    });
    return res.json({ success: true, data: orgs });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// DELETE /api/superadmin/orgs/:id — cascade via raw SQL to avoid FK constraint ordering
router.delete('/orgs/:id', requireSuperAdmin, async (req, res) => {
  try {
    const orgId = req.params.id;
    // Use raw SQL to bypass FK constraint ordering issues
    await prisma.$executeRawUnsafe(`
      DO $$
      DECLARE mid TEXT;
      BEGIN
        -- delete member-dependent records first
        FOR mid IN SELECT id FROM "Member" WHERE "orgId" = '${orgId}' LOOP
          DELETE FROM "DuesPayment" WHERE "memberId" = mid;
          DELETE FROM "Attendance" WHERE "memberId" = mid;
          DELETE FROM "PasswordResetToken" WHERE "memberId" = mid;
        END LOOP;
        -- delete org-level records
        DELETE FROM "DuesRecord" WHERE "orgId" = '${orgId}';
        DELETE FROM "Event" WHERE "orgId" = '${orgId}';
        DELETE FROM "Announcement" WHERE "orgId" = '${orgId}';
        DELETE FROM "Channel" WHERE "orgId" = '${orgId}';
        DELETE FROM "PNM" WHERE "orgId" = '${orgId}';
        DELETE FROM "Poll" WHERE "orgId" = '${orgId}';
        DELETE FROM "Member" WHERE "orgId" = '${orgId}';
        DELETE FROM "Organization" WHERE id = '${orgId}';
      END $$;
    `);
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/superadmin/nuke-org — hard delete with full cascade
router.post('/nuke-org', requireSuperAdmin, async (req, res) => {
  try {
    const { orgId } = req.body;
    if (!orgId) return res.status(400).json({ success: false, error: 'orgId required' });

    const memberIds = (await prisma.member.findMany({ where: { orgId }, select: { id: true } })).map(m => m.id);

    if (memberIds.length) {
      await prisma.$executeRawUnsafe(`DELETE FROM "DuesPayment" WHERE "memberId" = ANY(ARRAY[${memberIds.map(id => `'${id}'`).join(',')}])`);
      await prisma.$executeRawUnsafe(`DELETE FROM "Attendance" WHERE "memberId" = ANY(ARRAY[${memberIds.map(id => `'${id}'`).join(',')}])`);
      // PasswordResetToken if exists
      try { await prisma.$executeRawUnsafe(`DELETE FROM "PasswordResetToken" WHERE "memberId" = ANY(ARRAY[${memberIds.map(id => `'${id}'`).join(',')}])`); } catch {}
      try { await prisma.$executeRawUnsafe(`DELETE FROM "Transaction" WHERE "createdById" = ANY(ARRAY[${memberIds.map(id => `'${id}'`).join(',')}])`); } catch {}
      try { await prisma.$executeRawUnsafe(`DELETE FROM "Transaction" WHERE "orgId" = '${orgId}'`); } catch {}
      try { await prisma.$executeRawUnsafe(`DELETE FROM "Notification" WHERE "memberId" = ANY(ARRAY[${memberIds.map(id => `'${id}'`).join(',')}])`); } catch {}
      try { await prisma.$executeRawUnsafe(`DELETE FROM "Notification" WHERE "orgId" = '${orgId}'`); } catch {}
    }

    await prisma.$executeRawUnsafe(`DELETE FROM "DuesRecord" WHERE "orgId" = '${orgId}'`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Event" WHERE "orgId" = '${orgId}'`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Announcement" WHERE "orgId" = '${orgId}'`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Channel" WHERE "orgId" = '${orgId}'`);
    try { await prisma.$executeRawUnsafe(`DELETE FROM "PNM" WHERE "orgId" = '${orgId}'`); } catch {}
    try { await prisma.$executeRawUnsafe(`DELETE FROM "Poll" WHERE "orgId" = '${orgId}'`); } catch {}
    await prisma.$executeRawUnsafe(`DELETE FROM "Member" WHERE "orgId" = '${orgId}'`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Organization" WHERE id = '${orgId}'`);

    return res.json({ success: true, message: `Org ${orgId} and all related data deleted` });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// Clear all dues for an org (keeps members)
router.post('/clear-dues', requireSuperAdmin, async (req, res) => {
  const { orgId } = req.body;
  if (!orgId) return res.status(400).json({ success: false, error: 'orgId required' });
  try {
    const records = await prisma.duesRecord.findMany({ where: { orgId }, select: { id: true } });
    const ids = records.map(r => r.id);
    if (ids.length) {
      await prisma.$executeRawUnsafe(`DELETE FROM "DuesPayment" WHERE "duesRecordId" = ANY(ARRAY[${ids.map(id => `'${id}'`).join(',')}])`);
    }
    await prisma.$executeRawUnsafe(`DELETE FROM "DuesRecord" WHERE "orgId" = '${orgId}'`);
    return res.json({ success: true, message: `All dues cleared for ${orgId}` });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// Clear all ghost members (email ends with .import@chapter.local) + their dues
router.post('/clear-imported', requireSuperAdmin, async (req, res) => {
  const { orgId } = req.body;
  if (!orgId) return res.status(400).json({ success: false, error: 'orgId required' });
  try {
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
