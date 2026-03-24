const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { sendEmail } = require('../utils/email');

const prisma = new PrismaClient();

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
        orgId: org.id,
        email,
        passwordHash,
        firstName,
        lastName,
        role: 'admin',
        position: position || 'President',
      },
    });

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
      where: { email },
      include: { org: true },
    });

    if (!member) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, member.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
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
    console.error('Me error:', error);
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

    const existing = await prisma.member.findFirst({ where: { email, orgId: org.id } });
    if (existing) return res.status(409).json({ success: false, error: 'Email already registered in this chapter' });

    const passwordHash = await bcrypt.hash(password, 12);
    const member = await prisma.member.create({
      data: { orgId: org.id, email, passwordHash, firstName, lastName, role: 'member' },
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
    // Always return success to prevent email enumeration
    if (!member) return res.json({ success: true, message: 'If that email exists, a reset link was sent.' });

    // Invalidate old tokens
    await prisma.passwordResetToken.updateMany({
      where: { memberId: member.id, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { memberId: member.id, token, expiresAt },
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    await sendEmail({
      to: member.email,
      subject: 'Reset your ChapterOS password',
      html: `
        <div style="font-family:Inter,sans-serif;max-width:500px;margin:0 auto;">
          <div style="background:#0F1C3F;padding:24px 32px;border-radius:12px 12px 0 0;">
            <h2 style="color:#C9A84C;margin:0;font-size:20px;">ChapterOS</h2>
          </div>
          <div style="background:white;border:1px solid #E5E7EB;border-top:none;padding:32px;border-radius:0 0 12px 12px;">
            <h3 style="margin:0 0 12px;color:#111827;">Reset your password</h3>
            <p style="color:#4B5563;margin:0 0 24px;">Hi ${member.firstName}, click the button below to reset your password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" style="display:inline-block;background:#0F1C3F;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600;">Reset Password</a>
            <p style="color:#9CA3AF;font-size:12px;margin-top:24px;">If you didn't request this, ignore this email.</p>
          </div>
        </div>
      `,
    });

    return res.json({ success: true, message: 'If that email exists, a reset link was sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
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
    await prisma.member.update({ where: { id: resetToken.memberId }, data: { passwordHash } });
    await prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { used: true } });

    return res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
};

module.exports = { register, login, me, join, forgotPassword, resetPassword };
