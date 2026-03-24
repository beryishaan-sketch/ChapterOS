const rateLimit = require('express-rate-limit');

// ── RATE LIMITERS ──────────────────────────────────────────────

// Strict limiter for auth routes (login, register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, error: 'Too many attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failures
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  message: { success: false, error: 'Too many requests. Slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aggressive limiter for password reset
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, error: 'Too many password reset attempts. Try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── PASSWORD STRENGTH ──────────────────────────────────────────

const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireNumber: true,
};

function validatePassword(password) {
  const errors = [];
  if (!password || password.length < PASSWORD_RULES.minLength) {
    errors.push(`Password must be at least ${PASSWORD_RULES.minLength} characters`);
  }
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (PASSWORD_RULES.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  return errors;
}

function passwordStrengthMiddleware(req, res, next) {
  const { password } = req.body;
  if (!password) return next(); // let other validators handle missing password
  const errors = validatePassword(password);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: errors[0] });
  }
  next();
}

// ── DEFAULT PERMISSIONS BY ROLE ───────────────────────────────

const ROLE_DEFAULTS = {
  admin: {
    dashboard: true, members: true, dues: true, events: true,
    recruitment: true, budget: true, announcements: true, polls: true,
    risk: true, reports: true, sponsors: true, analytics: true,
    channels: true, settings: true, import: true,
  },
  officer: {
    dashboard: true, members: true, dues: true, events: true,
    recruitment: true, budget: false, announcements: true, polls: true,
    risk: true, reports: false, sponsors: false, analytics: true,
    channels: true, settings: false, import: false,
  },
  member: {
    dashboard: true, members: true, dues: true, events: true,
    recruitment: false, budget: false, announcements: true, polls: true,
    risk: true, reports: false, sponsors: false, analytics: false,
    channels: true, settings: false, import: false,
  },
  pledge: {
    dashboard: true, members: true, dues: true, events: true,
    recruitment: false, budget: false, announcements: true, polls: true,
    risk: true, reports: false, sponsors: false, analytics: false,
    channels: true, settings: false, import: false,
  },
  alumni: {
    dashboard: true, members: true, dues: false, events: true,
    recruitment: false, budget: false, announcements: true, polls: false,
    risk: false, reports: false, sponsors: false, analytics: false,
    channels: true, settings: false, import: false,
  },
};

function getEffectivePermissions(member) {
  const roleDefaults = ROLE_DEFAULTS[member.role] || ROLE_DEFAULTS.member;
  if (!member.permissions) return roleDefaults;
  // Merge: member-specific overrides take precedence over role defaults
  return { ...roleDefaults, ...member.permissions };
}

// Middleware: check a specific feature permission
function requirePermission(feature) {
  return (req, res, next) => {
    if (!req.member) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const perms = getEffectivePermissions(req.member);
    if (!perms[feature]) {
      return res.status(403).json({ success: false, error: `Access to ${feature} is restricted` });
    }
    next();
  };
}

module.exports = {
  authLimiter,
  apiLimiter,
  resetLimiter,
  validatePassword,
  passwordStrengthMiddleware,
  getEffectivePermissions,
  requirePermission,
  ROLE_DEFAULTS,
};
