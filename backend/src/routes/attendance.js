const express = require('express');
const router = express.Router();
const { getAttendance, checkIn, bulkCheckIn, getAttendanceReport } = require('../controllers/attendanceController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

router.use(verifyToken);

router.get('/', getAttendance);
router.get('/report', getAttendanceReport);
router.get('/history', getAttendanceReport); // alias
router.post('/checkin', checkIn);
router.post('/bulk', requireRole('admin', 'officer'), bulkCheckIn);

module.exports = router;
