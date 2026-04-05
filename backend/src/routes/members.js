const express = require('express');
const router = express.Router();
const { getMembers, getMember, createMember, updateMember, deleteMember, getStats } = require('../controllers/memberController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { PrismaClient } = require('@prisma/client');
const { ROLE_DEFAULTS } = require('../middleware/security');
const { sendMemberInvite } = require('../utils/email');

const prisma = new PrismaClient();

router.use(verifyToken);

router.get('/', getMembers);
router.get('/stats', getStats);

// POST /members/invite — send invite emails with org's join code
router.post('/invite', requireRole('admin', 'officer'), async (req, res) => {
  try {
    const { emails } = req.body;
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ success: false, error: 'Provide at least one email address' });
    }
    const org = await prisma.organization.findUnique({ where: { id: req.user.orgId } });
    if (!org) return res.status(404).json({ success: false, error: 'Organization not found' });

    const results = [];
    for (const email of emails) {
      const trimmed = email.trim().toLowerCase();
      if (!trimmed || !/\S+@\S+\.\S+/.test(trimmed)) {
        results.push({ email: trimmed, success: false, error: 'Invalid email' });
        continue;
      }
      const result = await sendMemberInvite({ to: trimmed, orgName: org.name, inviteToken: org.inviteCode });
      results.push({ email: trimmed, ...result });
    }

    const allOk = results.every(r => r.success);
    return res.json({ success: allOk, data: { results }, message: `Invite${emails.length > 1 ? 's' : ''} sent` });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to send invites' });
  }
});

// POST /members/dedup — remove duplicate members (same email within org)
router.post('/dedup', requireRole('admin'), async (req, res) => {
  try {
    const members = await prisma.member.findMany({ where: { orgId: req.user.orgId }, select: { id: true, email: true, createdAt: true }, orderBy: { createdAt: 'asc' } });
    const seen = new Map();
    const toDelete = [];
    for (const m of members) {
      const key = m.email.toLowerCase();
      if (seen.has(key)) { toDelete.push(m.id); } else { seen.set(key, m.id); }
    }
    if (toDelete.length > 0) {
      await prisma.member.deleteMany({ where: { id: { in: toDelete }, orgId: req.user.orgId } });
    }
    return res.json({ success: true, data: { removed: toDelete.length } });
  } catch (e) { return res.status(500).json({ success: false, error: 'Failed to dedup members' }); }
});

router.get('/:id', getMember);
router.post('/', requireRole('admin', 'officer'), createMember);
router.put('/:id', updateMember);
router.patch('/:id', updateMember);
router.delete('/:id', requireRole('admin'), deleteMember);

// GET /api/members/:id/dues — member's dues history
router.get('/:id/dues', async (req, res) => {
  try {
    const member = await prisma.member.findFirst({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!member) return res.status(404).json({ success: false, error: 'Member not found' });
    const payments = await prisma.duesPayment.findMany({
      where: { memberId: req.params.id },
      include: { duesRecord: { select: { semester: true, dueDate: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const flat = payments.map(p => ({
      id: p.id,
      semester: p.duesRecord?.semester || null,
      amount: p.amount,
      paidAmount: p.status === 'paid' ? p.amount : ((p.winterPayment || 0) + (p.springPayment || 0)),
      status: p.status,
      dueDate: p.duesRecord?.dueDate || null,
      paidDate: p.paidAt || null,
    }));
    return res.json({ success: true, data: flat });
  } catch (e) { return res.status(500).json({ success: false, error: 'Failed to fetch dues' }); }
});

// GET /api/members/:id/attendance — member's attendance history
router.get('/:id/attendance', async (req, res) => {
  try {
    const member = await prisma.member.findFirst({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!member) return res.status(404).json({ success: false, error: 'Member not found' });
    const records = await prisma.attendance.findMany({
      where: { memberId: req.params.id, event: { orgId: req.user.orgId } },
      include: { event: { select: { id: true, title: true, date: true } } },
      orderBy: { event: { date: 'desc' } },
    });
    const data = records.map(r => ({
      eventId: r.eventId,
      eventTitle: r.event.title,
      date: r.event.date,
      attended: r.checkedIn,
    }));
    return res.json({ success: true, data });
  } catch (e) { return res.status(500).json({ success: false, error: 'Failed to fetch attendance' }); }
});

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
