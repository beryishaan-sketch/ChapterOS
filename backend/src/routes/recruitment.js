const express = require('express');
const router = express.Router();
const { getPNMs, getPNM, createPNM, updatePNM, deletePNM, votePNM, updateStage } = require('../controllers/recruitmentController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.use(verifyToken);

router.get('/', getPNMs);

// GET /bid-results — vote tallies for all 'bid' stage PNMs (no individual breakdown)
router.get('/bid-results', async (req, res) => {
  try {
    const pnms = await prisma.pNM.findMany({
      where: { orgId: req.user.orgId, stage: 'bid' },
      include: {
        votes: { select: { score: true, memberId: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const results = {};
    const myVotes = {};

    for (const pnm of pnms) {
      let yes = 0, no = 0, abstain = 0;
      for (const v of pnm.votes) {
        if (v.score === 5) yes++;
        else if (v.score === 1) no++;
        else if (v.score === 3) abstain++;
        // Track current user's vote
        if (v.memberId === req.user.id) {
          myVotes[pnm.id] = v.score === 5 ? 'yes' : v.score === 1 ? 'no' : 'abstain';
        }
      }
      results[pnm.id] = { yes, no, abstain };
    }

    return res.json({ success: true, data: results, myVotes, closed: {} });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to fetch bid results' });
  }
});

router.get('/:id', getPNM);
router.post('/', createPNM);
router.put('/:id', updatePNM);
router.delete('/:id', requireRole('admin', 'officer'), deletePNM);
router.post('/:id/vote', votePNM);
router.patch('/:id/stage', updateStage);

// POST /:id/bid-vote — anonymous bid day vote (yes=5, no=1, abstain=3)
router.post('/:id/bid-vote', async (req, res) => {
  try {
    const { vote } = req.body;
    const scoreMap = { yes: 5, no: 1, abstain: 3 };
    if (!scoreMap[vote]) {
      return res.status(400).json({ success: false, error: 'vote must be yes, no, or abstain' });
    }

    const pnm = await prisma.pNM.findFirst({
      where: { id: req.params.id, orgId: req.user.orgId },
    });
    if (!pnm) return res.status(404).json({ success: false, error: 'PNM not found' });

    const score = scoreMap[vote];
    await prisma.pNMVote.upsert({
      where: { pnmId_memberId: { pnmId: req.params.id, memberId: req.user.id } },
      update: { score },
      create: { pnmId: req.params.id, memberId: req.user.id, score },
    });

    // Recalculate average
    const allVotes = await prisma.pNMVote.findMany({ where: { pnmId: req.params.id } });
    const avgScore = allVotes.reduce((sum, v) => sum + v.score, 0) / allVotes.length;
    await prisma.pNM.update({ where: { id: req.params.id }, data: { avgScore } });

    return res.json({ success: true, data: { vote, score } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to submit bid vote' });
  }
});

module.exports = router;
