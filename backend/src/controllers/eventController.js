const { PrismaClient } = require('@prisma/client');
const { generateEventQRCode } = require('../utils/qrcode');
const { createOrgNotification } = require('./notificationsController');

const prisma = new PrismaClient();

const getEvents = async (req, res) => {
  try {
    const { upcoming, type, search, limit } = req.query;
    const where = { orgId: req.user.orgId };
    if (type) where.type = type;
    if (upcoming === 'true') where.date = { gte: new Date() };
    if (upcoming === 'false') where.date = { lt: new Date() };
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const events = await prisma.event.findMany({
      where,
      include: {
        _count: { select: { guestLists: true, attendances: true } },
      },
      orderBy: { date: upcoming === 'false' ? 'desc' : 'asc' },
      take: limit ? parseInt(limit) : undefined,
    });

    return res.json({ success: true, data: events });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to fetch events' });
  }
};

const getEvent = async (req, res) => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, orgId: req.user.orgId },
      include: {
        guestLists: {
          include: { member: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
        },
        attendances: {
          include: { member: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
        },
        _count: { select: { guestLists: true, attendances: true } },
      },
    });
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    return res.json({ success: true, data: event });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to fetch event' });
  }
};

const createEvent = async (req, res) => {
  try {
    const { title, type, date, location, description, guestCapPerMember, totalCapacity, requiresWaiver } = req.body;
    if (!title || !type || !date) {
      return res.status(400).json({ success: false, error: 'Title, type, and date are required' });
    }

    const event = await prisma.event.create({
      data: {
        orgId: req.user.orgId,
        title, type,
        date: new Date(date),
        location, description,
        guestCapPerMember: guestCapPerMember ? parseInt(guestCapPerMember) : 2,
        totalCapacity: totalCapacity ? parseInt(totalCapacity) : null,
        requiresWaiver: requiresWaiver || false,
      },
    });

    // Generate QR code
    const qrResult = await generateEventQRCode(event.id);
    if (qrResult.success) {
      await prisma.event.update({ where: { id: event.id }, data: { qrCode: qrResult.dataUrl } });
      event.qrCode = qrResult.dataUrl;
    }

    // Create attendance records for all active members
    const members = await prisma.member.findMany({
      where: { orgId: req.user.orgId, role: { not: 'alumni' } },
      select: { id: true },
    });

    if (members.length > 0) {
      await prisma.attendance.createMany({
        data: members.map(m => ({ memberId: m.id, eventId: event.id })),
        skipDuplicates: true,
      });
    }

    // Notify all members
    const eventDate = new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    createOrgNotification(req.user.orgId, 'event', `New Event: ${title}`, `${eventDate}${location ? ` · ${location}` : ''}`, '/events').catch(() => {});

    return res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to create event' });
  }
};

const updateEvent = async (req, res) => {
  try {
    const allowed = ['title', 'type', 'date', 'location', 'description', 'guestCapPerMember', 'totalCapacity', 'requiresWaiver'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'date') updates[key] = new Date(req.body[key]);
        else if (['guestCapPerMember', 'totalCapacity'].includes(key)) updates[key] = parseInt(req.body[key]);
        else updates[key] = req.body[key];
      }
    }

    const result = await prisma.event.updateMany({
      where: { id: req.params.id, orgId: req.user.orgId },
      data: updates,
    });

    if (result.count === 0) return res.status(404).json({ success: false, error: 'Event not found' });
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    return res.json({ success: true, data: event });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to update event' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    await prisma.event.deleteMany({ where: { id: req.params.id, orgId: req.user.orgId } });
    return res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to delete event' });
  }
};

const submitGuest = async (req, res) => {
  try {
    const { guestName, guestContact } = req.body;
    if (!guestName) return res.status(400).json({ success: false, error: 'Guest name required' });

    const event = await prisma.event.findFirst({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });

    const existingGuests = await prisma.guestList.count({
      where: { eventId: req.params.id, memberId: req.user.id },
    });

    if (existingGuests >= event.guestCapPerMember) {
      return res.status(400).json({ success: false, error: `Guest limit of ${event.guestCapPerMember} reached` });
    }

    const guest = await prisma.guestList.create({
      data: {
        eventId: req.params.id,
        memberId: req.user.id,
        guestName, guestContact,
        status: 'pending',
      },
      include: { member: { select: { firstName: true, lastName: true } } },
    });

    return res.status(201).json({ success: true, data: guest });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to submit guest' });
  }
};

const updateGuestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'denied'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const guest = await prisma.guestList.update({
      where: { id: req.params.guestId },
      data: { status },
    });
    return res.json({ success: true, data: guest });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to update guest status' });
  }
};

module.exports = { getEvents, getEvent, createEvent, updateEvent, deleteEvent, submitGuest, updateGuestStatus };
