const { PrismaClient } = require('@prisma/client');
const { PLANS, createCustomer, createCheckoutSession, createPortalSession, constructWebhookEvent } = require('../utils/stripe');

const prisma = new PrismaClient();

const getPlans = async (req, res) => {
  try {
    return res.json({ success: true, data: PLANS });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to fetch plans' });
  }
};

const getBillingInfo = async (req, res) => {
  try {
    const org = await prisma.organization.findUnique({ where: { id: req.user.orgId } });
    if (!org) return res.status(404).json({ success: false, error: 'Organization not found' });

    const memberCount = await prisma.member.count({ where: { orgId: req.user.orgId } });
    const plan = PLANS[org.plan] || null;

    return res.json({
      success: true,
      data: {
        org: {
          id: org.id, name: org.name, plan: org.plan,
          trialEndsAt: org.trialEndsAt,
          stripeCustomerId: org.stripeCustomerId ? '***' : null,
          stripeSubscriptionId: org.stripeSubscriptionId ? '***' : null,
        },
        memberCount,
        plan,
        memberLimit: plan ? plan.memberLimit : 10,
        trialDaysLeft: org.trialEndsAt ? Math.max(0, Math.ceil((new Date(org.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24))) : 0,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to fetch billing info' });
  }
};

const createCheckout = async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ success: false, error: 'Invalid plan' });

    const org = await prisma.organization.findUnique({ where: { id: req.user.orgId } });
    const member = await prisma.member.findUnique({ where: { id: req.user.id } });

    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const result = await createCustomer({
        email: member.email,
        name: `${member.firstName} ${member.lastName}`,
        orgName: org.name,
      });
      if (!result.success) return res.status(500).json({ success: false, error: 'Failed to create customer' });
      customerId = result.customerId;
      await prisma.organization.update({ where: { id: req.user.orgId }, data: { stripeCustomerId: customerId } });
    }

    const result = await createCheckoutSession({
      customerId,
      priceId: PLANS[plan].priceId,
      orgId: req.user.orgId,
      successUrl: `${process.env.FRONTEND_URL}/billing?success=true`,
      cancelUrl: `${process.env.FRONTEND_URL}/billing?canceled=true`,
    });

    if (!result.success) return res.status(500).json({ success: false, error: 'Failed to create checkout' });
    return res.json({ success: true, data: { url: result.url } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to create checkout session' });
  }
};

const createPortal = async (req, res) => {
  try {
    const org = await prisma.organization.findUnique({ where: { id: req.user.orgId } });
    if (!org.stripeCustomerId) {
      return res.status(400).json({ success: false, error: 'No billing account found' });
    }

    const result = await createPortalSession({
      customerId: org.stripeCustomerId,
      returnUrl: `${process.env.FRONTEND_URL}/billing`,
    });

    if (!result.success) return res.status(500).json({ success: false, error: 'Failed to create portal' });
    return res.json({ success: true, data: { url: result.url } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to create portal session' });
  }
};

const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = constructWebhookEvent(req.body, sig);
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const orgId = session.metadata.orgId;
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            stripeSubscriptionId: session.subscription,
            plan: session.metadata.plan || 'basic',
          },
        });
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const org = await prisma.organization.findFirst({ where: { stripeCustomerId: sub.customer } });
        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: { stripeSubscriptionId: sub.id },
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const org = await prisma.organization.findFirst({ where: { stripeCustomerId: sub.customer } });
        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: { plan: 'trial', stripeSubscriptionId: null },
          });
        }
        break;
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};

module.exports = { getPlans, getBillingInfo, createCheckout, createPortal, handleWebhook };
