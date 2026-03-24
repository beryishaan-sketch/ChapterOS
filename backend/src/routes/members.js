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

module.exports = router;
