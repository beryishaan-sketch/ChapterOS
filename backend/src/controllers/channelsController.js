const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/channels — list all channels the member can access
const getChannels = async (req, res) => {
  try {
    const { orgId, id: memberId, role } = req.user;
    const all = await prisma.channel.findMany({
      where: { orgId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { messages: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { author: { select: { firstName: true, lastName: true } } }
        }
      }
    });

    // Filter by allowed roles
    const accessible = all.filter(ch => {
      if (ch.allowedRoles === 'all') return true;
      const allowed = ch.allowedRoles.split(',').map(r => r.trim());
      return allowed.includes(role);
    });

    return res.json({ success: true, data: accessible });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to fetch channels' });
  }
};

// POST /api/channels — create a channel (admin/officer only)
const createChannel = async (req, res) => {
  try {
    const { orgId } = req.user;
    const { name, description, emoji, allowedRoles = 'all' } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Channel name required' });

    const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');

    const channel = await prisma.channel.create({
      data: { orgId, name: slug, description, emoji, allowedRoles }
    });
    return res.status(201).json({ success: true, data: channel });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to create channel' });
  }
};

// PUT /api/channels/:id — update channel (admin only)
const updateChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const { orgId } = req.user;
    const { name, description, emoji, allowedRoles } = req.body;

    const channel = await prisma.channel.findFirst({ where: { id, orgId } });
    if (!channel) return res.status(404).json({ success: false, error: 'Channel not found' });

    const updated = await prisma.channel.update({
      where: { id },
      data: {
        ...(name && { name: name.toLowerCase().replace(/[^a-z0-9-]/g, '-') }),
        ...(description !== undefined && { description }),
        ...(emoji !== undefined && { emoji }),
        ...(allowedRoles !== undefined && { allowedRoles }),
      }
    });
    return res.json({ success: true, data: updated });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to update channel' });
  }
};

// DELETE /api/channels/:id (admin only)
const deleteChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const { orgId } = req.user;
    const channel = await prisma.channel.findFirst({ where: { id, orgId } });
    if (!channel) return res.status(404).json({ success: false, error: 'Not found' });
    await prisma.channel.delete({ where: { id } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to delete channel' });
  }
};

// GET /api/channels/:id/messages
const getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { orgId, role } = req.user;
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before; // cursor-based pagination

    const channel = await prisma.channel.findFirst({ where: { id, orgId } });
    if (!channel) return res.status(404).json({ success: false, error: 'Channel not found' });

    // Check access
    if (channel.allowedRoles !== 'all') {
      const allowed = channel.allowedRoles.split(',').map(r => r.trim());
      if (!allowed.includes(role)) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    const messages = await prisma.message.findMany({
      where: {
        channelId: id,
        ...(before && { createdAt: { lt: new Date(before) } })
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, role: true, position: true, avatarUrl: true }
        }
      }
    });

    return res.json({ success: true, data: messages.reverse() });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
};

// POST /api/channels/:id/messages
const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { orgId, id: memberId, role } = req.user;
    const { content, replyToId } = req.body;

    if (!content?.trim()) return res.status(400).json({ success: false, error: 'Message cannot be empty' });
    if (content.length > 4000) return res.status(400).json({ success: false, error: 'Message too long (max 4000 chars)' });

    const channel = await prisma.channel.findFirst({ where: { id, orgId } });
    if (!channel) return res.status(404).json({ success: false, error: 'Channel not found' });

    if (channel.allowedRoles !== 'all') {
      const allowed = channel.allowedRoles.split(',').map(r => r.trim());
      if (!allowed.includes(role)) return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const message = await prisma.message.create({
      data: { channelId: id, authorId: memberId, content: content.trim(), replyToId: replyToId || null },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true, position: true, avatarUrl: true } }
      }
    });

    return res.status(201).json({ success: true, data: message });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to send message' });
  }
};

// DELETE /api/channels/:channelId/messages/:messageId
const deleteMessage = async (req, res) => {
  try {
    const { channelId, messageId } = req.params;
    const { id: memberId, role, orgId } = req.user;

    const message = await prisma.message.findFirst({
      where: { id: messageId, channelId },
      include: { channel: true }
    });

    if (!message || message.channel.orgId !== orgId) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    // Only author or admin can delete
    if (message.authorId !== memberId && role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Cannot delete others\' messages' });
    }

    await prisma.message.delete({ where: { id: messageId } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to delete message' });
  }
};

module.exports = { getChannels, createChannel, updateChannel, deleteChannel, getMessages, sendMessage, deleteMessage };
