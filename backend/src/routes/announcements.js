const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement, togglePin, deleteAnnouncement } = require('../controllers/announcementsController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { pushToOrg } = require('./push');

router.use(verifyToken);
router.get('/', getAnnouncements);
router.post('/', requireRole('admin', 'officer'), async (req, res, next) => {
  // Call the original handler first
  const originalJson = res.json.bind(res);
  res.json = async (data) => {
    // After successful creation, send push notification
    if (data?.success && data?.data?.id) {
      try {
        await pushToOrg(req.user.orgId, {
          title: `📢 ${data.data.title}`,
          body: data.data.body?.slice(0, 100) || 'New announcement from your chapter',
          tag: 'announcement',
          url: '/announcements',
          icon: '/icon-192.png',
        });
      } catch {}
    }
    return originalJson(data);
  };
  return createAnnouncement(req, res, next);
});
router.patch('/:id/pin', requireRole('admin'), togglePin);
router.delete('/:id', requireRole('admin'), deleteAnnouncement);

module.exports = router;
