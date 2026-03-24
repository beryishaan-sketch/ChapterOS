const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { getRiskItems, createRiskItem, markComplete, deleteRiskItem } = require('../controllers/riskController');

router.use(verifyToken);
router.get('/', getRiskItems);
router.post('/', requireRole('admin', 'officer'), createRiskItem);
router.post('/:id/complete', markComplete);
router.delete('/:id', requireRole('admin'), deleteRiskItem);
module.exports = router;
