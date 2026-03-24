const { PrismaClient } = require('@prisma/client');
const { createOrgNotification } = require('./notificationsController');
const prisma = new PrismaClient();

const getPolls = async (req, res) => {
  try {
    const polls = await prisma.poll.findMany({
      where: { orgId: req.user.orgId },
      include: {
        votes: { select: { memberId: true, optionIndex: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = polls.map(p => {
      const options = p.options.map((opt, i) => ({
        ...opt,
        votes: p.votes.filter(v => v.optionIndex === i).length,
      }));
      const userVote = p.votes.find(v => v.memberId === req.user.id);
      return {
        id: p.id,
        question: p.question,
        options,
        createdAt: p.createdAt,
        expiresAt: p.expiresAt,
        totalVotes: p.votes.length,
        userVote: userVote ? userVote.optionIndex : undefined,
        expired: new Date(p.expiresAt) < new Date(),
      };
    });

    return res.json({ success: true, data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to fetch polls' });
  }
};

const createPoll = async (req, res) => {
  try {
    const { question, options, expiresInHours = 72 } = req.body;
    if (!question || !options || options.length < 2) {
      return res.status(400).json({ success: false, error: 'Question and at least 2 options required' });
    }

    const poll = await prisma.poll.create({
      data: {
        orgId: req.user.orgId,
        authorId: req.user.id,
        question,
        options: options.map(label => ({ label })),
        expiresAt: new Date(Date.now() + expiresInHours * 3600000),
      },
    });

    // Notify all members
    createOrgNotification(req.user.orgId, 'poll', `New Poll: ${question.slice(0, 60)}`, 'Cast your vote now', '/polls').catch(() => {});

    return res.status(201).json({
      success: true,
      data: {
        id: poll.id,
        question: poll.question,
        options: options.map(label => ({ label, votes: 0 })),
        createdAt: poll.createdAt,
        expiresAt: poll.expiresAt,
        totalVotes: 0,
        userVote: undefined,
        expired: false,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to create poll' });
  }
};

const votePoll = async (req, res) => {
  try {
    const poll = await prisma.poll.findFirst({
      where: { id: req.params.id, orgId: req.user.orgId },
      include: { votes: { select: { memberId: true, optionIndex: true } } },
    });
    if (!poll) return res.status(404).json({ success: false, error: 'Poll not found' });

    const alreadyVoted = poll.votes.find(v => v.memberId === req.user.id);
    if (alreadyVoted) return res.status(400).json({ success: false, error: 'Already voted' });
    if (new Date(poll.expiresAt) < new Date()) return res.status(400).json({ success: false, error: 'Poll has expired' });

    const { optionIndex } = req.body;
    const opts = poll.options;
    if (optionIndex < 0 || optionIndex >= opts.length) {
      return res.status(400).json({ success: false, error: 'Invalid option' });
    }

    await prisma.pollVote.create({
      data: { pollId: poll.id, memberId: req.user.id, optionIndex },
    });

    // Rebuild with updated votes
    const allVotes = [...poll.votes, { memberId: req.user.id, optionIndex }];
    const options = opts.map((opt, i) => ({
      ...opt,
      votes: allVotes.filter(v => v.optionIndex === i).length,
    }));

    return res.json({
      success: true,
      data: {
        id: poll.id,
        question: poll.question,
        options,
        createdAt: poll.createdAt,
        expiresAt: poll.expiresAt,
        totalVotes: allVotes.length,
        userVote: optionIndex,
        expired: false,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to submit vote' });
  }
};

const deletePoll = async (req, res) => {
  try {
    await prisma.poll.deleteMany({ where: { id: req.params.id, orgId: req.user.orgId } });
    return res.json({ success: true, data: { deleted: true } });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to delete poll' });
  }
};

module.exports = { getPolls, createPoll, votePoll, deletePoll };
