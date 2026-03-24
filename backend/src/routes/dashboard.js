const express = require('express');
const router = express.Router();
const { getStats, getActivity } = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);
router.get('/stats', getStats);
router.get('/activity', getActivity);

module.exports = router;
