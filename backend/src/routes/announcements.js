const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement, togglePin, deleteAnnouncement } = require('../controllers/announcementsController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { pushToOrg } = require('./push');

router.use(verifyToken);
router.get('/', getAnnouncements);
router.post('/', requireRole('admin', 'officer'), async (req, res, next) => {
  // Wrap createAnnouncement, then fire push notification after success
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    // Fire push async without blocking response
    if (data?.success && data?.data?.id) {
      pushToOrg(req.user.orgId, {
        title: `📢 ${data.data.title || 'New Announcement'}`,
        body: data.data.body?.slice(0, 100) || 'New announcement from your chapter',
        tag: 'announcement',
        url: '/announcements',
        icon: '/icon-192.png',
      }).catch(() => {});
    }
    return originalJson(data);
  };
  return createAnnouncement(req, res, next);
});
router.patch('/:id/pin', requireRole('admin'), togglePin);
router.delete('/:id', requireRole('admin'), deleteAnnouncement);

module.exports = router;
