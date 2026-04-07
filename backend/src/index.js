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
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  'https://chapterhq.org',
  'https://www.chapterhq.org',
  'https://web-production-7aa33.up.railway.app',
  'capacitor://localhost',   // iOS Capacitor WebView
  'http://localhost',        // Android Capacitor WebView
  'http://localhost:5173',   // local dev
  'http://localhost:4173',   // local preview
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // allow requests with no origin (curl, Postman, same-origin)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: ${origin} not allowed`));
  },
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
  res.json({ success: true, message: 'ChapterOS API is running', timestamp: new Date().toISOString() });
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
app.use('/api/reports', require('./routes/reports'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/sponsors', require('./routes/sponsors'));
app.use('/api/channels', require('./routes/channels'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/push', require('./routes/push').router);
app.use('/api/superadmin', require('./routes/superadmin'));
app.use('/uploads', require('express').static(require('path').join(__dirname, '../../uploads')));

// Start cron jobs
const { startDuesReminderCron } = require('./services/duesReminder');
const { startWeeklyDigestCron } = require('./services/weeklyDigest');
startDuesReminderCron();
startWeeklyDigestCron();

// Serve built frontend in production
// Try backend/public first (where root build script copies dist), fall back to frontend/dist
const fs = require('fs');
const publicDir = path.join(__dirname, '../public');
const distDir = path.join(__dirname, '../../frontend/dist');
const frontendDist = fs.existsSync(path.join(publicDir, 'index.html')) ? publicDir : distDir;
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
  console.log(`ChapterOS running on port ${PORT}`);
});

module.exports = app;
