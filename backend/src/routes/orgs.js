const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../../uploads'),
  filename: (req, file, cb) => cb(null, `logo-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB for logos

router.use(verifyToken);

// GET /orgs/current
router.get('/current', async (req, res) => {
  try {
    const org = await prisma.organization.findUnique({ where: { id: req.user.orgId } });
    if (!org) return res.status(404).json({ success: false, error: 'Organization not found' });
    return res.json({ success: true, data: org });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to fetch org' });
  }
});

// PUT /orgs/current (full update, JSON only)
router.put('/current', requireRole('admin'), async (req, res) => {
  try {
    const allowed = ['name', 'type', 'school', 'logoUrl', 'primaryColor'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const org = await prisma.organization.update({ where: { id: req.user.orgId }, data: updates });
    return res.json({ success: true, data: org });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to update org' });
  }
});

// PATCH /orgs/current (partial update, supports multipart for logo upload)
router.patch('/current', requireRole('admin'), upload.single('logo'), async (req, res) => {
  try {
    // Only allow fields that exist in the Organization schema
    const allowed = ['name', 'type', 'school', 'logoUrl', 'primaryColor'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    // accentColor is the frontend name for primaryColor
    if (req.body.accentColor !== undefined) updates.primaryColor = req.body.accentColor;
    if (req.file) {
      updates.logoUrl = `/uploads/${req.file.filename}`;
    }
    if (Object.keys(updates).length === 0) {
      // Nothing to update — return current org (silently succeed for onboarding fields not yet in schema)
      const org = await prisma.organization.findUnique({ where: { id: req.user.orgId } });
      return res.json({ success: true, data: org });
    }
    const org = await prisma.organization.update({ where: { id: req.user.orgId }, data: updates });
    return res.json({ success: true, data: org });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to update org' });
  }
});

// DELETE /orgs/current
router.delete('/current', requireRole('admin'), async (req, res) => {
  try {
    await prisma.organization.delete({ where: { id: req.user.orgId } });
    return res.json({ success: true, data: { deleted: true } });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to delete organization' });
  }
});

// GET /orgs/current/officers
router.get('/current/officers', async (req, res) => {
  try {
    const officers = await prisma.member.findMany({
      where: { orgId: req.user.orgId, role: { in: ['admin', 'officer'] } },
      select: { id: true, firstName: true, lastName: true, role: true, position: true, email: true },
      orderBy: { role: 'asc' },
    });
    return res.json({ success: true, data: officers });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to fetch officers' });
  }
});

// POST /orgs/current/officers — assign officer role/position to an existing member
router.post('/current/officers', requireRole('admin'), async (req, res) => {
  try {
    const { memberId, role, position } = req.body;
    if (!memberId) return res.status(400).json({ success: false, error: 'memberId is required' });
    const member = await prisma.member.findFirst({ where: { id: memberId, orgId: req.user.orgId } });
    if (!member) return res.status(404).json({ success: false, error: 'Member not found' });
    const updated = await prisma.member.update({
      where: { id: memberId },
      data: { role: role || 'officer', position: position || member.position },
      select: { id: true, firstName: true, lastName: true, role: true, position: true, email: true },
    });
    return res.json({ success: true, data: updated });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to add officer' });
  }
});

// PUT /orgs/current/officers/:memberId
router.put('/current/officers/:memberId', requireRole('admin'), async (req, res) => {
  try {
    const { role, position } = req.body;
    const member = await prisma.member.updateMany({
      where: { id: req.params.memberId, orgId: req.user.orgId },
      data: { role, position },
    });
    return res.json({ success: true, data: member });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to update officer' });
  }
});

// DELETE /orgs/current/officers/:memberId — demote to member role
router.delete('/current/officers/:memberId', requireRole('admin'), async (req, res) => {
  try {
    if (req.params.memberId === req.user.id) {
      return res.status(400).json({ success: false, error: 'Cannot remove yourself as officer' });
    }
    await prisma.member.updateMany({
      where: { id: req.params.memberId, orgId: req.user.orgId },
      data: { role: 'member', position: null },
    });
    return res.json({ success: true, data: { demoted: true } });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to remove officer' });
  }
});

// PATCH /orgs/invite-code — regenerate invite code
router.patch('/invite-code', requireRole('admin'), async (req, res) => {
  try {
    const { randomBytes } = require('crypto');
    const inviteCode = randomBytes(4).toString('hex').toUpperCase();
    const org = await prisma.organization.update({ where: { id: req.user.orgId }, data: { inviteCode } });
    return res.json({ success: true, data: { inviteCode: org.inviteCode } });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to regenerate invite code' });
  }
});

// POST /orgs/current/regenerate-invite (legacy alias)
router.post('/current/regenerate-invite', requireRole('admin'), async (req, res) => {
  try {
    const { randomBytes } = require('crypto');
    const inviteCode = randomBytes(4).toString('hex').toUpperCase();
    const org = await prisma.organization.update({ where: { id: req.user.orgId }, data: { inviteCode } });
    return res.json({ success: true, data: { inviteCode: org.inviteCode } });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to regenerate invite code' });
  }
});

module.exports = router;
