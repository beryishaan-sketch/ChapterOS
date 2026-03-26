const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

// Fuzzy field detection from CSV headers
const FIELD_MAP = {
  fullName:  ['fullname','full_name','name','brothername','brother','member','active','activename','membername','studentname','legalname'],
  firstName: ['first', 'firstname', 'first_name', 'fname', 'given', 'preferredname', 'preferred'],
  lastName:  ['last', 'lastname', 'last_name', 'lname', 'surname', 'family', 'familyname'],
  email:     ['email', 'mail', 'e-mail', 'emailaddress', 'email_address', 'scholemail', 'universitye'],
  phone:     ['phone', 'cell', 'mobile', 'number', 'contact', 'phonenumber', 'cellphone', 'cellnumber'],
  major:     ['major', 'program', 'study', 'degree', 'field', 'concentration', 'curriculum'],
  year:      ['year', 'grade', 'class', 'graduation', 'grad', 'classstanding', 'academicyear', 'classyear', 'graduationyear'],
  pledgeClass: ['pledge', 'pledgeclass', 'pledge_class', 'chapter', 'semester', 'cohort', 'initiationclass', 'initiationsemester', 'classof', 'pledgesemester'],
  gpa:       ['gpa', 'grade point', 'grades', 'academic', 'gradepoint', 'cumulativegpa', 'cumgpa'],
  position:  ['position', 'role', 'title', 'office', 'officer', 'execposition', 'chapterrole', 'officertitle'],
  hometown:  ['hometown', 'home', 'city', 'from', 'homecity', 'homestate', 'origin'],
  linkedin:  ['linkedin', 'linkedinurl', 'linkedin_url', 'profile'],
  mutualConnections: ['mutual', 'connections', 'referred', 'referral', 'knows', 'referredby', 'mutualfriend'],
  notes:     ['notes', 'comments', 'remarks', 'note', 'memo', 'additional', 'info', 'other'],
  // Dues fields
  duesPaid:  ['paid', 'dues', 'payment', 'duespaid', 'paidstatus', 'dusstatus'],
  duesAmount:['amount', 'balance', 'owes', 'dueesamount', 'totaldue'],
  // Events fields
  eventTitle:    ['event', 'eventtitle', 'eventname', 'title'],
  eventDate:     ['date', 'eventdate', 'when', 'datetime'],
  eventLocation: ['location', 'venue', 'where', 'place', 'address'],
  eventType:     ['type', 'eventtype', 'category', 'kind'],
};

function detectMapping(headers) {
  const mapping = {};
  headers.forEach(header => {
    const h = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [field, aliases] of Object.entries(FIELD_MAP)) {
      if (aliases.some(a => h.includes(a.replace(/[^a-z0-9]/g, '')))) {
        if (!mapping[field]) mapping[field] = header;
        break;
      }
    }
  });
  return mapping;
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  // Handle quoted fields
  const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).filter(l => l.trim()).map(line => {
    const values = parseLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });

  return { headers, rows };
}

// Auto-detect what kind of data this CSV likely contains
function detectDataType(headers, rows) {
  const flat = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, '')).join(' ');
  const scores = { members: 0, pnms: 0, events: 0, dues: 0 };

  // Event signals
  if (/date|when|datetime|eventdate/.test(flat)) scores.events += 3;
  if (/event|party|social|formal|philanthropy|mixer|venue|location/.test(flat)) scores.events += 2;
  if (/title|eventname|eventtitle/.test(flat)) scores.events += 1;

  // Member signals
  if (/gpa|gradepoint|cumulative/.test(flat)) scores.members += 3;
  if (/pledgeclass|initiationsemester|classof/.test(flat)) scores.members += 3;
  if (/major|program|degree/.test(flat)) scores.members += 2;
  if (/brother|active|member|roster/.test(flat)) scores.members += 2;
  if (/position|officer|role|title/.test(flat)) scores.members += 1;

  // Dues signals
  if (/dues|paid|balance|owes|payment|amount/.test(flat)) scores.dues += 3;
  if (/semester|term/.test(flat)) scores.dues += 1;

  // PNM signals
  if (/pnm|rush|rushee|recruit|prospect|mutual|referr/.test(flat)) scores.pnms += 3;
  if (/score|rating|interest|bid/.test(flat)) scores.pnms += 2;

  // Name/email signals boost both members and pnms
  if (/name|firstname|lastname/.test(flat)) { scores.members += 1; scores.pnms += 1; }
  if (/email|phone/.test(flat)) { scores.members += 1; scores.pnms += 1; }

  // Pick highest score, default to members
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  // If dues detected, still import as members (dues column gets mapped)
  const type = best[0] === 'dues' ? 'members' : best[0];
  const confidence = best[1] >= 3 ? 'high' : best[1] >= 1 ? 'medium' : 'low';

  return { detectedType: type, confidence, scores };
}

