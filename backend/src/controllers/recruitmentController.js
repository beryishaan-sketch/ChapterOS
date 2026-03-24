const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getPNMs = async (req, res) => {
  try {
    const { stage, search } = req.query;
    const where = { orgId: req.user.orgId };
    if (stage) where.stage = stage;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { major: { contains: search, mode: 'insensitive' } },
      ];
    }

    const pnms = await prisma.pNM.findMany({
      where,
      include: {
        votes: { include: { member: { select: { id: true, firstName: true, lastName: true } } } },
        _count: { select: { eventAttendances: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: pnms });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to fetch PNMs' });
  }
};

const getPNM = async (req, res) => {
  try {
    const pnm = await prisma.pNM.findFirst({
      where: { id: req.params.id, orgId: req.user.orgId },
      include: {
        votes: { include: { member: { select: { id: true, firstName: true, lastName: true } } } },
        eventAttendances: { include: { event: true } },
      },
    });
    if (!pnm) return res.status(404).json({ success: false, error: 'PNM not found' });
    return res.json({ success: true, data: pnm });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to fetch PNM' });
  }
};

const createPNM = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, year, major, mutualConnections, notes, stage } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ success: false, error: 'First and last name are required' });
    }

    const pnm = await prisma.pNM.create({
      data: {
        orgId: req.user.orgId,
        firstName, lastName, email, phone, year, major,
        mutualConnections, notes,
        stage: stage || 'invited',
      },
    });

    return res.status(201).json({ success: true, data: pnm });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to create PNM' });
  }
};

const updatePNM = async (req, res) => {
  try {
    const allowed = ['firstName', 'lastName', 'email', 'phone', 'year', 'major', 'mutualConnections', 'notes', 'stage'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const result = await prisma.pNM.updateMany({
      where: { id: req.params.id, orgId: req.user.orgId },
      data: updates,
    });

    if (result.count === 0) return res.status(404).json({ success: false, error: 'PNM not found' });

    const pnm = await prisma.pNM.findUnique({ where: { id: req.params.id } });
    return res.json({ success: true, data: pnm });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to update PNM' });
  }
};

const deletePNM = async (req, res) => {
  try {
    await prisma.pNM.deleteMany({ where: { id: req.params.id, orgId: req.user.orgId } });
    return res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to delete PNM' });
  }
};

const votePNM = async (req, res) => {
  try {
    const { score, notes } = req.body;
    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ success: false, error: 'Score must be between 1 and 5' });
    }

    const pnm = await prisma.pNM.findFirst({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!pnm) return res.status(404).json({ success: false, error: 'PNM not found' });

    const vote = await prisma.pNMVote.upsert({
      where: { pnmId_memberId: { pnmId: req.params.id, memberId: req.user.id } },
      update: { score: parseInt(score), notes },
      create: { pnmId: req.params.id, memberId: req.user.id, score: parseInt(score), notes },
    });

    // Recalculate average score
    const allVotes = await prisma.pNMVote.findMany({ where: { pnmId: req.params.id } });
    const avgScore = allVotes.reduce((sum, v) => sum + v.score, 0) / allVotes.length;

    await prisma.pNM.update({ where: { id: req.params.id }, data: { avgScore } });

    return res.json({ success: true, data: { vote, avgScore } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to submit vote' });
  }
};

const updateStage = async (req, res) => {
  try {
    const { stage } = req.body;
    const validStages = ['invited', 'met', 'liked', 'bid', 'pledged', 'dropped'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ success: false, error: 'Invalid stage' });
    }

    const result = await prisma.pNM.updateMany({
      where: { id: req.params.id, orgId: req.user.orgId },
      data: { stage },
    });

    if (result.count === 0) return res.status(404).json({ success: false, error: 'PNM not found' });
    const pnm = await prisma.pNM.findUnique({ where: { id: req.params.id } });
    return res.json({ success: true, data: pnm });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to update stage' });
  }
};

module.exports = { getPNMs, getPNM, createPNM, updatePNM, deletePNM, votePNM, updateStage };
