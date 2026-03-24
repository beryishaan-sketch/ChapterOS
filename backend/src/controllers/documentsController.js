const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const prisma = new PrismaClient();

const UPLOAD_DIR = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const getDocuments = async (req, res) => {
  try {
    const { category } = req.query;
    const where = { orgId: req.user.orgId };
    if (category) where.category = category;
    const docs = await prisma.document.findMany({ where, orderBy: { createdAt: 'desc' } });
    return res.json({ success: true, data: docs });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to fetch documents' });
  }
};

const createDocument = async (req, res) => {
  try {
    const { title, category, url } = req.body;
    let fileUrl = url;

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
    }

    if (!title || !category || !fileUrl) {
      return res.status(400).json({ success: false, error: 'Title, category, and file/URL required' });
    }

    const doc = await prisma.document.create({
      data: { orgId: req.user.orgId, title, category, url: fileUrl },
    });
    return res.status(201).json({ success: true, data: doc });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to create document' });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const doc = await prisma.document.findFirst({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
    // Remove local file if stored on server
    if (doc.url?.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../../../', doc.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await prisma.document.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to delete document' });
  }
};

module.exports = { getDocuments, createDocument, deleteDocument };
