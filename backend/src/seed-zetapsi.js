/**
 * Zeta Psi Demo Seed
 * Creates a realistic chapter demo for Zeta Psi pitch
 * Run: node src/seed-zetapsi.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🔵 Seeding Zeta Psi demo...');

  // 1. Create org
  const org = await prisma.organization.upsert({
    where: { inviteCode: 'ZETAPSI' },
    update: {},
    create: {
      name: 'Zeta Psi Fraternity',
      type: 'fraternity',
      school: 'Your University',   // <-- UPDATE with real school
      inviteCode: 'ZETAPSI',
      plan: 'standard',
      primaryColor: '#002868',     // Zeta Psi navy blue
    }
  });
  console.log('✅ Org:', org.name, '(' + org.id + ')');

  const hash = await bcrypt.hash('ZetaPsi2026!', 12);

  // 2. Officers
  const officers = [
    { firstName:'[President Name]',   lastName:'[Last]', position:'President',          role:'admin',   pledgeClass:'Fall 2022', major:'Finance',          gpa:3.6, points:520, email:'president@zetapsi.demo' },
    { firstName:'[VP Name]',          lastName:'[Last]', position:'Vice President',     role:'officer', pledgeClass:'Fall 2022', major:'Business',          gpa:3.4, points:410, email:'vp@zetapsi.demo' },
    { firstName:'[Treasurer Name]',   lastName:'[Last]', position:'Treasurer',          role:'officer', pledgeClass:'Spring 2023', major:'Accounting',     gpa:3.8, points:380, email:'treasurer@zetapsi.demo' },
    { firstName:'[Secretary Name]',   lastName:'[Last]', position:'Secretary',          role:'officer', pledgeClass:'Fall 2022', major:'Communications',    gpa:3.2, points:340, email:'secretary@zetapsi.demo' },
    { firstName:'[Recruitment Name]', lastName:'[Last]', position:'Recruitment Chair',  role:'officer', pledgeClass:'Spring 2023', major:'Marketing',      gpa:3.1, points:290, email:'rush@zetapsi.demo' },
    { firstName:'[Risk Name]',        lastName:'[Last]', position:'Risk Manager',       role:'officer', pledgeClass:'Fall 2022', major:'Pre-Law',           gpa:3.5, points:310, email:'risk@zetapsi.demo' },
    { firstName:'[Social Name]',      lastName:'[Last]', position:'Social Chair',       role:'officer', pledgeClass:'Spring 2023', major:'Hospitality',    gpa:2.9, points:260, email:'social@zetapsi.demo' },
    { firstName:'[Alumni Name]',      lastName:'[Last]', position:'Alumni Relations',   role:'officer', pledgeClass:'Fall 2021', major:'Business Admin',    gpa:3.3, points:220, email:'alumni@zetapsi.demo' },
  ];

  // 3. General members (add real names here)
  const members = [
    { firstName:'Brother',  lastName:'One',   role:'member', pledgeClass:'Fall 2023', major:'Engineering',    gpa:3.4, points:180, email:'bro1@zetapsi.demo' },
    { firstName:'Brother',  lastName:'Two',   role:'member', pledgeClass:'Fall 2023', major:'CS',             gpa:3.7, points:210, email:'bro2@zetapsi.demo' },
    { firstName:'Brother',  lastName:'Three', role:'member', pledgeClass:'Fall 2023', major:'Finance',        gpa:3.0, points:150, email:'bro3@zetapsi.demo' },
    { firstName:'Brother',  lastName:'Four',  role:'member', pledgeClass:'Spring 2024', major:'Marketing',   gpa:2.8, points:90,  email:'bro4@zetapsi.demo' },
    { firstName:'Brother',  lastName:'Five',  role:'member', pledgeClass:'Spring 2024', major:'Pre-Med',     gpa:3.9, points:200, email:'bro5@zetapsi.demo' },
    { firstName:'Brother',  lastName:'Six',   role:'member', pledgeClass:'Fall 2024', major:'Economics',     gpa:3.2, points:130, email:'bro6@zetapsi.demo' },
    { firstName:'Brother',  lastName:'Seven', role:'member', pledgeClass:'Fall 2024', major:'Political Sci', gpa:3.5, points:160, email:'bro7@zetapsi.demo' },
    { firstName:'Brother',  lastName:'Eight', role:'pledge',  pledgeClass:'Spring 2025', major:'Business',   gpa:3.1, points:60,  email:'bro8@zetapsi.demo' },
    { firstName:'Brother',  lastName:'Nine',  role:'pledge',  pledgeClass:'Spring 2025', major:'CS',         gpa:3.6, points:55,  email:'bro9@zetapsi.demo' },
    { firstName:'Brother',  lastName:'Ten',   role:'alumni',  pledgeClass:'Fall 2020', major:'Law',          gpa:3.8, points:0,   email:'bro10@zetapsi.demo' },
  ];

  // Insert all members
  let created = 0;
  for (const m of [...officers, ...members]) {
    try {
      await prisma.member.upsert({
        where: { email: m.email },
        update: {},
        create: { ...m, orgId: org.id, passwordHash: hash, year: 'Junior' }
      });
      created++;
    } catch(e) { console.log('Skip:', m.email, e.message?.slice(0,40)); }
  }
  console.log(`✅ ${created} members created`);

  const now = new Date();

  // Events
  const events = [
    { title:'Zeta Psi Chapter Meeting', type:'meeting', date:new Date(now.getTime()+86400000), location:'Chapter House — Room 1', description:'Weekly chapter business meeting', orgId:org.id },
    { title:'Spring Formal 2026', type:'formal', date:new Date(now.getTime()+12*86400000), location:'The Grand Ballroom', description:'Annual spring formal dinner', guestCap:200, orgId:org.id },
    { title:'Spring Rush Kickoff', type:'rush', date:new Date(now.getTime()+5*86400000), location:'Chapter House', description:'Spring recruitment begins', orgId:org.id },
    { title:'Philanthropy Night', type:'philanthropy', date:new Date(now.getTime()+18*86400000), location:'Campus Quad', description:'Annual philanthropy event', orgId:org.id },
    { title:'Alumni Networking Night', type:'mixer', date:new Date(now.getTime()+25*86400000), location:'Alumni Hall', description:'Brothers meet local alumni', guestCap:100, orgId:org.id },
  ];

  let evCreated = 0;
  for (const e of events) {
    try { await prisma.event.create({ data: e }); evCreated++; } catch {}
  }
  console.log(`✅ ${evCreated} events created`);

  // Dues
  try {
    await prisma.duesPeriod.create({ data: {
      semester: 'Spring 2026', amount: 40000,
      dueDate: new Date(now.getTime()+30*86400000),
      description: 'Spring 2026 Chapter Dues — $400',
      orgId: org.id
    }});
    console.log('✅ Dues period created');
  } catch {}

  // Announcements
  const announcements = [
    { title:'📢 Spring Formal — Register by Friday', body:'Spring Formal is on April 12th. Ticket price is $50/person. Secure your spot by Friday or lose your place.', pinned:true, orgId:org.id },
    { title:'Spring Dues — $400 Due March 31st', body:'Brothers who haven\'t paid by March 31st will be placed on financial probation and restricted from social events. Contact the Treasurer for payment plans.', pinned:false, orgId:org.id },
    { title:'Rush Week Schedule Posted', body:'Rush starts next Monday. Recruitment Chair has posted the full schedule in the Documents section. All brothers are expected to attend at least 2 events.', pinned:false, orgId:org.id },
  ];

  for (const a of announcements) {
    try { await prisma.announcement.create({ data: { ...a, authorId: (await prisma.member.findFirst({ where: { orgId: org.id, role:'admin' }}))?.id || '' } }); } catch(e) {}
  }
  console.log('✅ Announcements created');

  // Budget
  const txns = [
    { type:'income', category:'dues', description:'Fall 2025 dues collected', amount:480000, date:new Date('2025-09-01'), orgId:org.id },
    { type:'expense', category:'events', description:'Fall Formal venue & catering', amount:95000, date:new Date('2025-10-20'), orgId:org.id },
    { type:'expense', category:'operations', description:'Chapter house utilities', amount:18000, date:new Date('2025-11-01'), orgId:org.id },
    { type:'income', category:'fundraising', description:'Alumni donations', amount:60000, date:new Date('2025-12-15'), orgId:org.id },
    { type:'expense', category:'philanthropy', description:'Charity event supplies', amount:25000, date:new Date('2026-01-15'), orgId:org.id },
    { type:'income', category:'dues', description:'Spring 2026 dues (partial)', amount:200000, date:new Date('2026-02-01'), orgId:org.id },
  ];
  let txCreated = 0;
  for (const t of txns) { try { await prisma.budgetTransaction.create({ data: t }); txCreated++; } catch {} }
  console.log(`✅ ${txCreated} budget transactions created`);

  console.log('\n🎉 ZETA PSI DEMO READY');
  console.log('════════════════════════════════');
  console.log('Login URL:  http://localhost:5173');
  console.log('Email:      president@zetapsi.demo');
  console.log('Password:   ZetaPsi2026!');
  console.log('Invite code: ZETAPSI');
  console.log('════════════════════════════════');
  console.log('\nNEXT: Replace placeholder names with real brother names');
  console.log('Update school name in the script above, then re-run.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
