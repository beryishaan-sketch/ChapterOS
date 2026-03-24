const express = require('express');
const router = express.Router();
const { preview, importMembers, importPNMs } = require('../controllers/importController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

router.use(verifyToken);
router.use(requireRole('admin', 'officer'));

router.post('/preview', preview);
router.post('/members', importMembers);
router.post('/pnms', importPNMs);

module.exports = router;
