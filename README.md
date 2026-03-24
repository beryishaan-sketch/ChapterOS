# ChapterOS

> Run your chapter like a pro.

Full-stack SaaS for fraternity and sorority chapter management. Replaces Excel, GroupMe lists, Venmo chasing, and Google Docs with one platform.

---

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Node.js + Express + Prisma ORM
- **Database:** PostgreSQL
- **Auth:** JWT
- **Email:** Nodemailer (SMTP)
- **PDF:** PDFKit
- **Scheduling:** node-cron
- **Mobile:** Capacitor (iOS/Android)

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Backend
```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, SMTP_*, STRIPE_*
npm install
npx prisma db push
npx prisma generate
node src/seed.js   # optional: seed demo data
node src/index.js
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## Environment Variables

### Backend `.env`
```
DATABASE_URL=postgresql://user:pass@localhost:5432/chapteros
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
PORT=3001
FRONTEND_URL=https://your-domain.com
```

---

## Features

| Feature | Status |
|---------|--------|
| Member directory | ✅ |
| Dues tracking + auto-reminders | ✅ |
| Events + QR check-in | ✅ |
| Recruitment pipeline (Kanban) | ✅ |
| Bid voting (anonymous) | ✅ |
| Academic tracking (GPA) | ✅ |
| Budget & treasury | ✅ |
| Announcements | ✅ |
| Polls | ✅ (DB-backed) |
| Risk management | ✅ |
| Documents | ✅ |
| HQ compliance reports (PDF) | ✅ |
| Analytics dashboard | ✅ |
| Leaderboard & points | ✅ |
| Weekly email digest | ✅ |
| PWA (installable) | ✅ |
| iOS/Android (Capacitor) | ✅ (setup) |
| In-app notifications | ✅ |

---

## Deployment

### Production (PM2)
```bash
npm install -g pm2
cd /path/to/chapteros
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### iOS App Store
See `MOBILE_DEPLOY.md`

---

## Pricing

| Plan | Price | Members |
|------|-------|---------|
| Basic | $49/mo | Up to 40 |
| Standard | $89/mo | Up to 100 |
| Pro | $150/mo | Unlimited |

All plans include a 30-day free trial.

---

## License
Private — All rights reserved.