const preview = async (req, res) => {
  try {
    const { csv } = req.body;
    if (!csv) return res.status(400).json({ success: false, error: 'CSV text required' });

    const { headers, rows } = parseCSV(csv);
    if (headers.length === 0) return res.status(400).json({ success: false, error: 'No columns detected — make sure your CSV has a header row' });

    const suggestedMapping = detectMapping(headers);
    const { detectedType, confidence, scores } = detectDataType(headers, rows);

    return res.json({
      success: true,
      data: {
        headers,
        preview: rows.slice(0, 5),
        totalRows: rows.length,
        suggestedMapping,
        detectedType,
        confidence,
        scores,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to parse CSV' });
  }
};

// Split "Full Name" into first/last intelligently
function splitFullName(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  if (parts.length === 2) return { firstName: parts[0], lastName: parts[1] };
  // 3+ parts: first = first word, last = last word, middle ignored
  return { firstName: parts[0], lastName: parts[parts.length - 1] };
}

function resolveNameFields(row, mapping) {
  // If we have dedicated first/last columns, use those
  if (mapping.firstName && mapping.lastName) {
    return {
      firstName: row[mapping.firstName]?.trim() || '',
      lastName: row[mapping.lastName]?.trim() || '',
    };
  }
  // If only first name mapped
  if (mapping.firstName && !mapping.lastName) {
    return { firstName: row[mapping.firstName]?.trim() || '', lastName: '' };
  }
  // If fullName column mapped
  if (mapping.fullName) {
    return splitFullName(row[mapping.fullName] || '');
  }
  return { firstName: '', lastName: '' };
}

const importMembers = async (req, res) => {
  try {
    const { csv, mapping } = req.body;
    if (!csv || !mapping) return res.status(400).json({ success: false, error: 'CSV and mapping required' });

    const { rows } = parseCSV(csv);
    const orgId = req.user.orgId;
    const defaultPassword = await bcrypt.hash('ChapterHQ2024!', 12);

    let created = 0, skipped = 0, errors = [];

    // If dues fields are mapped, find or create a dues record for current semester
    let duesRecord = null;
    const hasDuesData = mapping.duesPaid || mapping.duesAmount;
    if (hasDuesData) {
      const now = new Date();
      const semester = now.getMonth() < 6 ? `Spring ${now.getFullYear()}` : `Fall ${now.getFullYear()}`;
      duesRecord = await prisma.duesRecord.findFirst({
        where: { orgId, semester },
      });
      if (!duesRecord) {
        duesRecord = await prisma.duesRecord.create({
          data: {
            orgId, semester,
            amount: 0, // will be updated from data or left as 0
            dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
          },
        });
      }
    }

    for (const row of rows) {
      try {
        const { firstName, lastName } = resolveNameFields(row, mapping);
        if (!firstName) { skipped++; continue; }

        const email = mapping.email ? row[mapping.email]?.trim()?.toLowerCase() : null;

        const rawGpa = mapping.gpa ? row[mapping.gpa]?.trim() : null;
        const gpa = rawGpa ? parseFloat(rawGpa.replace(',', '.')) || null : null;

        // Find existing member or create new one
        let member = email ? await prisma.member.findFirst({ where: { email, orgId } }) : null;
        if (!member) {
          // Also try matching by name if no email
          if (!email) {
            member = await prisma.member.findFirst({
              where: { orgId, firstName: { equals: firstName, mode: 'insensitive' }, lastName: { equals: lastName || '', mode: 'insensitive' } }
            });
          }
        }

        if (!member) {
          member = await prisma.member.create({
            data: {
              orgId, firstName, lastName,
              email: email || `${firstName.toLowerCase()}.${(lastName || 'member').toLowerCase()}.import@chapter.local`,
              passwordHash: defaultPassword,
              role: 'member',
              position:    mapping.position    ? row[mapping.position]?.trim()    || null : null,
              pledgeClass: mapping.pledgeClass ? row[mapping.pledgeClass]?.trim() || null : null,
              year:        mapping.year        ? row[mapping.year]?.trim()        || null : null,
              major:       mapping.major       ? row[mapping.major]?.trim()       || null : null,
              phone:       mapping.phone       ? row[mapping.phone]?.trim()       || null : null,
              gpa,
            },
          });
          created++;
        } else {
          // Update existing member with any new data
          const updates = {};
          if (gpa && !member.gpa) updates.gpa = gpa;
          if (mapping.pledgeClass && row[mapping.pledgeClass] && !member.pledgeClass) updates.pledgeClass = row[mapping.pledgeClass]?.trim();
          if (mapping.major && row[mapping.major] && !member.major) updates.major = row[mapping.major]?.trim();
          if (mapping.phone && row[mapping.phone] && !member.phone) updates.phone = row[mapping.phone]?.trim();
          if (Object.keys(updates).length > 0) {
            await prisma.member.update({ where: { id: member.id }, data: updates });
          }
          created++; // count updates too
        }

        // Handle dues status
        if (duesRecord && member) {
          const rawPaid = mapping.duesPaid ? row[mapping.duesPaid]?.trim()?.toLowerCase() : null;
          const isPaid = rawPaid && /^(yes|paid|true|1|✓|x|complete|done)$/i.test(rawPaid);
          const rawAmount = mapping.duesAmount ? parseFloat(row[mapping.duesAmount]?.replace(/[$,]/g, '')) * 100 : null;
          const amount = rawAmount && !isNaN(rawAmount) ? rawAmount : (duesRecord.amount || 0);

          // Update dues record amount if we found one
          if (rawAmount && !isNaN(rawAmount) && duesRecord.amount === 0) {
            await prisma.duesRecord.update({ where: { id: duesRecord.id }, data: { amount: rawAmount } });
          }

          await prisma.duesPayment.upsert({
            where: { memberId_duesRecordId: { memberId: member.id, duesRecordId: duesRecord.id } },
            update: { status: isPaid ? 'paid' : 'unpaid', paidAt: isPaid ? new Date() : null, amount: amount || 0 },
            create: { memberId: member.id, duesRecordId: duesRecord.id, amount: amount || 0, status: isPaid ? 'paid' : 'unpaid', paidAt: isPaid ? new Date() : null },
          });
        }

      } catch (err) {
        errors.push(`${err.message}`);
        skipped++;
      }
    }

    const duesSummary = duesRecord ? ` Dues status updated for ${created} members.` : '';
    return res.json({ success: true, data: { created, skipped, errors: errors.slice(0, 5), duesSummary } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Import failed' });
  }
};

const importPNMs = async (req, res) => {
  try {
    const { csv, mapping } = req.body;
    if (!csv || !mapping) return res.status(400).json({ success: false, error: 'CSV and mapping required' });

    const { rows } = parseCSV(csv);
    const orgId = req.user.orgId;

    let created = 0, skipped = 0;

    for (const row of rows) {
      try {
        const { firstName, lastName } = resolveNameFields(row, mapping);
        if (!firstName) { skipped++; continue; }

        await prisma.pNM.create({
          data: {
            orgId,
            firstName,
            lastName,
            email: mapping.email ? row[mapping.email]?.trim() || null : null,
            phone: mapping.phone ? row[mapping.phone]?.trim() || null : null,
            major: mapping.major ? row[mapping.major]?.trim() || null : null,
            year:  mapping.year  ? row[mapping.year]?.trim()  || null : null,
            mutualConnections: mapping.mutualConnections ? row[mapping.mutualConnections]?.trim() || null : null,
            notes: mapping.notes ? row[mapping.notes]?.trim() || null : null,
            stage: 'invited',
          },
        });
        created++;
      } catch { skipped++; }
    }

    return res.json({ success: true, data: { created, skipped } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Import failed' });
  }
};

// POST /import/events — bulk import events from CSV
const importEvents = async (req, res) => {
  try {
    const { csv, mapping } = req.body;
    if (!csv || !mapping) return res.status(400).json({ success: false, error: 'CSV and mapping required' });

    const { rows } = parseCSV(csv);
    const orgId = req.user.orgId;

    let created = 0, skipped = 0;

    for (const row of rows) {
      try {
        const title = mapping.eventTitle ? row[mapping.eventTitle]?.trim() : null;
        const dateStr = mapping.eventDate ? row[mapping.eventDate]?.trim() : null;
        if (!title || !dateStr) { skipped++; continue; }

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) { skipped++; continue; }

        await prisma.event.create({
          data: {
            orgId,
            title,
            date,
            location: mapping.eventLocation ? row[mapping.eventLocation]?.trim() || null : null,
            type:     mapping.eventType     ? row[mapping.eventType]?.trim()     || 'other' : 'other',
          },
        });
        created++;
      } catch { skipped++; }
    }

    return res.json({ success: true, data: { created, skipped } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Import failed' });
  }
};

module.exports = { preview, importMembers, importPNMs, importEvents };
