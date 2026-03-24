const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { getSponsors, createSponsor, updateSponsor, deleteSponsor } = require('../controllers/sponsorsController');

router.use(verifyToken);
router.get('/', getSponsors);
router.post('/', requireRole('admin', 'officer'), createSponsor);
router.patch('/:id', requireRole('admin', 'officer'), updateSponsor);
router.delete('/:id', requireRole('admin'), deleteSponsor);
module.exports = router;
