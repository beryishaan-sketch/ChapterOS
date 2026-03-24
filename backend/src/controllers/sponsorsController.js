const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getSponsors = async (req, res) => {
  try {
    const sponsors = await prisma.sponsor.findMany({
      where: { orgId: req.user.orgId },
      orderBy: [{ dealStatus: 'asc' }, { dealAmount: 'desc' }, { createdAt: 'desc' }],
    });
    return res.json({ success: true, data: sponsors });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to fetch sponsors' });
  }
};

const createSponsor = async (req, res) => {
  try {
    const { name, contactName, email, phone, website, category, dealAmount, dealStatus, dealNotes, tier } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' });
    const sponsor = await prisma.sponsor.create({
      data: {
        orgId: req.user.orgId,
        name, contactName, email, phone, website,
        category: category || 'other',
        dealAmount: dealAmount ? parseFloat(dealAmount) : null,
        dealStatus: dealStatus || 'prospect',
        dealNotes, tier,
      },
    });
    return res.status(201).json({ success: true, data: sponsor });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to create sponsor' });
  }
};

const updateSponsor = async (req, res) => {
  try {
    const { name, contactName, email, phone, website, category, dealAmount, dealStatus, dealNotes, tier } = req.body;
    const sponsor = await prisma.sponsor.updateMany({
      where: { id: req.params.id, orgId: req.user.orgId },
      data: {
        ...(name && { name }),
        ...(contactName !== undefined && { contactName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(website !== undefined && { website }),
        ...(category && { category }),
        ...(dealAmount !== undefined && { dealAmount: dealAmount ? parseFloat(dealAmount) : null }),
        ...(dealStatus && { dealStatus }),
        ...(dealNotes !== undefined && { dealNotes }),
        ...(tier !== undefined && { tier }),
      },
    });
    if (sponsor.count === 0) return res.status(404).json({ success: false, error: 'Sponsor not found' });
    const updated = await prisma.sponsor.findUnique({ where: { id: req.params.id } });
    return res.json({ success: true, data: updated });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to update sponsor' });
  }
};

const deleteSponsor = async (req, res) => {
  try {
    await prisma.sponsor.deleteMany({ where: { id: req.params.id, orgId: req.user.orgId } });
    return res.json({ success: true, data: { deleted: true } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to delete sponsor' });
  }
};

module.exports = { getSponsors, createSponsor, updateSponsor, deleteSponsor };
