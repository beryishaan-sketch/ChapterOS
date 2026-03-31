const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getStats = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const now = new Date();

    const [
      totalMembers,
      activePNMs,
      upcomingEvents,
      duesStats,
    ] = await Promise.all([
      prisma.member.count({ where: { orgId } }),
      prisma.pNM.count({ where: { orgId, stage: { notIn: ['pledged', 'dropped'] } } }),
      prisma.event.count({ where: { orgId, date: { gte: now } } }),
      prisma.duesPayment.aggregate({
        where: { member: { orgId } },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const allPayments = await prisma.duesPayment.findMany({
      where: { member: { orgId } },
      select: { amount: true, status: true, winterPayment: true, springPayment: true },
    });

    const totalDues = allPayments.reduce((s, p) => s + (p.amount || 0), 0);
    const collectedDues = allPayments.reduce((s, p) => {
      const wp = p.winterPayment || 0;
      const sp = p.springPayment || 0;
      if (wp + sp > 0) return s + wp + sp;
      if (p.status === 'paid') return s + (p.amount || 0);
      return s;
    }, 0);
    const duesRate = totalDues > 0 ? Math.round((collectedDues / totalDues) * 100) : 0;

    return res.json({
      success: true,
      data: {
        totalMembers,
        activePNMs,
        upcomingEvents,
        duesCollected: collectedDues,
        duesRate,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
};

const getActivity = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const limit = parseInt(req.query.limit) || 10;

    // Pull recent members, events, dues payments as activity feed
    const [recentMembers, recentEvents, recentPayments] = await Promise.all([
      prisma.member.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { firstName: true, lastName: true, createdAt: true, role: true },
      }),
      prisma.event.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { title: true, createdAt: true, type: true },
      }),
      prisma.duesPayment.findMany({
        where: { member: { orgId }, status: 'paid' },
        orderBy: { paidAt: 'desc' },
        take: 3,
        include: { member: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    const activity = [
      ...recentMembers.map(m => ({
        type: 'member_joined',
        message: `${m.firstName} ${m.lastName} joined as ${m.role}`,
        createdAt: m.createdAt,
      })),
      ...recentEvents.map(e => ({
        type: 'event_created',
        message: `Event "${e.title}" created`,
        createdAt: e.createdAt,
      })),
      ...recentPayments.map(p => ({
        type: 'dues_paid',
        message: `${p.member.firstName} ${p.member.lastName} paid dues`,
        createdAt: p.paidAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    return res.json({ success: true, data: activity });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to fetch activity' });
  }
};

module.exports = { getStats, getActivity };
