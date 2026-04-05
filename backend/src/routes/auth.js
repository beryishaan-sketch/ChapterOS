const express = require('express');
const router = express.Router();
const { register, login, me, join, forgotPassword, resetPassword } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/register', register);
router.post('/join', join);
router.post('/login', login);
router.get('/me', verifyToken, me);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
// Notification preferences (stub — returns empty prefs)
router.get('/me/notifications', verifyToken, (req, res) => {
  res.json({ success: true, data: { emailDues: true, emailEvents: true, emailRecruitment: false, emailAnnouncements: true } });
});
router.put('/me/notifications', verifyToken, (req, res) => {
  res.json({ success: true, data: req.body });
});
router.patch('/me/notifications', verifyToken, (req, res) => {
  res.json({ success: true, data: req.body });
});

module.exports = router;
