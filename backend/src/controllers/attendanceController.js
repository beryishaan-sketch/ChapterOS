const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAttendance = async (req, res) => {
  try {
    const { eventId } = req.query;
    const where = { event: { orgId: req.user.orgId } };
    if (eventId) where.eventId = eventId;

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        member: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, pledgeClass: true } },
        event: { select: { id: true, title: true, date: true, type: true } },
      },
      orderBy: { event: { date: 'desc' } },
    });

    return res.json({ success: true, data: attendance });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to fetch attendance' });
  }
};

const checkIn = async (req, res) => {
  try {
    const { eventId, memberId } = req.body;
    const targetMemberId = memberId || req.user.id;

    const event = await prisma.event.findFirst({
      where: { id: eventId, orgId: req.user.orgId },
    });
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });

    const attendance = await prisma.attendance.upsert({
      where: { memberId_eventId: { memberId: targetMemberId, eventId } },
      update: { checkedIn: true, checkedInAt: new Date() },
      create: { memberId: targetMemberId, eventId, checkedIn: true, checkedInAt: new Date() },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
        event: { select: { id: true, title: true } },
      },
    });

    // Award points
    await prisma.member.update({
      where: { id: targetMemberId },
      data: { points: { increment: 10 } },
    });

    return res.json({ success: true, data: attendance });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to check in' });
  }
};

const bulkCheckIn = async (req, res) => {
  try {
    const { eventId, memberIds, checkIn: shouldCheckIn = true } = req.body;

    const event = await prisma.event.findFirst({ where: { id: eventId, orgId: req.user.orgId } });
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });

    const results = await Promise.all(
      memberIds.map(memberId =>
        prisma.attendance.upsert({
          where: { memberId_eventId: { memberId, eventId } },
          update: { checkedIn: shouldCheckIn, checkedInAt: shouldCheckIn ? new Date() : null },
          create: { memberId, eventId, checkedIn: shouldCheckIn, checkedInAt: shouldCheckIn ? new Date() : null },
        })
      )
    );

    return res.json({ success: true, data: { updated: results.length } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to bulk check in' });
  }
};

const getAttendanceReport = async (req, res) => {
  try {
    const members = await prisma.member.findMany({
      where: { orgId: req.user.orgId },
      select: {
        id: true, firstName: true, lastName: true,
        attendances: {
          where: { event: { orgId: req.user.orgId } },
          include: { event: { select: { id: true, title: true, date: true, type: true } } },
        },
      },
    });

    const events = await prisma.event.findMany({
      where: { orgId: req.user.orgId },
      select: { id: true, title: true, date: true, type: true },
      orderBy: { date: 'asc' },
    });

    const report = members.map(m => ({
      member: { id: m.id, firstName: m.firstName, lastName: m.lastName },
      totalEvents: events.length,
      attendedEvents: m.attendances.filter(a => a.checkedIn).length,
      attendanceRate: events.length > 0 ? (m.attendances.filter(a => a.checkedIn).length / events.length * 100).toFixed(1) : 0,
      attendances: m.attendances,
    }));

    return res.json({ success: true, data: { report, events } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
};

module.exports = { getAttendance, checkIn, bulkCheckIn, getAttendanceReport };
