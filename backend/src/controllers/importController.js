const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

// Fuzzy field detection from CSV headers
const FIELD_MAP = {
  firstName: ['first', 'firstname', 'first_name', 'fname', 'given'],
  lastName: ['last', 'lastname', 'last_name', 'lname', 'surname', 'family'],
  email: ['email', 'mail', 'e-mail'],
  phone: ['phone', 'cell', 'mobile', 'number', 'contact'],
  major: ['major', 'program', 'study', 'degree', 'field'],
  year: ['year', 'grade', 'class', 'graduation', 'grad'],
  pledgeClass: ['pledge', 'pledgeclass', 'pledge_class', 'chapter', 'semester', 'cohort'],
  gpa: ['gpa', 'grade point', 'grades', 'academic'],
  position: ['position', 'role', 'title', 'office', 'officer'],
  mutualConnections: ['mutual', 'connections', 'referred', 'referral', 'knows'],
  notes: ['notes', 'comments', 'remarks', 'note', 'memo'],
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

const preview = async (req, res) => {
  try {
    const { csv } = req.body;
    if (!csv) return res.status(400).json({ success: false, error: 'CSV text required' });

    const { headers, rows } = parseCSV(csv);
    const suggestedMapping = detectMapping(headers);

    return res.json({
      success: true,
      data: {
        headers,
        preview: rows.slice(0, 5),
        totalRows: rows.length,
        suggestedMapping,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to parse CSV' });
  }
};

const importMembers = async (req, res) => {
  try {
    const { csv, mapping } = req.body;
    if (!csv || !mapping) return res.status(400).json({ success: false, error: 'CSV and mapping required' });

    const { rows } = parseCSV(csv);
    const orgId = req.user.orgId;
    const defaultPassword = await bcrypt.hash('ChapterOS2024!', 12);

    let created = 0, skipped = 0, errors = [];

    for (const row of rows) {
      try {
        const firstName = row[mapping.firstName]?.trim();
        const lastName = row[mapping.lastName]?.trim();
        const email = row[mapping.email]?.trim()?.toLowerCase();

        if (!firstName || !lastName) { skipped++; continue; }

        const exists = email && await prisma.member.findFirst({ where: { email, orgId } });
        if (exists) { skipped++; continue; }

        await prisma.member.create({
          data: {
            orgId,
            firstName,
            lastName,
            email: email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@chapter.local`,
            passwordHash: defaultPassword,
            role: 'member',
            position: mapping.position ? row[mapping.position]?.trim() : null,
            pledgeClass: mapping.pledgeClass ? row[mapping.pledgeClass]?.trim() : null,
            year: mapping.year ? row[mapping.year]?.trim() : null,
            major: mapping.major ? row[mapping.major]?.trim() : null,
            phone: mapping.phone ? row[mapping.phone]?.trim() : null,
            gpa: mapping.gpa && row[mapping.gpa] ? parseFloat(row[mapping.gpa]) || null : null,
          },
        });
        created++;
      } catch (err) {
        errors.push(err.message);
        skipped++;
      }
    }

    return res.json({ success: true, data: { created, skipped, errors: errors.slice(0, 5) } });
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
        const firstName = row[mapping.firstName]?.trim();
        const lastName = row[mapping.lastName]?.trim();
        if (!firstName || !lastName) { skipped++; continue; }

        await prisma.pNM.create({
          data: {
            orgId,
            firstName,
            lastName,
            email: mapping.email ? row[mapping.email]?.trim() : null,
            phone: mapping.phone ? row[mapping.phone]?.trim() : null,
            major: mapping.major ? row[mapping.major]?.trim() : null,
            year: mapping.year ? row[mapping.year]?.trim() : null,
            mutualConnections: mapping.mutualConnections ? row[mapping.mutualConnections]?.trim() : null,
            notes: mapping.notes ? row[mapping.notes]?.trim() : null,
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

module.exports = { preview, importMembers, importPNMs };
