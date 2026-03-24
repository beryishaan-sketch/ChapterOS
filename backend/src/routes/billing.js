const express = require('express');
const router = express.Router();
const { getPlans, getBillingInfo, createCheckout, createPortal, handleWebhook } = require('../controllers/billingController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// Webhook needs raw body
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

router.use(verifyToken);

router.get('/plans', getPlans);
router.get('/info', getBillingInfo);
router.get('/current', getBillingInfo);  // alias
router.get('/invoices', (req, res) => res.json({ success: true, data: [] })); // stub until Stripe active
router.post('/checkout', requireRole('admin'), createCheckout);
router.post('/portal', requireRole('admin'), createPortal);

module.exports = router;
