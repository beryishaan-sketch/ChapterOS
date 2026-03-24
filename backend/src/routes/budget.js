const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { getTransactions, createTransaction, deleteTransaction } = require('../controllers/budgetController');

router.use(verifyToken);
router.get('/', getTransactions);
router.post('/', requireRole('admin', 'officer'), createTransaction);
router.delete('/:id', requireRole('admin', 'officer'), deleteTransaction);
module.exports = router;
