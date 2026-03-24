const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getRiskItems = async (req, res) => {
  try {
    const items = await prisma.riskItem.findMany({
      where: { orgId: req.user.orgId },
      include: {
        completions: {
          include: { member: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalMembers = await prisma.member.count({
      where: { orgId: req.user.orgId, role: { not: 'alumni' } },
    });

    return res.json({ success: true, data: { items, totalMembers } });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to fetch risk items' });
  }
};

const createRiskItem = async (req, res) => {
  try {
    const { title, description, required, dueDate } = req.body;
    const item = await prisma.riskItem.create({
      data: {
        orgId: req.user.orgId,
        title,
        description,
        required: required !== false,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });
    return res.status(201).json({ success: true, data: item });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to create risk item' });
  }
};

const markComplete = async (req, res) => {
  try {
    const { memberId } = req.body;
    const targetId = memberId || req.user.id;
    const completion = await prisma.riskCompletion.upsert({
      where: { riskItemId_memberId: { riskItemId: req.params.id, memberId: targetId } },
      update: { completedAt: new Date() },
      create: { riskItemId: req.params.id, memberId: targetId },
    });
    return res.json({ success: true, data: completion });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to mark complete' });
  }
};

const deleteRiskItem = async (req, res) => {
  try {
    await prisma.riskCompletion.deleteMany({ where: { riskItemId: req.params.id } });
    await prisma.riskItem.deleteMany({ where: { id: req.params.id, orgId: req.user.orgId } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to delete' });
  }
};

module.exports = { getRiskItems, createRiskItem, markComplete, deleteRiskItem };
