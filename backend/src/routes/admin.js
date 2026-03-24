const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
let runBackup = async () => ({ success: false, error: 'pg_dump not available in this environment' });
try { runBackup = require('../services/dbBackup').runBackup; } catch {}
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Super-admin check — only allow if ADMIN_SECRET header matches env var
const requireAdmin = (req, res, next) => {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }
  next();
};

// GET /admin/stats — high-level platform metrics
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      totalOrgs,
      activeOrgs,
      newOrgsThisWeek,
      newOrgsThisMonth,
      totalMembers,
      trialOrgs,
      paidOrgs,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { members: { some: { createdAt: { gte: monthAgo } } } } }),
      prisma.organization.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.organization.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.member.count(),
      prisma.organization.count({ where: { plan: 'trial' } }),
      prisma.organization.count({ where: { plan: { not: 'trial' } } }),
    ]);

    return res.json({
      success: true,
      data: {
        orgs: { total: totalOrgs, active: activeOrgs, newThisWeek: newOrgsThisWeek, newThisMonth: newOrgsThisMonth, trial: trialOrgs, paid: paidOrgs },
        members: { total: totalMembers },
        mrr: { trial: trialOrgs, paid: paidOrgs },
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// GET /admin/orgs — list all chapters
router.get('/orgs', requireAdmin, async (req, res) => {
  try {
    const orgs = await prisma.organization.findMany({
      include: {
        _count: { select: { members: true, events: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: orgs });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// GET /admin/logs — last N lines of app log
router.get('/logs', requireAdmin, (req, res) => {
  try {
    const logPath = path.join(__dirname, '../../../logs/app.log');
    if (!fs.existsSync(logPath)) return res.json({ success: true, data: [] });
    const lines = fs.readFileSync(logPath, 'utf8')
      .trim().split('\n').slice(-200)
      .map(l => { try { return JSON.parse(l); } catch { return { message: l }; } });
    return res.json({ success: true, data: lines.reverse() });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// GET /admin/errors — last N error log lines
router.get('/errors', requireAdmin, (req, res) => {
  try {
    const logPath = path.join(__dirname, '../../../logs/error.log');
    if (!fs.existsSync(logPath)) return res.json({ success: true, data: [] });
    const lines = fs.readFileSync(logPath, 'utf8')
      .trim().split('\n').filter(Boolean).slice(-100)
      .map(l => { try { return JSON.parse(l); } catch { return { message: l }; } });
    return res.json({ success: true, data: lines.reverse() });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// POST /admin/backup — trigger manual DB backup
router.post('/backup', requireAdmin, async (req, res) => {
  const result = await runBackup();
  return res.json(result);
});

// GET /admin/backups — list available backups
router.get('/backups', requireAdmin, (req, res) => {
  try {
    const backupDir = path.join(__dirname, '../../../backups');
    if (!fs.existsSync(backupDir)) return res.json({ success: true, data: [] });
    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.sql.gz'))
      .map(f => {
        const stats = fs.statSync(path.join(backupDir, f));
        return { filename: f, size: stats.size, created: stats.mtime };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));
    return res.json({ success: true, data: files });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// GET /admin/health — detailed system health
router.get('/health', requireAdmin, async (req, res) => {
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbMs = Date.now() - dbStart;

    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    return res.json({
      success: true,
      data: {
        status: 'healthy',
        uptime: Math.floor(uptime),
        uptimeHuman: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        db: { status: 'connected', latencyMs: dbMs },
        memory: {
          heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
          rssMB: Math.round(memUsage.rss / 1024 / 1024),
        },
        node: process.version,
        env: process.env.NODE_ENV || 'development',
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message, status: 'unhealthy' });
  }
});

module.exports = router;
