const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16',
});

const PLANS = {
  basic: {
    name: 'Basic',
    price: 4900,
    priceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic',
    memberLimit: 50,
    features: ['Up to 50 members', 'Recruitment CRM', 'Event management', 'Dues tracking'],
  },
  standard: {
    name: 'Standard',
    price: 8900,
    priceId: process.env.STRIPE_STANDARD_PRICE_ID || 'price_standard',
    memberLimit: 150,
    features: ['Up to 150 members', 'All Basic features', 'Guest list management', 'Document storage', 'Email reminders'],
  },
  pro: {
    name: 'Pro',
    price: 14900,
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
    memberLimit: 999,
    features: ['Unlimited members', 'All Standard features', 'Stripe dues collection', 'Advanced analytics', 'Priority support'],
  },
};

const createCustomer = async ({ email, name, orgName }) => {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { orgName },
    });
    return { success: true, customerId: customer.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const createCheckoutSession = async ({ customerId, priceId, orgId, successUrl, cancelUrl }) => {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { orgId },
    });
    return { success: true, url: session.url, sessionId: session.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const createPortalSession = async ({ customerId, returnUrl }) => {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { success: true, url: session.url };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const constructWebhookEvent = (payload, sig) => {
  return stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
};

const createPaymentIntent = async ({ amount, currency = 'usd', customerId, metadata }) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      customer: customerId,
      metadata,
      automatic_payment_methods: { enabled: true },
    });
    return { success: true, clientSecret: paymentIntent.client_secret, id: paymentIntent.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { stripe, PLANS, createCustomer, createCheckoutSession, createPortalSession, constructWebhookEvent, createPaymentIntent };
