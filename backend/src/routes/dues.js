const express = require('express');
const router = express.Router();
const { getDuesRecords, createDuesRecord, getDuesStatus, markPaid, sendReminders, sendSMSReminders } = require('../controllers/duesController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

router.use(verifyToken);

router.get('/', getDuesRecords);
router.post('/', requireRole('admin', 'officer'), createDuesRecord);
router.get('/status', getDuesStatus);
router.patch('/payments/:paymentId', requireRole('admin', 'officer'), markPaid);
router.post('/reminders', requireRole('admin', 'officer'), sendReminders);
router.post('/sms-reminders', requireRole('admin', 'officer'), sendSMSReminders);

module.exports = router;
