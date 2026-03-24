require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const recruitmentRoutes = require('./routes/recruitment');
const pnmRoutes = require('./routes/pnms');
const eventRoutes = require('./routes/events');
const duesRoutes = require('./routes/dues');
const attendanceRoutes = require('./routes/attendance');
const documentRoutes = require('./routes/documents');
const billingRoutes = require('./routes/billing');
const dashboardRoutes = require('./routes/dashboard');
const orgRoutes = require('./routes/orgs');

const { authLimiter, apiLimiter } = require('./middleware/security');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(logger.requestMiddleware);

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/join', authLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ChapterHQ API is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/pnms', pnmRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/dues', duesRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/orgs', orgRoutes);
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/polls', require('./routes/polls'));
app.use('/api/import', require('./routes/import'));
app.use('/api/budget', require('./routes/budget'));
app.use('/api/risk', require('./routes/risk'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/sponsors', require('./routes/sponsors'));
app.use('/api/channels', require('./routes/channels'));
app.use('/uploads', require('express').static(require('path').join(__dirname, '../../uploads')));

// Start cron jobs
const { startDuesReminderCron } = require('./services/duesReminder');
const { startWeeklyDigestCron } = require('./services/weeklyDigest');
startDuesReminderCron();
startWeeklyDigestCron();

// Serve built frontend in production
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendDist, 'index.html'));
  }
});

// Global error handler
app.use(logger.errorMiddleware);

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ChapterHQ running on port ${PORT} — http://187.124.151.175:${PORT}`);
});

module.exports = app;
