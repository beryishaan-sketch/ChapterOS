const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');

const prisma = new PrismaClient();

const NAVY = '#0F1C3F';
const GOLD = '#C9A84C';
const GRAY = '#6B7280';
const LIGHT = '#F9FAFB';

function header(doc, org, title) {
  doc.rect(0, 0, doc.page.width, 80).fill(NAVY);
  doc.fontSize(20).fillColor('white').font('Helvetica-Bold').text('ChapterOS', 40, 22);
  doc.fontSize(10).fillColor('#CBD5E1').font('Helvetica').text(title, 40, 48);
  doc.fontSize(10).fillColor('#CBD5E1').text(`${org.name} · ${org.school}`, 40, 62);
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.fontSize(9).fillColor('#94A3B8').text(dateStr, 0, 62, { align: 'right', width: doc.page.width - 40 });
  doc.fillColor('#111827').moveDown(0);
  doc.y = 100;
}

function sectionTitle(doc, text) {
  doc.moveDown(0.5);
  doc.rect(40, doc.y, doc.page.width - 80, 24).fill(NAVY);
  doc.fontSize(11).fillColor('white').font('Helvetica-Bold').text(text, 50, doc.y - 18);
  doc.moveDown(0.3);
  doc.fillColor('#111827').font('Helvetica');
}

function tableRow(doc, cols, y, isHeader = false, isShaded = false) {
  if (isShaded) doc.rect(40, y - 4, doc.page.width - 80, 20).fill('#F8FAFC');
  doc.fillColor(isHeader ? NAVY : '#374151').font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(isHeader ? 9 : 9);
  let x = 50;
  cols.forEach(({ text, width }) => {
    doc.text(text, x, y, { width: width - 10, ellipsis: true });
    x += width;
  });
  doc.fillColor('#111827');
}

