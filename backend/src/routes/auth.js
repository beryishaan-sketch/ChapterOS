const express = require('express');
const router = express.Router();
const { register, login, me, join, forgotPassword, resetPassword } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/register', register);
router.post('/join', join);
router.post('/login', login);
router.get('/me', verifyToken, me);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Change own password (requires current login token)
router.post('/change-password', verifyToken, async (req, res) => {
  const bcrypt = require('bcrypt');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const { password } = req.body;
    if (!password || password.length < 8) return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    const hash = await bcrypt.hash(password, 12);
    await prisma.member.update({
      where: { id: req.user.id },
      data: { passwordHash: hash, mustChangePassword: false }
    });
    return res.json({ success: true });
  } catch (e) { return res.status(500).json({ success: false, error: 'Failed to update password' }); }
});

// Admin: generate reset link for a member
router.post('/admin-reset/:memberId', verifyToken, async (req, res) => {
  const crypto = require('crypto');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'officer') return res.status(403).json({ success: false, error: 'Forbidden' });
    const member = await prisma.member.findFirst({ where: { id: req.params.memberId, orgId: req.user.orgId } });
    if (!member) return res.status(404).json({ success: false, error: 'Member not found' });
    const token = crypto.randomBytes(24).toString('hex');
    const expiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
    await prisma.member.update({ where: { id: member.id }, data: { resetToken: token, resetTokenExpiry: expiry } });
    const resetUrl = `${process.env.FRONTEND_URL || 'https://web-production-29410.up.railway.app'}/set-password?token=${token}`;
    return res.json({ success: true, data: { resetUrl, expiresAt: expiry } });
  } catch (e) { return res.status(500).json({ success: false, error: 'Failed to generate reset link' }); }
});

// Set password via token (for imported members)
router.post('/set-password', async (req, res) => {
  const bcrypt = require('bcrypt');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 8) return res.status(400).json({ success: false, error: 'Token and password (min 8 chars) required' });
    const member = await prisma.member.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
      include: { org: true }
    });
    if (!member) return res.status(400).json({ success: false, error: 'Invalid or expired link' });
    const hash = await bcrypt.hash(password, 12);
    const updated = await prisma.member.update({
      where: { id: member.id },
      data: { passwordHash: hash, mustChangePassword: false, resetToken: null, resetTokenExpiry: null }
    });
    const jwt = require('jsonwebtoken');
    const authToken = jwt.sign({ id: updated.id, orgId: updated.orgId, role: updated.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    const { passwordHash: _, resetToken: __, resetTokenExpiry: ___, ...memberData } = updated;
    return res.json({ success: true, data: { token: authToken, member: memberData, org: member.org } });
  } catch (e) { return res.status(500).json({ success: false, error: 'Failed to set password' }); }
});
// Notification preferences (stub — returns empty prefs)
router.get('/me/notifications', verifyToken, (req, res) => {
  res.json({ success: true, data: { emailDues: true, emailEvents: true, emailRecruitment: false, emailAnnouncements: true } });
});
router.put('/me/notifications', verifyToken, (req, res) => {
  res.json({ success: true, data: req.body });
});

module.exports = router;
