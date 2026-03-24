const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getTransactions = async (req, res) => {
  try {
    const { type, category, limit = 100 } = req.query;
    const where = { orgId: req.user.orgId };
    if (type) where.type = type;
    if (category) where.category = category;

    const transactions = await prisma.transaction.findMany({
      where,
      include: { createdBy: { select: { firstName: true, lastName: true } } },
      orderBy: { date: 'desc' },
      take: parseInt(limit),
    });

    // Summary
    const all = await prisma.transaction.findMany({ where: { orgId: req.user.orgId } });
    const income = all.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = all.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    return res.json({ success: true, data: { transactions, summary: { income, expenses, balance: income - expenses } } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
};

const createTransaction = async (req, res) => {
  try {
    const { type, amount, description, category, date } = req.body;
    if (!type || !amount || !description || !category) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const transaction = await prisma.transaction.create({
      data: {
        orgId: req.user.orgId,
        type,
        amount: parseFloat(amount),
        description,
        category,
        date: date ? new Date(date) : new Date(),
        createdById: req.user.id,
      },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    });
    return res.status(201).json({ success: true, data: transaction });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to create transaction' });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    await prisma.transaction.deleteMany({ where: { id: req.params.id, orgId: req.user.orgId } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to delete transaction' });
  }
};

module.exports = { getTransactions, createTransaction, deleteTransaction };
