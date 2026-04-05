const express = require('express');
const router = express.Router();
const { getEvents, getEvent, createEvent, updateEvent, deleteEvent, submitGuest, updateGuestStatus } = require('../controllers/eventController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

router.use(verifyToken);

router.get('/', getEvents);
router.get('/:id', getEvent);
router.post('/', requireRole('admin', 'officer'), createEvent);
router.put('/:id', requireRole('admin', 'officer'), updateEvent);
router.patch('/:id', requireRole('admin', 'officer'), updateEvent);
router.delete('/:id', requireRole('admin'), deleteEvent);
// GET /events/:id/guests — all guests for an event (admin/officer)
router.get('/:id/guests', requireRole('admin', 'officer'), async (req, res) => {
  try {
    const guests = await prismaAtt.guestList.findMany({
      where: { eventId: req.params.id, event: { orgId: req.user.orgId } },
      include: { member: { select: { firstName: true, lastName: true } } },
      orderBy: { id: 'asc' },
    });
    return res.json({ success: true, data: guests.map(g => ({
      ...g,
      name: g.guestName,
      contact: g.guestContact,
      submittedBy: `${g.member?.firstName || ''} ${g.member?.lastName || ''}`.trim(),
    })) });
  } catch (e) { return res.status(500).json({ success: false, error: 'Failed to fetch guests' }); }
});

// GET /events/:id/guests/mine — current member's guests
router.get('/:id/guests/mine', async (req, res) => {
  try {
    const guests = await prismaAtt.guestList.findMany({
      where: { eventId: req.params.id, memberId: req.user.id },
      orderBy: { id: 'asc' },
    });
    return res.json({ success: true, data: guests.map(g => ({
      ...g,
      name: g.guestName,
      contact: g.guestContact,
    })) });
  } catch (e) { return res.status(500).json({ success: false, error: 'Failed to fetch guests' }); }
});

router.post('/:id/guests', submitGuest);
router.patch('/:id/guests/:guestId', requireRole('admin', 'officer'), updateGuestStatus);

// Meeting minutes — both PUT (legacy) and PATCH
const saveMinutesHandler = async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.event.updateMany({
      where: { id: req.params.id, orgId: req.user.orgId },
      data: { minutes: req.body.minutes },
    });
    return res.json({ success: true });
  } catch (e) { return res.status(500).json({ success: false, error: 'Failed to save minutes' }); }
};
router.put('/:id/minutes', requireRole('admin', 'officer'), saveMinutesHandler);
router.patch('/:id/minutes', requireRole('admin', 'officer'), saveMinutesHandler);

// Attendance sub-routes used by Attendance.jsx
const { PrismaClient: PrismaAtt } = require('@prisma/client');
const prismaAtt = new PrismaAtt();

// GET /events/:id/attendance — returns [{memberId, attended}] for each recorded member
router.get('/:id/attendance', async (req, res) => {
  try {
    const records = await prismaAtt.attendance.findMany({
      where: { eventId: req.params.id, event: { orgId: req.user.orgId } },
      select: { memberId: true, checkedIn: true },
    });
    return res.json({ success: true, data: records.map(r => ({ memberId: r.memberId, attended: r.checkedIn })) });
  } catch (e) { return res.status(500).json({ success: false, error: 'Failed to fetch attendance' }); }
});

// POST /events/:id/attendance — toggle a member's attendance
router.post('/:id/attendance', requireRole('admin', 'officer'), async (req, res) => {
  try {
    const { memberId, attended } = req.body;
    if (!memberId) return res.status(400).json({ success: false, error: 'memberId required' });
    const event = await prismaAtt.event.findFirst({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    await prismaAtt.attendance.upsert({
      where: { memberId_eventId: { memberId, eventId: req.params.id } },
      update: { checkedIn: attended },
      create: { memberId, eventId: req.params.id, checkedIn: attended },
    });
    return res.json({ success: true, data: { memberId, attended } });
  } catch (e) { return res.status(500).json({ success: false, error: 'Failed to update attendance' }); }
});

// iCal export
router.get('/:id/ical', verifyToken, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const event = await prisma.event.findFirst({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!event) return res.status(404).send('Not found');
    const start = new Date(event.date);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const fmt = d => d.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z';
    const ical = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ChapterHQ//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@chapteros`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${event.title}`,
      `LOCATION:${event.location || ''}`,
      `DESCRIPTION:${(event.description || '').replace(/\n/g,'\\n')}`,
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename="${event.title.replace(/\s+/g,'-')}.ics"`);
    return res.send(ical);
  } catch (e) { return res.status(500).send('Error'); }
});

module.exports = router;
