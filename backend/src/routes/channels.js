const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const {
  getChannels, createChannel, updateChannel, deleteChannel,
  getMessages, sendMessage, deleteMessage
} = require('../controllers/channelsController');

router.use(requireAuth);

router.get('/', getChannels);
router.post('/', requireRole('admin', 'officer'), createChannel);
router.put('/:id', requireRole('admin'), updateChannel);
router.delete('/:id', requireRole('admin'), deleteChannel);

router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);
router.delete('/:channelId/messages/:messageId', deleteMessage);

module.exports = router;
