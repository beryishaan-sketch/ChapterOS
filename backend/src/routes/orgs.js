const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

// PUT or PATCH /orgs/current
const updateOrg = async (req, res) => {
  try {
    // Accept all safe fields including onboarding extras (stored in name/school or ignored gracefully)
    const allowed = ['name', 'type', 'school', 'logoUrl', 'primaryColor'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    // greekLetters, foundingYear, chapterDesignation — append to name if provided
    if (req.body.greekLetters && !updates.name) {
      const org = await prisma.organization.findUnique({ where: { id: req.user.orgId } });
      updates.name = org?.name || req.body.greekLetters;
    }
    if (Object.keys(updates).length === 0) {
      return res.json({ success: true, data: {} }); // nothing to update, silently succeed
    }
    const org = await prisma.organization.update({ where: { id: req.user.orgId }, data: updates });
    return res.json({ success: true, data: org });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to update org' });
  }
};
router.put('/current', requireRole('admin'), updateOrg);
router.patch('/current', requireRole('admin'), updateOrg);

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

// POST /orgs/current/regenerate-invite (legacy)
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

// PATCH /orgs/invite-code
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

// PATCH /orgs/invite-code (alias for regenerate)
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

module.exports = router;
