const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { getNotifications, markRead, markAllRead } = require('../controllers/notificationsController');

router.use(verifyToken);
router.get('/', getNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);
module.exports = router;
