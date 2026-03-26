const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');

const prisma = new PrismaClient();
router.use(verifyToken);

// GET /api/analytics — chapter analytics summary
router.get('/', async (req, res) => {
  try {
    const { orgId } = req.user;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      members,
      events,
      duesRecords,
      recentTransactions,
      pnms,
      riskItems,
      riskCompletions,
    ] = await Promise.all([
      prisma.member.findMany({ where: { orgId }, select: { id: true, role: true, gpa: true, points: true, onProbation: true, createdAt: true } }),
      prisma.event.findMany({ where: { orgId }, include: { attendances: true }, orderBy: { date: 'desc' }, take: 20 }),
      prisma.duesRecord.findMany({ where: { orgId }, include: { payments: true }, orderBy: { createdAt: 'desc' }, take: 3 }),
      prisma.transaction.findMany({ where: { orgId, createdAt: { gte: thirtyDaysAgo } }, select: { type: true, amount: true, createdAt: true } }),
      prisma.pNM.findMany({ where: { orgId }, select: { stage: true, createdAt: true } }),
      prisma.riskItem.findMany({ where: { orgId }, include: { completions: true } }),
      prisma.riskCompletion.count({ where: { riskItem: { orgId } } }),
    ]);

    const activeMembers = members.filter(m => m.role !== 'alumni');

    // Dues collection rate
    let duesRate = 0;
    let duesCollected = 0;
    let duesOwed = 0;
    if (duesRecords.length > 0) {
      const latest = duesRecords[0];
      const paid = latest.payments.filter(p => p.status === 'paid').length;
      duesCollected = latest.payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
      duesOwed = latest.payments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0);
      duesRate = activeMembers.length > 0 ? Math.round((paid / activeMembers.length) * 100) : 0;
    }

    // Chapter GPA
    const gpas = members.filter(m => m.gpa).map(m => m.gpa);
    const avgGpa = gpas.length > 0 ? (gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2) : null;

    // Event attendance rate (last 10 events)
    const recentEvents = events.slice(0, 10);
    const totalPossible = recentEvents.reduce((s, e) => s + activeMembers.length, 0);
    const totalAttended = recentEvents.reduce((s, e) => s + e.attendances.filter(a => a.checkedIn).length, 0);
    const attendanceRate = totalPossible > 0 ? Math.round((totalAttended / totalPossible) * 100) : 0;

    // Risk compliance
    const totalRequired = riskItems.filter(r => r.required).length;
    const totalCompleted = riskItems.filter(r => r.required).reduce((s, r) => s + r.completions.length, 0);
    const riskRate = totalRequired > 0 && activeMembers.length > 0
      ? Math.round((totalCompleted / (totalRequired * activeMembers.length)) * 100) : 0;

    // Recruitment funnel
    const pnmFunnel = {
      invited: pnms.filter(p => p.stage === 'invited').length,
      met: pnms.filter(p => p.stage === 'met').length,
      liked: pnms.filter(p => p.stage === 'liked').length,
      bid: pnms.filter(p => p.stage === 'bid').length,
      pledged: pnms.filter(p => p.stage === 'pledged').length,
    };

    // Chapter health score (0-100)
    const healthScore = Math.round(
      (duesRate * 0.35) +
      (attendanceRate * 0.25) +
      (riskRate * 0.20) +
      (Math.min(((avgGpa || 2.5) - 2.0) / 2.0 * 100, 100) * 0.20)
    );

    // Income vs expense last 30 days
    const income30 = recentTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense30 = recentTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    return res.json({
      success: true,
      data: {
        healthScore,
        members: {
          total: members.length,
          active: activeMembers.length,
          onProbation: members.filter(m => m.onProbation).length,
          avgGpa,
        },
        dues: { rate: duesRate, collected: duesCollected, owed: duesOwed },
        events: { total: events.length, attendanceRate },
        recruitment: { total: pnms.length, funnel: pnmFunnel },
        risk: { rate: riskRate, totalItems: totalRequired },
        finance: { income30, expense30, net30: income30 - expense30 },
      }
    });
  } catch (e) {
    console.error('Analytics error:', e);
    return res.status(500).json({ success: false, error: 'Failed to load analytics' });
  }
});

module.exports = router;
