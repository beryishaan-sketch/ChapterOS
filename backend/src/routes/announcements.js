const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement, togglePin, deleteAnnouncement } = require('../controllers/announcementsController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

router.use(verifyToken);
router.get('/', getAnnouncements);
router.post('/', requireRole('admin', 'officer'), createAnnouncement);
router.patch('/:id/pin', requireRole('admin'), togglePin);
router.delete('/:id', requireRole('admin'), deleteAnnouncement);

module.exports = router;
