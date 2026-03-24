const express = require('express');
const router = express.Router();
const { getPolls, createPoll, votePoll, deletePoll } = require('../controllers/pollsController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

router.use(verifyToken);
router.get('/', getPolls);
router.post('/', requireRole('admin', 'officer'), createPoll);
router.post('/:id/vote', votePoll);
router.delete('/:id', requireRole('admin', 'officer'), deletePoll);

module.exports = router;
