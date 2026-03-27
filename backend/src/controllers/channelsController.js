const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

// Helper: check if member can access channel
function canAccess(channel, memberId, role) {
  // Role check
  if (channel.allowedRoles !== 'all') {
    const allowed = channel.allowedRoles.split(',').map(r => r.trim());
    if (!allowed.includes(role)) return false;
  }
  // Specific member allow-list check
  if (channel.allowedMembers) {
    const allowed = channel.allowedMembers.split(',').map(id => id.trim());
    if (!allowed.includes(memberId)) return false;
  }
  return true;
}

// GET /api/channels
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

    const accessible = all.filter(ch => canAccess(ch, memberId, role));

    // Strip PIN hash from response, add isLocked flag
    const safe = accessible.map(ch => ({
      ...ch,
      pinHash: undefined,
      isLocked: !!ch.pinHash,
    }));

    return res.json({ success: true, data: safe });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to fetch channels' });
  }
};

// POST /api/channels
const createChannel = async (req, res) => {
  try {
    const { orgId, id: memberId, role } = req.user;
    const { name, description, emoji, allowedRoles = 'all', allowedMembers, pin, pinHint, type = 'public' } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Channel name required' });

    const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');

    let pinHash = null;
    let channelType = type;
    if (pin) {
      if (pin.length < 4) return res.status(400).json({ success: false, error: 'PIN must be at least 4 characters' });
      pinHash = await bcrypt.hash(pin, 10);
      channelType = 'locked';
    }

    const channel = await prisma.channel.create({
      data: {
        orgId, name: slug, description, emoji,
        allowedRoles,
        allowedMembers: allowedMembers || null,
        pinHash,
        pinHint: pinHint || null,
        type: channelType,
      }
    });

    return res.status(201).json({ success: true, data: { ...channel, pinHash: undefined, isLocked: !!pinHash } });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to create channel' });
  }
};

// PUT /api/channels/:id
const updateChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const { orgId } = req.user;
    const { name, description, emoji, allowedRoles, allowedMembers, pin, pinHint, removePin } = req.body;

    const channel = await prisma.channel.findFirst({ where: { id, orgId } });
    if (!channel) return res.status(404).json({ success: false, error: 'Channel not found' });

    const updates = {};
    if (name) updates.name = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (description !== undefined) updates.description = description;
    if (emoji !== undefined) updates.emoji = emoji;
    if (allowedRoles !== undefined) updates.allowedRoles = allowedRoles;
    if (allowedMembers !== undefined) updates.allowedMembers = allowedMembers || null;
    if (pinHint !== undefined) updates.pinHint = pinHint;

    if (removePin) {
      updates.pinHash = null;
      updates.type = 'public';
    } else if (pin) {
      updates.pinHash = await bcrypt.hash(pin, 10);
      updates.type = 'locked';
    }

    const updated = await prisma.channel.update({ where: { id }, data: updates });
    return res.json({ success: true, data: { ...updated, pinHash: undefined, isLocked: !!updated.pinHash } });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to update channel' });
  }
};

// DELETE /api/channels/:id
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

// POST /api/channels/:id/verify-pin — returns a session token for locked channel access
const verifyPin = async (req, res) => {
  try {
    const { id } = req.params;
    const { orgId, id: memberId, role } = req.user;
    const { pin } = req.body;

    const channel = await prisma.channel.findFirst({ where: { id, orgId } });
    if (!channel) return res.status(404).json({ success: false, error: 'Channel not found' });
    if (!channel.pinHash) return res.json({ success: true }); // not locked

    if (!pin) return res.status(400).json({ success: false, error: 'PIN required' });

    const valid = await bcrypt.compare(pin, channel.pinHash);
    if (!valid) return res.status(401).json({ success: false, error: 'Wrong PIN' });

    return res.json({ success: true, verified: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Verification failed' });
  }
};

// GET /api/channels/:id/messages
const getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { orgId, id: memberId, role } = req.user;
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before;

    const channel = await prisma.channel.findFirst({ where: { id, orgId } });
    if (!channel) return res.status(404).json({ success: false, error: 'Channel not found' });
    if (!canAccess(channel, memberId, role)) return res.status(403).json({ success: false, error: 'Access denied' });

    const messages = await prisma.message.findMany({
      where: { channelId: id, ...(before && { createdAt: { lt: new Date(before) } }) },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true, position: true, avatarUrl: true } }
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
    if (content.length > 4000) return res.status(400).json({ success: false, error: 'Message too long' });

    const channel = await prisma.channel.findFirst({ where: { id, orgId } });
    if (!channel) return res.status(404).json({ success: false, error: 'Channel not found' });
    if (!canAccess(channel, memberId, role)) return res.status(403).json({ success: false, error: 'Access denied' });

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

    if (!message || message.channel.orgId !== orgId) return res.status(404).json({ success: false, error: 'Not found' });
    if (message.authorId !== memberId && role !== 'admin') return res.status(403).json({ success: false, error: 'Cannot delete others\' messages' });

    await prisma.message.delete({ where: { id: messageId } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to delete message' });
  }
};

module.exports = { getChannels, createChannel, updateChannel, deleteChannel, getMessages, sendMessage, deleteMessage, verifyPin };
