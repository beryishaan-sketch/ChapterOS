const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { sendEmail } = require('../utils/email');

const prisma = new PrismaClient();

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

const signToken = (member) => {
  return jwt.sign(
    { id: member.id, orgId: member.orgId, role: member.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const register = async (req, res) => {
  try {
    const { orgName, orgType, school, firstName, lastName, email, password, position } = req.body;

    if (!orgName || !orgType || !school || !firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const existing = await prisma.member.findFirst({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }

    const { randomBytes } = require('crypto');
    const inviteCode = randomBytes(4).toString('hex').toUpperCase();
    const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const org = await prisma.organization.create({
      data: { name: orgName, type: orgType, school, plan: 'trial', trialEndsAt, inviteCode },
    });

    const passwordHash = await bcrypt.hash(password, 12);
    const member = await prisma.member.create({
      data: {
        orgId: org.id, email, passwordHash,
        firstName, lastName, role: 'admin',
        position: position || 'President',
      },
    });

    // Create default channels for new chapter
    const defaultChannels = [
      { name: 'general', emoji: '💬', description: 'Chapter-wide announcements and chat', allowedRoles: 'all' },
      { name: 'officers', emoji: '⭐', description: 'Officers only', allowedRoles: 'admin,officer' },
      { name: 'events', emoji: '📅', description: 'Event planning and coordination', allowedRoles: 'all' },
      { name: 'rush', emoji: '🤝', description: 'Recruitment discussion', allowedRoles: 'admin,officer' },
    ];
    for (const ch of defaultChannels) {
      await prisma.channel.create({ data: { ...ch, orgId: org.id } });
    }

    const token = signToken(member);
    const { passwordHash: _, ...memberData } = member;

    return res.status(201).json({
      success: true,
      data: { token, member: memberData, org },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, error: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const member = await prisma.member.findFirst({
      where: { email: email.toLowerCase().trim() },
      include: { org: true },
    });

    if (!member) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check lockout
    if (member.lockedUntil && member.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((member.lockedUntil - new Date()) / 60000);
      return res.status(423).json({
        success: false,
        error: `Account locked due to too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`
      });
    }

    const valid = await bcrypt.compare(password, member.passwordHash);

    if (!valid) {
      const attempts = (member.loginAttempts || 0) + 1;
      const updateData = { loginAttempts: attempts };

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        updateData.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        updateData.loginAttempts = 0;
        await prisma.member.update({ where: { id: member.id }, data: updateData });
        return res.status(423).json({
          success: false,
          error: `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`
        });
      }

      await prisma.member.update({ where: { id: member.id }, data: updateData });
      const remaining = MAX_LOGIN_ATTEMPTS - attempts;
      return res.status(401).json({
        success: false,
        error: `Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before lockout.`
      });
    }

    // Reset login attempts on success
    if (member.loginAttempts > 0 || member.lockedUntil) {
      await prisma.member.update({
        where: { id: member.id },
        data: { loginAttempts: 0, lockedUntil: null }
      });
    }

    const token = signToken(member);
    const { passwordHash: _, ...memberData } = member;

    return res.json({
      success: true,
      data: { token, member: memberData },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
};

const me = async (req, res) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: req.user.id },
      include: { org: true },
    });

    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    const { passwordHash: _, ...memberData } = member;
    return res.json({ success: true, data: memberData });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
};

const join = async (req, res) => {
  try {
    const { inviteCode, firstName, lastName, email, password } = req.body;
    if (!inviteCode || !firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const org = await prisma.organization.findFirst({ where: { inviteCode: inviteCode.trim().toUpperCase() } });
    if (!org) return res.status(404).json({ success: false, error: 'Invalid invite code. Check with your chapter admin.' });

    const existing = await prisma.member.findFirst({ where: { email: email.toLowerCase().trim(), orgId: org.id } });
    if (existing) return res.status(409).json({ success: false, error: 'Email already registered in this chapter' });

    const passwordHash = await bcrypt.hash(password, 12);
    const member = await prisma.member.create({
      data: { orgId: org.id, email: email.toLowerCase().trim(), passwordHash, firstName, lastName, role: 'member' },
    });

    const token = signToken(member);
    const { passwordHash: _, ...memberData } = member;
    return res.status(201).json({ success: true, data: { token, member: memberData, org } });
  } catch (error) {
    console.error('Join error:', error);
    return res.status(500).json({ success: false, error: 'Failed to join chapter' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email required' });

    const member = await prisma.member.findFirst({ where: { email: email.toLowerCase().trim() } });
    if (!member) return res.json({ success: true, message: 'If that email exists, a reset link was sent.' });

    await prisma.passwordResetToken.updateMany({
      where: { memberId: member.id, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { memberId: member.id, token, expiresAt },
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    await sendEmail({
      to: member.email,
      subject: 'Reset your ChapterOS password',
      html: `<div style="font-family:Inter,sans-serif;max-width:500px;margin:0 auto;">
        <div style="background:#0F1C3F;padding:24px 32px;border-radius:12px 12px 0 0;">
          <h2 style="color:#C9A84C;margin:0;">ChapterOS</h2>
        </div>
        <div style="background:white;border:1px solid #E5E7EB;padding:32px;border-radius:0 0 12px 12px;">
          <p>Hi ${member.firstName}, click below to reset your password. Expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#0F1C3F;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600;">Reset Password</a>
        </div>
      </div>`,
    });

    return res.json({ success: true, message: 'If that email exists, a reset link was sent.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to process request' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ success: false, error: 'Token and password required' });
    if (password.length < 8) return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { token, used: false, expiresAt: { gt: new Date() } },
    });

    if (!resetToken) return res.status(400).json({ success: false, error: 'Invalid or expired reset link' });

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.member.update({ where: { id: resetToken.memberId }, data: { passwordHash, loginAttempts: 0, lockedUntil: null } });
    await prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { used: true } });

    return res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
};

module.exports = { register, login, me, join, forgotPassword, resetPassword };
