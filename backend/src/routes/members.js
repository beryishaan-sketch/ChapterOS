const express = require('express');
const router = express.Router();
const { getMembers, getMember, createMember, updateMember, deleteMember, getStats } = require('../controllers/memberController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

router.use(verifyToken);

router.get('/', getMembers);
router.get('/stats', getStats);
router.post('/invite', requireRole('admin', 'officer'), createMember); // alias
router.get('/:id', getMember);
router.post('/', requireRole('admin', 'officer'), createMember);
router.put('/:id', updateMember);
router.delete('/:id', requireRole('admin'), deleteMember);

module.exports = router;
router.patch('/:id', updateMember);
