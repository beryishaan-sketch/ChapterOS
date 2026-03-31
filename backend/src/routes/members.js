const express = require('express');
const router = express.Router();
const { getMembers, getMember, createMember, updateMember, deleteMember, getStats } = require('../controllers/memberController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { PrismaClient } = require('@prisma/client');
const { ROLE_DEFAULTS } = require('../middleware/security');

const prisma = new PrismaClient();

router.use(verifyToken);

router.get('/', getMembers);
router.get('/stats', getStats);
router.post('/invite', requireRole('admin', 'officer'), createMember);
router.get('/:id', getMember);

// GET /api/members/:id/dues
router.get('/:id/dues', async (req, res) => {
  try {
    const member = await prisma.member.findFirst({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!member) return res.status(404).json({ success: false, error: 'Member not found' });
    const dues = await prisma.duesPayment.findMany({
      where: { memberId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: dues });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to get dues' });
  }
});
router.post('/', requireRole('admin', 'officer'), createMember);
router.put('/:id', updateMember);
router.patch('/:id', updateMember);
router.delete('/:id', requireRole('admin'), deleteMember);

// GET /api/members/:id/permissions — get effective permissions
router.get('/:id/permissions', requireRole('admin'), async (req, res) => {
  try {
    const member = await prisma.member.findFirst({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!member) return res.status(404).json({ success: false, error: 'Member not found' });
    const roleDefaults = ROLE_DEFAULTS[member.role] || ROLE_DEFAULTS.member;
    const effective = { ...roleDefaults, ...(member.permissions || {}) };
    return res.json({ success: true, data: { permissions: effective, overrides: member.permissions || {}, roleDefaults } });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to get permissions' });
  }
});

// PATCH /api/members/:id/permissions — set custom permissions (admin only)
router.patch('/:id/permissions', requireRole('admin'), async (req, res) => {
  try {
    const { permissions } = req.body;
    const member = await prisma.member.findFirst({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!member) return res.status(404).json({ success: false, error: 'Member not found' });

    // Merge with existing overrides
    const current = member.permissions || {};
    const updated = { ...current, ...permissions };

    await prisma.member.update({ where: { id: req.params.id }, data: { permissions: updated } });
    return res.json({ success: true, data: { permissions: updated } });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to update permissions' });
  }
});

// DELETE /api/members/:id/permissions — reset to role defaults
router.delete('/:id/permissions', requireRole('admin'), async (req, res) => {
  try {
    await prisma.member.update({ where: { id: req.params.id }, data: { permissions: null } });
    return res.json({ success: true, message: 'Permissions reset to role defaults' });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to reset permissions' });
  }
});

// POST /api/members/dedup — admin: remove duplicate members (same email or same full name)
router.post('/dedup', requireRole('admin'), async (req, res) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const members = await prisma.member.findMany({ where: { orgId: req.user.orgId }, orderBy: { createdAt: 'asc' } });

    const seen = new Map(); // key -> first member id
    const toDelete = [];

    for (const m of members) {
      const emailKey = m.email?.toLowerCase().trim();
      const nameKey = `${m.firstName?.toLowerCase().trim()} ${m.lastName?.toLowerCase().trim()}`;

      if (emailKey && seen.has(emailKey)) {
        toDelete.push(m.id);
      } else if (nameKey && nameKey !== ' ' && seen.has(nameKey)) {
        toDelete.push(m.id);
      } else {
        if (emailKey) seen.set(emailKey, m.id);
        if (nameKey !== ' ') seen.set(nameKey, m.id);
      }
    }

    if (toDelete.length > 0) {
      await prisma.member.deleteMany({ where: { id: { in: toDelete }, orgId: req.user.orgId } });
    }

    return res.json({ success: true, data: { removed: toDelete.length } });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Dedup failed' });
  }
});

module.exports = router;
