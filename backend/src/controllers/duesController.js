const { PrismaClient } = require('@prisma/client');
const { sendDuesReminder } = require('../utils/email');

const prisma = new PrismaClient();

const getDuesRecords = async (req, res) => {
  try {
    const records = await prisma.duesRecord.findMany({
      where: { orgId: req.user.orgId },
      include: {
        payments: {
          include: { member: { select: { id: true, firstName: true, lastName: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { payments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Flatten into per-member payment rows for the frontend
    const flat = [];
    for (const record of records) {
      for (const payment of record.payments) {
        flat.push({
          id: payment.id,
          duesRecordId: record.id,
          memberId: payment.memberId,
          memberName: `${payment.member.firstName} ${payment.member.lastName}`,
          memberEmail: payment.member.email,
          semester: record.semester,
          amount: payment.amount || record.amount,
          paidAmount: payment.status === 'paid'
            ? (payment.amount || record.amount)
            : ((payment.winterPayment || 0) + (payment.springPayment || 0)) || 0,
          status: payment.status,
          dueDate: record.dueDate,
          paidDate: payment.paidAt,
          createdAt: payment.createdAt,
          // Extended treasurer fields
          discount:      payment.discount      || 0,
          winterPayment: payment.winterPayment || 0,
          springPayment: payment.springPayment || 0,
          owing:         payment.owing         != null ? payment.owing : null,
          notes:         payment.notes         || null,
        });
      }
    }

    return res.json({ success: true, data: flat });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to fetch dues records' });
  }
};

const createDuesRecord = async (req, res) => {
  try {
    const { semester, amount, dueDate } = req.body;
    if (!semester || !amount || !dueDate) {
      return res.status(400).json({ success: false, error: 'Semester, amount, and due date are required' });
    }

    const record = await prisma.duesRecord.create({
      data: {
        orgId: req.user.orgId,
        semester,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
      },
    });

    // Create unpaid payment records for all active members
    const members = await prisma.member.findMany({
      where: { orgId: req.user.orgId, role: { not: 'alumni' } },
      select: { id: true },
    });

    if (members.length > 0) {
      await prisma.duesPayment.createMany({
        data: members.map(m => ({
          memberId: m.id,
          duesRecordId: record.id,
          amount: parseFloat(amount),
          status: 'unpaid',
        })),
        skipDuplicates: true,
      });
    }

    return res.status(201).json({ success: true, data: record });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to create dues record' });
  }
};

const getDuesStatus = async (req, res) => {
  try {
    const { duesRecordId } = req.query;
    const where = { member: { orgId: req.user.orgId } };
    if (duesRecordId) where.duesRecordId = duesRecordId;

    const payments = await prisma.duesPayment.findMany({
      where,
      include: {
        member: { select: { id: true, firstName: true, lastName: true, email: true, pledgeClass: true } },
        duesRecord: true,
      },
      orderBy: { member: { lastName: 'asc' } },
    });

    const stats = {
      total: payments.length,
      paid: payments.filter(p => p.status === 'paid').length,
      unpaid: payments.filter(p => p.status === 'unpaid').length,
      partial: payments.filter(p => p.status === 'partial').length,
      totalCollected: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
      totalOutstanding: payments.filter(p => p.status !== 'paid').reduce((sum, p) => sum + p.amount, 0),
    };

    return res.json({ success: true, data: { payments, stats } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to fetch dues status' });
  }
};

const markPaid = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, amount } = req.body;

    const payment = await prisma.duesPayment.findFirst({
      where: { id: paymentId, member: { orgId: req.user.orgId } },
    });
    if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });

    const newStatus = status || 'paid';
    const updated = await prisma.duesPayment.update({
      where: { id: paymentId },
      data: {
        status: newStatus,
        paidAt: ['paid', 'partial'].includes(newStatus) ? new Date() : null,
        amount: amount ? parseFloat(amount) : payment.amount,
      },
      include: { member: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    // Award 25 points for paying dues (only if newly paid)
    if (newStatus === 'paid' && payment.status !== 'paid') {
      await prisma.member.update({
        where: { id: updated.memberId },
        data: { points: { increment: 25 } },
      }).catch(() => {});
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to update payment' });
  }
};

const sendReminders = async (req, res) => {
  try {
    const { duesRecordId } = req.body;

    const unpaid = await prisma.duesPayment.findMany({
      where: {
        duesRecordId,
        status: { not: 'paid' },
        member: { orgId: req.user.orgId },
      },
      include: {
        member: { select: { email: true, firstName: true, lastName: true } },
        duesRecord: true,
      },
    });

    const org = await prisma.organization.findUnique({ where: { id: req.user.orgId } });

    const results = await Promise.all(
      unpaid.map(payment =>
        sendDuesReminder({
          to: payment.member.email,
          memberName: `${payment.member.firstName} ${payment.member.lastName}`,
          amount: payment.amount,
          dueDate: payment.duesRecord.dueDate,
          orgName: org.name,
        })
      )
    );

    const sent = results.filter(r => r.success).length;
    return res.json({ success: true, data: { sent, total: unpaid.length } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to send reminders' });
  }
};

const sendSMSReminders = async (req, res) => {
  try {
    const { duesRecordId } = req.body;
    const { sendDuesSMS } = require('../utils/sms');

    const unpaid = await prisma.duesPayment.findMany({
      where: { duesRecordId, status: { not: 'paid' }, member: { orgId: req.user.orgId } },
      include: {
        member: { select: { firstName: true, lastName: true, phone: true } },
        duesRecord: true,
      },
    });

    const org = await prisma.organization.findUnique({ where: { id: req.user.orgId } });
    const withPhone = unpaid.filter(p => p.member.phone);

    const results = await Promise.all(
      withPhone.map(p => sendDuesSMS({
        to: p.member.phone,
        memberName: `${p.member.firstName} ${p.member.lastName}`,
        amount: p.amount,
        dueDate: p.duesRecord.dueDate,
        orgName: org.name,
      }))
    );

    const sent = results.filter(r => r.success).length;
    return res.json({
      success: true,
      data: { sent, total: unpaid.length, noPhone: unpaid.length - withPhone.length },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to send SMS reminders' });
  }
};

module.exports = { getDuesRecords, createDuesRecord, getDuesStatus, markPaid, sendReminders, sendSMSReminders };