const generateRoster = async (req, res) => {
  const orgId = req.user.orgId;
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  const members = await prisma.member.findMany({
    where: { orgId },
    orderBy: [{ role: 'asc' }, { lastName: 'asc' }],
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="roster.pdf"');

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);

  header(doc, org, 'Chapter Roster Report');

  doc.fontSize(11).font('Helvetica-Bold').text(`Total Members: ${members.length}`, 40, doc.y + 10);
  doc.moveDown(1);

  sectionTitle(doc, 'Member Directory');
  doc.moveDown(0.5);

  const cols = [
    { text: 'Name', width: 130 },
    { text: 'Email', width: 160 },
    { text: 'Role', width: 70 },
    { text: 'Position', width: 80 },
    { text: 'Major', width: 100 },
  ];
  tableRow(doc, cols, doc.y, true);
  doc.moveDown(0.3);
  doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor(NAVY).lineWidth(1).stroke();
  doc.moveDown(0.2);

  members.forEach((m, i) => {
    if (doc.y > doc.page.height - 60) doc.addPage();
    tableRow(doc, [
      { text: `${m.firstName} ${m.lastName}`, width: 130 },
      { text: m.email || '—', width: 160 },
      { text: m.role || '—', width: 70 },
      { text: m.position || '—', width: 80 },
      { text: m.major || '—', width: 100 },
    ], doc.y, false, i % 2 === 0);
    doc.moveDown(0.35);
  });

  doc.end();
};

const generateFinancial = async (req, res) => {
  const orgId = req.user.orgId;
  const org = await prisma.organization.findUnique({ where: { id: orgId } });

  const [duesRecords, transactions] = await Promise.all([
    prisma.duesRecord.findMany({
      where: { orgId },
      include: { payments: { include: { member: { select: { firstName: true, lastName: true } } } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.transaction.findMany({
      where: { orgId },
      orderBy: { date: 'desc' },
      take: 50,
    }),
  ]);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="financial.pdf"');

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);
  header(doc, org, 'Financial Summary Report');

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalDuesExpected = duesRecords.reduce((s, d) => s + d.payments.reduce((ps, p) => ps + p.amount, 0), 0);
  const totalDuesPaid = duesRecords.reduce((s, d) => s + d.payments.filter(p => p.status === 'paid').reduce((ps, p) => ps + p.amount, 0), 0);

  doc.y += 10;
  const summaryY = doc.y;
  const boxW = (doc.page.width - 80 - 30) / 4;
  [
    { label: 'Dues Expected', val: `$${totalDuesExpected.toLocaleString()}` },
    { label: 'Dues Collected', val: `$${totalDuesPaid.toLocaleString()}` },
    { label: 'Total Income', val: `$${totalIncome.toLocaleString()}` },
    { label: 'Total Expenses', val: `$${totalExpense.toLocaleString()}` },
  ].forEach(({ label, val }, i) => {
    const x = 40 + i * (boxW + 10);
    doc.rect(x, summaryY, boxW, 50).fill(LIGHT);
    doc.fontSize(16).fillColor(NAVY).font('Helvetica-Bold').text(val, x + 8, summaryY + 8, { width: boxW - 16 });
    doc.fontSize(8).fillColor(GRAY).font('Helvetica').text(label, x + 8, summaryY + 30, { width: boxW - 16 });
  });
  doc.fillColor('#111827');
  doc.y = summaryY + 60;

  if (transactions.length > 0) {
    sectionTitle(doc, 'Recent Transactions');
    doc.moveDown(0.5);
    tableRow(doc, [
      { text: 'Date', width: 80 }, { text: 'Description', width: 200 },
      { text: 'Category', width: 100 }, { text: 'Type', width: 60 }, { text: 'Amount', width: 80 },
    ], doc.y, true);
    doc.moveDown(0.4);
    transactions.slice(0, 30).forEach((t, i) => {
      if (doc.y > doc.page.height - 60) doc.addPage();
      tableRow(doc, [
        { text: new Date(t.date).toLocaleDateString(), width: 80 },
        { text: t.description, width: 200 },
        { text: t.category, width: 100 },
        { text: t.type, width: 60 },
        { text: `$${t.amount.toFixed(2)}`, width: 80 },
      ], doc.y, false, i % 2 === 0);
      doc.moveDown(0.35);
    });
  }

  doc.end();
};

const generateAcademic = async (req, res) => {
  const orgId = req.user.orgId;
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  const members = await prisma.member.findMany({
    where: { orgId },
    orderBy: { lastName: 'asc' },
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="academic.pdf"');

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);
  header(doc, org, 'Academic Report');

  const withGpa = members.filter(m => m.gpa != null);
  const avgGpa = withGpa.length ? (withGpa.reduce((s, m) => s + m.gpa, 0) / withGpa.length).toFixed(2) : 'N/A';
  const onProbation = members.filter(m => m.onProbation);
  const honors = members.filter(m => m.gpa >= 3.5);
  const atRisk = members.filter(m => m.gpa != null && m.gpa < 2.5);

  doc.y += 10;
  doc.fontSize(11).fillColor(NAVY).font('Helvetica-Bold').text(`Chapter GPA Average: ${avgGpa}`, 40, doc.y);
  doc.fillColor(GRAY).font('Helvetica').fontSize(9).text(`${withGpa.length} of ${members.length} members have GPA on record`, 40, doc.y + 14);
  doc.y += 30;

  if (onProbation.length > 0) {
    sectionTitle(doc, `Academic Probation (${onProbation.length})`);
    doc.moveDown(0.5);
    onProbation.forEach((m, i) => {
      if (doc.y > doc.page.height - 60) doc.addPage();
      tableRow(doc, [
        { text: `${m.firstName} ${m.lastName}`, width: 200 },
        { text: m.email, width: 200 },
        { text: m.gpa != null ? m.gpa.toFixed(2) : 'N/A', width: 80 },
      ], doc.y, false, i % 2 === 0);
      doc.moveDown(0.35);
    });
  }

  sectionTitle(doc, 'Full Academic Standing');
  doc.moveDown(0.5);
  tableRow(doc, [
    { text: 'Name', width: 150 }, { text: 'Major', width: 120 },
    { text: 'GPA', width: 60 }, { text: 'Study Hrs', width: 70 }, { text: 'Standing', width: 120 },
  ], doc.y, true);
  doc.moveDown(0.4);
  members.forEach((m, i) => {
    if (doc.y > doc.page.height - 60) doc.addPage();
    const standing = m.onProbation ? 'Probation' : m.gpa >= 3.5 ? 'Honors' : m.gpa >= 3.0 ? 'Good' : m.gpa >= 2.5 ? 'Satisfactory' : m.gpa != null ? 'At Risk' : '—';
    tableRow(doc, [
      { text: `${m.firstName} ${m.lastName}`, width: 150 },
      { text: m.major || '—', width: 120 },
      { text: m.gpa != null ? m.gpa.toFixed(2) : '—', width: 60 },
      { text: `${m.studyHours || 0}h`, width: 70 },
      { text: standing, width: 120 },
    ], doc.y, false, i % 2 === 0);
    doc.moveDown(0.35);
  });

  doc.end();
};

const generateEvents = async (req, res) => {
  const orgId = req.user.orgId;
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  const events = await prisma.event.findMany({
    where: { orgId },
    include: { attendances: true },
    orderBy: { date: 'desc' },
  });
  const memberCount = await prisma.member.count({ where: { orgId } });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="events.pdf"');

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);
  header(doc, org, 'Event & Attendance Report');

  doc.y += 10;
  doc.fontSize(11).fillColor(NAVY).font('Helvetica-Bold').text(`Total Events: ${events.length}`, 40, doc.y);
  doc.y += 20;

  sectionTitle(doc, 'Event Summary');
  doc.moveDown(0.5);
  tableRow(doc, [
    { text: 'Event', width: 180 }, { text: 'Date', width: 80 },
    { text: 'Type', width: 70 }, { text: 'Attended', width: 70 }, { text: 'Rate', width: 60 },
  ], doc.y, true);
  doc.moveDown(0.4);

  events.forEach((e, i) => {
    if (doc.y > doc.page.height - 60) doc.addPage();
    const attended = e.attendances.filter(a => a.checkedIn).length;
    const rate = memberCount > 0 ? Math.round((attended / memberCount) * 100) : 0;
    tableRow(doc, [
      { text: e.title, width: 180 },
      { text: new Date(e.date).toLocaleDateString(), width: 80 },
      { text: e.type, width: 70 },
      { text: String(attended), width: 70 },
      { text: `${rate}%`, width: 60 },
    ], doc.y, false, i % 2 === 0);
    doc.moveDown(0.35);
  });

  doc.end();
};

const generateRisk = async (req, res) => {
  const orgId = req.user.orgId;
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  const riskItems = await prisma.riskItem.findMany({
    where: { orgId },
    include: { completions: { include: { member: { select: { firstName: true, lastName: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  const memberCount = await prisma.member.count({ where: { orgId } });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="risk.pdf"');

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);
  header(doc, org, 'Risk Management Report');

  doc.y += 10;
  const completed = riskItems.filter(r => r.completions.length >= memberCount || !r.required);
  doc.fontSize(11).fillColor(NAVY).font('Helvetica-Bold')
    .text(`Risk Items: ${riskItems.length} total · ${completed.length} fully complete`, 40, doc.y);
  doc.y += 20;

  sectionTitle(doc, 'Risk Item Status');
  doc.moveDown(0.5);
  tableRow(doc, [
    { text: 'Item', width: 200 }, { text: 'Required', width: 70 },
    { text: 'Completions', width: 90 }, { text: 'Due Date', width: 90 }, { text: 'Status', width: 70 },
  ], doc.y, true);
  doc.moveDown(0.4);

  riskItems.forEach((r, i) => {
    if (doc.y > doc.page.height - 60) doc.addPage();
    const pct = memberCount > 0 ? Math.round((r.completions.length / memberCount) * 100) : 0;
    const status = r.completions.length >= memberCount ? 'Complete' : r.required ? 'Incomplete' : 'Optional';
    tableRow(doc, [
      { text: r.title, width: 200 },
      { text: r.required ? 'Yes' : 'No', width: 70 },
      { text: `${r.completions.length}/${memberCount} (${pct}%)`, width: 90 },
      { text: r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—', width: 90 },
      { text: status, width: 70 },
    ], doc.y, false, i % 2 === 0);
    doc.moveDown(0.35);
  });

  doc.end();
};

const generateRecruitment = async (req, res) => {
  const orgId = req.user.orgId;
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  const pnms = await prisma.pNM.findMany({
    where: { orgId },
    include: { votes: true },
    orderBy: { createdAt: 'desc' },
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="recruitment.pdf"');

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);
  header(doc, org, 'Recruitment Report');

  const pledged = pnms.filter(p => p.stage === 'pledged').length;
  const dropped = pnms.filter(p => p.stage === 'dropped').length;
  const active = pnms.filter(p => !['pledged','dropped'].includes(p.stage)).length;
  const convRate = pnms.length > 0 ? Math.round((pledged / pnms.length) * 100) : 0;

  doc.y += 10;
  doc.fontSize(11).fillColor(NAVY).font('Helvetica-Bold')
    .text(`PNMs: ${pnms.length} total · ${pledged} pledged · ${active} active · ${convRate}% conversion`, 40, doc.y);
  doc.y += 20;

  sectionTitle(doc, 'PNM Pipeline');
  doc.moveDown(0.5);
  tableRow(doc, [
    { text: 'Name', width: 140 }, { text: 'Stage', width: 80 },
    { text: 'Major', width: 100 }, { text: 'Avg Score', width: 80 }, { text: 'Votes', width: 60 },
  ], doc.y, true);
  doc.moveDown(0.4);

  pnms.forEach((p, i) => {
    if (doc.y > doc.page.height - 60) doc.addPage();
    tableRow(doc, [
      { text: `${p.firstName} ${p.lastName}`, width: 140 },
      { text: p.stage, width: 80 },
      { text: p.major || '—', width: 100 },
      { text: p.avgScore ? p.avgScore.toFixed(1) : '—', width: 80 },
      { text: String(p.votes.length), width: 60 },
    ], doc.y, false, i % 2 === 0);
    doc.moveDown(0.35);
  });

  doc.end();
};

module.exports = { generateRoster, generateFinancial, generateAcademic, generateEvents, generateRisk, generateRecruitment };
