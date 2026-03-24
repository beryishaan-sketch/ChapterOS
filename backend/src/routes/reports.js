const express = require('express');
const router = express.Router();
const { verifyToken: auth } = require('../middleware/auth');
const { generateRoster, generateFinancial, generateAcademic, generateEvents, generateRisk, generateRecruitment } = require('../controllers/reportsController');

router.get('/roster', auth, generateRoster);
router.get('/financial', auth, generateFinancial);
router.get('/academic', auth, generateAcademic);
router.get('/events', auth, generateEvents);
router.get('/risk', auth, generateRisk);
router.get('/recruitment', auth, generateRecruitment);

module.exports = router;
