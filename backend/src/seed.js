/**
 * ChapterOS Demo Seed Script
 * Creates a realistic demo chapter with members, events, dues, PNMs, etc.
 * 
 * Usage: node src/seed.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@chapteros.app';
const DEMO_PASSWORD = 'demo1234';

const members = [
  { firstName: 'James', lastName: 'Mitchell', role: 'admin', position: 'President', major: 'Finance', year: 'Senior', gpa: 3.8, pledgeClass: 'Fall 2021', points: 340 },
  { firstName: 'Marcus', lastName: 'Williams', role: 'officer', position: 'Vice President', major: 'Business', year: 'Junior', gpa: 3.5, pledgeClass: 'Spring 2022', points: 280 },
  { firstName: 'Tyler', lastName: 'Johnson', role: 'officer', position: 'Treasurer', major: 'Accounting', year: 'Senior', gpa: 3.9, pledgeClass: 'Fall 2021', points: 310 },
  { firstName: 'Derek', lastName: 'Brown', role: 'officer', position: 'Secretary', major: 'Political Science', year: 'Junior', gpa: 3.2, pledgeClass: 'Spring 2022', points: 195 },
  { firstName: 'Ryan', lastName: 'Davis', role: 'officer', position: 'Recruitment Chair', major: 'Marketing', year: 'Sophomore', gpa: 3.4, pledgeClass: 'Fall 2022', points: 225 },
  { firstName: 'Alex', lastName: 'Garcia', role: 'officer', position: 'Risk Manager', major: 'Pre-Law', year: 'Senior', gpa: 3.7, pledgeClass: 'Fall 2021', points: 290 },
  { firstName: 'Chris', lastName: 'Anderson', role: 'member', position: null, major: 'Computer Science', year: 'Junior', gpa: 3.6, pledgeClass: 'Spring 2022', points: 180 },
  { firstName: 'Kevin', lastName: 'Thompson', role: 'member', position: null, major: 'Economics', year: 'Sophomore', gpa: 2.8, pledgeClass: 'Fall 2022', points: 90 },
  { firstName: 'Jordan', lastName: 'Martinez', role: 'member', position: null, major: 'Psychology', year: 'Junior', gpa: 3.1, pledgeClass: 'Spring 2022', points: 155 },
  { firstName: 'Brandon', lastName: 'Lee', role: 'member', position: null, major: 'Communications', year: 'Senior', gpa: null, onProbation: true, pledgeClass: 'Fall 2021', points: 45 },
  { firstName: 'Nathan', lastName: 'White', role: 'member', position: null, major: 'Biology', year: 'Freshman', gpa: 3.3, pledgeClass: 'Fall 2023', points: 120 },
  { firstName: 'Ethan', lastName: 'Harris', role: 'member', position: null, major: 'Engineering', year: 'Sophomore', gpa: 3.8, pledgeClass: 'Fall 2022', points: 200 },
  { firstName: 'Michael', lastName: 'Clark', role: 'member', position: null, major: 'History', year: 'Junior', gpa: 2.9, pledgeClass: 'Spring 2022', points: 110 },
  { firstName: 'Daniel', lastName: 'Lewis', role: 'member', position: null, major: 'Architecture', year: 'Senior', gpa: 3.5, pledgeClass: 'Fall 2021', points: 260 },
  { firstName: 'Andrew', lastName: 'Robinson', role: 'alumni', position: null, major: 'Finance', year: null, gpa: null, pledgeClass: 'Fall 2019', points: 0 },
];

const events = [
  { title: 'Chapter Meeting', type: 'meeting', daysOffset: 3, location: 'Chapter House', description: 'Weekly chapter meeting. Attendance required.' },
  { title: 'Spring Mixer — Delta Gamma', type: 'mixer', daysOffset: 8, location: 'The Rooftop Bar', description: 'Annual spring mixer with Delta Gamma. Guest cap: 2 per brother.' },
  { title: 'Philanthropy 5K Run', type: 'philanthropy', daysOffset: 12, location: 'Campus Quad', description: 'Annual 5K fundraiser for St. Jude. Invite parents, friends, and community.' },
  { title: 'Bid Day', type: 'social', daysOffset: -5, location: 'Chapter House', description: 'Bid day celebration for new pledges.' },
  { title: 'Last Chapter Meeting', type: 'meeting', daysOffset: -14, location: 'Chapter House', description: null, minutes: 'Called to order at 7:02 PM by President James Mitchell.\n\nOld Business:\n- Spring mixer attendance was 94% — excellent turnout\n- Philanthropy 5K raised $3,400 for St. Jude\n\nNew Business:\n- Dues deadline extended to April 15th by vote (11-2)\n- Risk management training scheduled for next week (mandatory)\n- Bid day date confirmed for March 14th\n\nAnnouncements:\n- Formal is May 3rd at the Marriott Downtown\n- Alumni golf tournament fundraiser TBD\n\nAdjourned at 8:34 PM.' },
];

const pnms = [
  { firstName: 'Liam', lastName: 'Cooper', major: 'Finance', year: 'Freshman', stage: 'bid', avgScore: 4.2 },
  { firstName: 'Noah', lastName: 'Scott', major: 'Business', year: 'Sophomore', stage: 'liked', avgScore: 3.8 },
  { firstName: 'Owen', lastName: 'Baker', major: 'Computer Science', year: 'Freshman', stage: 'met', avgScore: 3.5 },
  { firstName: 'Logan', lastName: 'Adams', major: 'Marketing', year: 'Freshman', stage: 'invited', avgScore: 0 },
  { firstName: 'Mason', lastName: 'Nelson', major: 'Economics', year: 'Sophomore', stage: 'bid', avgScore: 4.5 },
  { firstName: 'Elijah', lastName: 'Carter', major: 'Engineering', year: 'Freshman', stage: 'liked', avgScore: 4.0 },
];

async function main() {
  console.log('🌱 Seeding ChapterOS demo data...');

  // Check if demo org already exists
  const existing = await prisma.member.findFirst({ where: { email: DEMO_EMAIL } });
  if (existing) {
    console.log('⚠️  Demo data already exists. Delete it first or use a different email.');
    process.exit(0);
  }

  // Create org
  const org = await prisma.organization.create({
    data: {
      name: 'Sigma Alpha Chapter',
      type: 'fraternity',
      school: 'State University',
      primaryColor: '#0F1C3F',
      plan: 'standard',
      inviteCode: 'DEMO1234',
    },
  });
  console.log('✅ Created org:', org.name);

  // Create members
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const createdMembers = [];

  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    const email = i === 0 ? DEMO_EMAIL : `${m.firstName.toLowerCase()}.${m.lastName.toLowerCase()}@demo.chapteros.app`;
    const member = await prisma.member.create({
      data: {
        orgId: org.id, email, passwordHash,
        firstName: m.firstName, lastName: m.lastName,
        role: m.role, position: m.position, major: m.major,
        year: m.year, gpa: m.gpa ?? null, pledgeClass: m.pledgeClass,
        points: m.points, onProbation: m.onProbation ?? false,
        studyHours: Math.floor(Math.random() * 40),
      },
    });
    createdMembers.push(member);
  }
  console.log(`✅ Created ${createdMembers.length} members`);

  // Create events
  const now = new Date();
  const createdEvents = [];
  for (const e of events) {
    const date = new Date(now);
    date.setDate(date.getDate() + e.daysOffset);
    date.setHours(19, 0, 0, 0);
    const event = await prisma.event.create({
      data: {
        orgId: org.id, title: e.title, type: e.type,
        date, location: e.location, description: e.description,
        minutes: e.minutes || null,
      },
    });
    createdEvents.push(event);

    // Add attendance records for active members
    const activeMembers = createdMembers.filter(m => m.role !== 'alumni');
    await prisma.attendance.createMany({
      data: activeMembers.map(m => ({
        memberId: m.id, eventId: event.id,
        checkedIn: e.daysOffset < 0 ? Math.random() > 0.15 : false,
        checkedInAt: e.daysOffset < 0 && Math.random() > 0.15 ? new Date(date.getTime() + Math.random() * 3600000) : null,
      })),
      skipDuplicates: true,
    });
  }
  console.log(`✅ Created ${createdEvents.length} events`);

  // Create dues record + payments
  const duesRecord = await prisma.duesRecord.create({
    data: {
      orgId: org.id, semester: 'Spring 2025',
      amount: 40000, // $400 in cents
      dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 15),
    },
  });

  const activeMembers = createdMembers.filter(m => m.role !== 'alumni');
  await prisma.duesPayment.createMany({
    data: activeMembers.map((m, i) => ({
      memberId: m.id, duesRecordId: duesRecord.id,
      amount: 40000,
      status: i < 10 ? 'paid' : 'unpaid',
      paidAt: i < 10 ? new Date(now.getTime() - Math.random() * 30 * 86400000) : null,
    })),
  });
  console.log('✅ Created dues record + payments');

  // Create PNMs
  for (const p of pnms) {
    await prisma.pNM.create({
      data: {
        orgId: org.id, firstName: p.firstName, lastName: p.lastName,
        major: p.major, year: p.year, stage: p.stage, avgScore: p.avgScore,
        notes: 'Referred by current member. Strong academic record.',
      },
    });
  }
  console.log(`✅ Created ${pnms.length} PNMs`);

  // Create budget transactions
  const transactions = [
    { type: 'income', amount: 400000, description: 'Spring 2025 Dues Collection', category: 'dues' },
    { type: 'income', amount: 85000, description: 'Philanthropy 5K proceeds', category: 'fundraising' },
    { type: 'expense', amount: 45000, description: 'Spring Mixer venue deposit', category: 'venue' },
    { type: 'expense', amount: 18000, description: 'Chapter apparel order', category: 'apparel' },
    { type: 'expense', amount: 12500, description: 'Weekly meeting food', category: 'food' },
    { type: 'expense', amount: 8000, description: 'Philanthropy event supplies', category: 'philanthropy' },
  ];
  await prisma.transaction.createMany({
    data: transactions.map(t => ({
      ...t, orgId: org.id, createdById: createdMembers[0].id,
      date: new Date(now.getTime() - Math.random() * 45 * 86400000),
    })),
  });
  console.log('✅ Created budget transactions');

  // Create risk items
  const riskItems = [
    { title: 'AlcoholEdu Completion', required: true },
    { title: 'Title IX Training', required: true },
    { title: 'Anti-Hazing Certification', required: true },
    { title: 'Bystander Intervention Training', required: true },
    { title: 'Risk Management Policy Acknowledgment', required: true },
  ];
  for (const item of riskItems) {
    const ri = await prisma.riskItem.create({
      data: { orgId: org.id, ...item, dueDate: new Date(now.getFullYear(), now.getMonth() + 2, 1) },
    });
    // Mark some as complete
    const completors = createdMembers.filter(() => Math.random() > 0.25);
    if (completors.length > 0) {
      await prisma.riskCompletion.createMany({
        data: completors.map(m => ({ riskItemId: ri.id, memberId: m.id })),
        skipDuplicates: true,
      });
    }
  }
  console.log('✅ Created risk items');

  // Create announcements
  await prisma.announcement.createMany({
    data: [
      {
        orgId: org.id, authorId: createdMembers[0].id,
        title: '📅 Dues deadline extended to April 15th',
        body: 'After the vote at last chapter meeting, the Spring 2025 dues deadline has been extended to April 15th. No exceptions after that date. Contact Tyler if you have payment questions.',
        pinned: true,
      },
      {
        orgId: org.id, authorId: createdMembers[4].id,
        title: '🎉 Rush Week Schedule Released',
        body: 'Rush week schedule is out. Monday: Info Night | Tuesday: Mixer with Phi Mu | Wednesday: Sports Night | Thursday: Formal Rush Night. All brothers are expected to attend at least 3 events.',
        pinned: false,
      },
    ],
  });
  console.log('✅ Created announcements');

  console.log('\n🎉 Demo seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📧 Login: ${DEMO_EMAIL}`);
  console.log(`🔑 Password: ${DEMO_PASSWORD}`);
  console.log(`🏛  Chapter: ${org.name}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
