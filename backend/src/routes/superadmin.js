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

// DELETE /api/superadmin/orgs/:id — cascade deletes all related data
router.delete('/orgs/:id', requireSuperAdmin, async (req, res) => {
  try {
    const orgId = req.params.id;
    // Delete in dependency order
    await prisma.duesPayment.deleteMany({ where: { member: { orgId } } }).catch(() => {});
    await prisma.duesRecord.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.attendance.deleteMany({ where: { event: { orgId } } }).catch(() => {});
    await prisma.event.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.announcement.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.channel.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.pNM.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.poll.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.member.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.organization.delete({ where: { id: orgId } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
