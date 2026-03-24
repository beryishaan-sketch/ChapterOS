const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createOrgNotification } = require('./notificationsController');

const getAnnouncements = async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { orgId: req.user.orgId },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true, position: true } },
      },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    });
    return res.json({ success: true, data: announcements });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to fetch announcements' });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, body, pinned } = req.body;
    if (!title || !body) return res.status(400).json({ success: false, error: 'Title and body are required' });
    const ann = await prisma.announcement.create({
      data: { orgId: req.user.orgId, authorId: req.user.id, title, body, pinned: !!pinned },
      include: { author: { select: { id: true, firstName: true, lastName: true, role: true } } },
    });
    // Fire notification to all members
    createOrgNotification(req.user.orgId, 'announcement', title, body.slice(0, 120), '/announcements').catch(() => {});
    return res.status(201).json({ success: true, data: ann });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to create announcement' });
  }
};

const togglePin = async (req, res) => {
  try {
    const ann = await prisma.announcement.findFirst({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!ann) return res.status(404).json({ success: false, error: 'Not found' });
    const updated = await prisma.announcement.update({ where: { id: req.params.id }, data: { pinned: !ann.pinned } });
    return res.json({ success: true, data: updated });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to update' });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    await prisma.announcement.deleteMany({ where: { id: req.params.id, orgId: req.user.orgId } });
    return res.json({ success: true, data: { deleted: true } });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to delete' });
  }
};

module.exports = { getAnnouncements, createAnnouncement, togglePin, deleteAnnouncement };
