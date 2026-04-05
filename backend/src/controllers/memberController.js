const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getMembers = async (req, res) => {
  try {
    const members = await prisma.member.findMany({
      where: { orgId: req.user.orgId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, position: true, pledgeClass: true, year: true,
        major: true, phone: true, gpa: true, studyHours: true,
        points: true, onProbation: true, avatarUrl: true, createdAt: true,
      },
      orderBy: [{ role: 'asc' }, { lastName: 'asc' }],
    });
    return res.json({ success: true, data: members });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to fetch members' });
  }
};

const getMember = async (req, res) => {
  try {
    const member = await prisma.member.findFirst({
      where: { id: req.params.id, orgId: req.user.orgId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, position: true, pledgeClass: true, year: true,
        major: true, phone: true, gpa: true, studyHours: true,
        points: true, onProbation: true, avatarUrl: true, createdAt: true,
        attendances: { include: { event: true }, take: 10, orderBy: { event: { date: 'desc' } } },
        duesPayments: { include: { duesRecord: true } },
      },
    });
    if (!member) return res.status(404).json({ success: false, error: 'Member not found' });
    return res.json({ success: true, data: member });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to fetch member' });
  }
};

const createMember = async (req, res) => {
  try {
    const { email, firstName, lastName, role, position, pledgeClass, year, major, phone, gpa } = req.body;

    if (!email || !firstName || !lastName) {
      return res.status(400).json({ success: false, error: 'Email, first name, and last name are required' });
    }

    const existing = await prisma.member.findFirst({ where: { email, orgId: req.user.orgId } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Member with this email already exists' });
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const member = await prisma.member.create({
      data: {
        orgId: req.user.orgId,
        email, firstName, lastName,
        passwordHash,
        mustChangePassword: true,
        role: role || 'member',
        position, pledgeClass, year, major, phone,
        gpa: gpa ? parseFloat(gpa) : null,
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, position: true, pledgeClass: true, year: true,
        major: true, phone: true, gpa: true, createdAt: true,
      },
    });

    return res.status(201).json({ success: true, data: { member, tempPassword } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to create member' });
  }
};

const updateMember = async (req, res) => {
  try {
    const isSelf = req.params.id === req.user.id;
    const isAdmin = ['admin', 'officer'].includes(req.user.role);
    // Members can only update their own safe fields
    const selfAllowed = ['firstName', 'lastName', 'phone', 'major', 'year', 'pledgeClass', 'position', 'avatarUrl'];
    const adminAllowed = [...selfAllowed, 'role', 'gpa', 'studyHours', 'points', 'onProbation'];
    const allowed = isAdmin ? adminAllowed : selfAllowed;
    if (!isAdmin && !isSelf) return res.status(403).json({ success: false, error: 'Cannot edit another member' });
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = key === 'gpa' ? parseFloat(req.body[key]) : req.body[key];
      }
    }

    const member = await prisma.member.updateMany({
      where: { id: req.params.id, orgId: req.user.orgId },
      data: updates,
    });

    if (member.count === 0) return res.status(404).json({ success: false, error: 'Member not found' });

    const updated = await prisma.member.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, position: true, pledgeClass: true, year: true,
        major: true, phone: true, gpa: true, studyHours: true,
        points: true, onProbation: true, avatarUrl: true, createdAt: true,
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to update member' });
  }
};

const deleteMember = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
    }
    await prisma.member.deleteMany({ where: { id: req.params.id, orgId: req.user.orgId } });
    return res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to delete member' });
  }
};

const getStats = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const [totalMembers, activeMembers, onProbation, totalPoints] = await Promise.all([
      prisma.member.count({ where: { orgId } }),
      prisma.member.count({ where: { orgId, role: { not: 'alumni' } } }),
      prisma.member.count({ where: { orgId, onProbation: true } }),
      prisma.member.aggregate({ where: { orgId }, _sum: { points: true } }),
    ]);
    return res.json({ success: true, data: { totalMembers, activeMembers, onProbation, totalPoints: totalPoints._sum.points || 0 } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
};

module.exports = { getMembers, getMember, createMember, updateMember, deleteMember, getStats };
