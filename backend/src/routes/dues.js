const express = require('express');
const router = express.Router();
const { getDuesRecords, createDuesRecord, getDuesStatus, markPaid, sendReminders, sendSMSReminders } = require('../controllers/duesController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

router.use(verifyToken);

router.get('/', getDuesRecords);
router.post('/', requireRole('admin', 'officer'), createDuesRecord);
router.get('/status', getDuesStatus);
router.get('/fines', (req, res) => res.json({ success: true, data: [] }));
router.patch('/payments/:paymentId', requireRole('admin', 'officer'), markPaid);
router.post('/reminders', requireRole('admin', 'officer'), sendReminders);
router.post('/sms-reminders', requireRole('admin', 'officer'), sendSMSReminders);

// POST /dues/:id/payment — frontend marks payment on a specific payment row
router.post('/:id/payment', requireRole('admin', 'officer'), (req, res, next) => {
  req.params.paymentId = req.params.id;
  return markPaid(req, res, next);
});

// POST /dues/:id/reminder — send reminder to a single member
router.post('/:id/reminder', requireRole('admin', 'officer'), async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const { sendDuesReminder } = require('../utils/email');
    const prisma = new PrismaClient();
    const payment = await prisma.duesPayment.findFirst({
      where: { id: req.params.id, member: { orgId: req.user.orgId } },
      include: {
        member: { select: { email: true, firstName: true, lastName: true } },
        duesRecord: true,
      },
    });
    if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });
    const org = await prisma.organization.findUnique({ where: { id: req.user.orgId } });
    await sendDuesReminder({
      to: payment.member.email,
      memberName: `${payment.member.firstName} ${payment.member.lastName}`,
      amount: payment.amount,
      dueDate: payment.duesRecord?.dueDate,
      orgName: org.name,
    });
    return res.json({ success: true, data: { sent: 1 } });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to send reminder' });
  }
});

module.exports = router;
