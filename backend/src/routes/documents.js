const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { getDocuments, createDocument, deleteDocument } = require('../controllers/documentsController');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../../uploads'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB

router.use(verifyToken);
router.get('/', getDocuments);
router.post('/', requireRole('admin', 'officer'), upload.single('file'), createDocument);
router.delete('/:id', requireRole('admin', 'officer'), deleteDocument);
module.exports = router;
