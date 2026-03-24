const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { memberId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    const unread = notifications.filter(n => !n.read).length;
    return res.json({ success: true, data: { notifications, unread } });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
};

const markRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { memberId: req.user.id, id: req.params.id },
      data: { read: true },
    });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to mark read' });
  }
};

const markAllRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { memberId: req.user.id, read: false },
      data: { read: true },
    });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to mark all read' });
  }
};

// Internal helper — create notification for all org members
const createOrgNotification = async (orgId, type, title, body, link = null) => {
  try {
    const members = await prisma.member.findMany({ where: { orgId }, select: { id: true } });
    await prisma.notification.createMany({
      data: members.map(m => ({ orgId, memberId: m.id, type, title, body, link })),
    });
  } catch (e) {
    console.error('Notification error:', e);
  }
};

module.exports = { getNotifications, markRead, markAllRead, createOrgNotification };
