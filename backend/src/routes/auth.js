const express = require('express');
const router = express.Router();
const { register, login, me, join, forgotPassword, resetPassword } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

router.post('/register', register);
router.post('/join', join);
router.post('/login', login);
router.get('/me', verifyToken, me);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// POST /auth/change-password — authenticated user changes own password
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.member.update({ where: { id: req.user.id }, data: { passwordHash, mustChangePassword: false } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to update password' });
  }
});

// POST /auth/set-password — set password via invite token (auto-logs in)
router.post('/set-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 8) return res.status(400).json({ success: false, error: 'Token and password (min 8 chars) required' });

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { token, used: false, expiresAt: { gt: new Date() } },
      include: { member: { include: { organization: true } } },
    });
    if (!resetToken) return res.status(400).json({ success: false, error: 'Invalid or expired invite link' });

    const passwordHash = await bcrypt.hash(password, 12);
    const updated = await prisma.member.update({
      where: { id: resetToken.memberId },
      data: { passwordHash, mustChangePassword: false },
    });
    await prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { used: true } });

    const authToken = jwt.sign(
      { id: updated.id, orgId: updated.orgId, role: updated.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({ success: true, data: { token: authToken, member: updated, org: resetToken.member?.organization } });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to set password' });
  }
});
// Notification preferences (stub — returns empty prefs)
router.get('/me/notifications', verifyToken, (req, res) => {
  res.json({ success: true, data: { emailDues: true, emailEvents: true, emailRecruitment: false, emailAnnouncements: true } });
});
router.put('/me/notifications', verifyToken, (req, res) => {
  res.json({ success: true, data: req.body });
});
router.patch('/me/notifications', verifyToken, (req, res) => {
  res.json({ success: true, data: req.body });
});

module.exports = router;
