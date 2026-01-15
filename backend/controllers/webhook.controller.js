const { paymentService } = require('../services/payment.service');
const { subscriptionService } = require('../services/subscription.service');
const { invoiceService } = require('../services/invoice.service');
const Payment = require('../models/payment.model');
const Subscription = require('../models/subscription.model');
const Invoice = require('../models/invoice.model');
const Organization = require('../models/organization.model');
const { sendEmail } = require('../utils/mail');

/**
 * WebhookController - Handles webhook events from payment providers
 * 
 * @requirements 4.5
 */

/**
 * Process Stripe webhook events
 * @param {Object} req - Express request object (with raw body)
 * @param {Object} res - Express response object
 */
const handleStripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  if (!signature) {
    console.error('Webhook Error: Missing stripe-signature header');
    return res.status(400).json({ error: 'Missing signature' });
  }

  // Verify webhook signature and parse event
  const verifyResult = paymentService.verifyWebhook('stripe', req.body, signature);
  
  if (!verifyResult.isSuccess) {
    console.error('Webhook Error:', verifyResult.message);
    return res.status(400).json({ error: verifyResult.message });
  }

  const event = verifyResult.data;
  
  console.log(`Processing Stripe webhook: ${event.type} (${event.id})`);

  try {
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return 200 to acknowledge receipt
    return res.status(200).json({ received: true, eventType: event.type });
  } catch (error) {
    console.error(`Webhook processing error for ${event.type}:`, error);
    // Still return 200 to prevent Stripe from retrying
    // We log the error for manual investigation
    return res.status(200).json({ 
      received: true, 
      processed: false, 
      error: error.message 
    });
  }
};

/**
 * Handle payment_intent.succeeded event
 * Updates payment status and creates invoice
 * @param {Object} paymentIntent - Stripe PaymentIntent object
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log(`Payment succeeded: ${paymentIntent.id}`);
  
  // Find payment record by provider payment ID
  const payment = await Payment.findOne({ 
    providerPaymentId: paymentIntent.id 
  });

  if (payment) {
    // Update payment status
    payment.status = 'succeeded';
    payment.paidAt = new Date(paymentIntent.created * 1000);
    await payment.save();

    // Generate invoice for this payment
    const invoiceResult = await invoiceService.generateInvoiceFromPayment(payment._id.toString());
    
    if (invoiceResult.isSuccess) {
      console.log(`Invoice generated: ${invoiceResult.data.invoiceNumber}`);
      
      // Send invoice email
      await invoiceService.sendInvoiceOnPayment(invoiceResult.data.invoiceId.toString());
    }
  } else {
    // Payment might be from a subscription - check metadata
    const organizationId = paymentIntent.metadata?.organizationId;
    if (organizationId) {
      console.log(`Payment for organization ${organizationId} succeeded, but no local payment record found`);
    }
  }
}


/**
 * Handle payment_intent.payment_failed event
 * Updates payment status and notifies admin
 * @param {Object} paymentIntent - Stripe PaymentIntent object
 */
async function handlePaymentIntentFailed(paymentIntent) {
  console.log(`Payment failed: ${paymentIntent.id}`);
  
  // Find payment record by provider payment ID
  const payment = await Payment.findOne({ 
    providerPaymentId: paymentIntent.id 
  });

  if (payment) {
    // Update payment status
    payment.status = 'failed';
    payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
    await payment.save();

    // Notify organization admin about failed payment
    await notifyPaymentFailure(payment.organization_id, payment, paymentIntent);
  }

  // If this is a subscription payment, update subscription status
  const subscriptionId = paymentIntent.metadata?.subscriptionId;
  if (subscriptionId) {
    const subscription = await Subscription.findOne({
      'providerData.subscriptionId': subscriptionId
    });
    
    if (subscription && subscription.status === 'active') {
      await subscriptionService.updateSubscriptionStatus(
        subscription._id.toString(),
        'past_due'
      );
    }
  }
}

/**
 * Handle customer.subscription.updated event
 * Syncs subscription status with local record
 * @param {Object} stripeSubscription - Stripe Subscription object
 */
async function handleSubscriptionUpdated(stripeSubscription) {
  console.log(`Subscription updated: ${stripeSubscription.id}`);
  
  // Find local subscription by Stripe subscription ID
  const subscription = await Subscription.findOne({
    'providerData.subscriptionId': stripeSubscription.id
  });

  if (!subscription) {
    console.log(`No local subscription found for Stripe subscription: ${stripeSubscription.id}`);
    return;
  }

  // Map Stripe status to our status
  const statusMap = {
    'trialing': 'trialing',
    'active': 'active',
    'past_due': 'past_due',
    'canceled': 'cancelled',
    'unpaid': 'past_due',
    'incomplete': 'pending',
    'incomplete_expired': 'expired',
    'paused': 'paused'
  };

  const newStatus = statusMap[stripeSubscription.status] || stripeSubscription.status;
  
  // Update subscription fields
  const updateData = {
    currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
    currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
  };

  if (stripeSubscription.cancel_at_period_end !== undefined) {
    updateData.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
  }

  if (stripeSubscription.canceled_at) {
    updateData.cancelledAt = new Date(stripeSubscription.canceled_at * 1000);
  }

  await subscriptionService.updateSubscriptionStatus(
    subscription._id.toString(),
    newStatus,
    updateData
  );

  console.log(`Subscription ${subscription._id} updated to status: ${newStatus}`);
}


/**
 * Handle customer.subscription.deleted event
 * Marks subscription as cancelled
 * @param {Object} stripeSubscription - Stripe Subscription object
 */
async function handleSubscriptionDeleted(stripeSubscription) {
  console.log(`Subscription deleted: ${stripeSubscription.id}`);
  
  // Find local subscription by Stripe subscription ID
  const subscription = await Subscription.findOne({
    'providerData.subscriptionId': stripeSubscription.id
  });

  if (!subscription) {
    console.log(`No local subscription found for Stripe subscription: ${stripeSubscription.id}`);
    return;
  }

  // Update subscription status to cancelled
  await subscriptionService.updateSubscriptionStatus(
    subscription._id.toString(),
    'cancelled',
    {
      cancelledAt: new Date(),
      cancelAtPeriodEnd: false
    }
  );

  console.log(`Subscription ${subscription._id} marked as cancelled`);

  // Notify organization about cancellation
  await notifySubscriptionCancelled(subscription.organization_id);
}

/**
 * Handle customer.subscription.created event
 * Syncs newly created subscription
 * @param {Object} stripeSubscription - Stripe Subscription object
 */
async function handleSubscriptionCreated(stripeSubscription) {
  console.log(`Subscription created: ${stripeSubscription.id}`);
  
  // Check if we already have this subscription
  const existingSubscription = await Subscription.findOne({
    'providerData.subscriptionId': stripeSubscription.id
  });

  if (existingSubscription) {
    console.log(`Subscription ${stripeSubscription.id} already exists locally`);
    return;
  }

  // This might be a subscription created directly in Stripe
  // We need to find the organization by customer ID
  const organization = await Organization.findOne({
    stripeCustomerId: stripeSubscription.customer
  });

  if (!organization) {
    console.log(`No organization found for Stripe customer: ${stripeSubscription.customer}`);
    return;
  }

  console.log(`New subscription for organization ${organization._id} - manual sync may be required`);
}

/**
 * Handle invoice.paid event
 * Updates invoice status
 * @param {Object} stripeInvoice - Stripe Invoice object
 */
async function handleInvoicePaid(stripeInvoice) {
  console.log(`Invoice paid: ${stripeInvoice.id}`);
  
  // Find local invoice by provider invoice ID
  const invoice = await Invoice.findOne({
    'providerData.invoiceId': stripeInvoice.id
  });

  if (invoice) {
    // Update invoice status
    await invoiceService.updateInvoiceStatus(
      invoice._id.toString(),
      'paid',
      { paidAt: new Date(stripeInvoice.status_transitions?.paid_at * 1000 || Date.now()) }
    );
    
    console.log(`Invoice ${invoice.invoiceNumber} marked as paid`);
    
    // Send payment confirmation email
    await invoiceService.sendInvoiceEmail(invoice._id.toString(), 'paid');
  } else {
    // Invoice might be from Stripe directly - create local record
    const subscription = await Subscription.findOne({
      'providerData.subscriptionId': stripeInvoice.subscription
    });

    if (subscription) {
      // Create invoice from Stripe data
      const invoiceResult = await invoiceService.generateInvoice({
        organizationId: subscription.organization_id.toString(),
        subscriptionId: subscription._id.toString(),
        amount: stripeInvoice.amount_paid,
        currency: stripeInvoice.currency,
        status: 'paid',
        lineItems: stripeInvoice.lines?.data?.map(line => ({
          description: line.description || 'Subscription',
          quantity: line.quantity || 1,
          unitPrice: line.amount,
          amount: line.amount
        })) || [],
        billingPeriod: {
          start: new Date(stripeInvoice.period_start * 1000),
          end: new Date(stripeInvoice.period_end * 1000)
        },
        providerData: {
          provider: 'stripe',
          invoiceId: stripeInvoice.id,
          hostedInvoiceUrl: stripeInvoice.hosted_invoice_url
        }
      });

      if (invoiceResult.isSuccess) {
        console.log(`Created local invoice: ${invoiceResult.data.invoiceNumber}`);
        await invoiceService.sendInvoiceOnPayment(invoiceResult.data.invoiceId.toString());
      }
    }
  }
}


/**
 * Handle invoice.payment_failed event
 * Updates status and triggers retry logic
 * @param {Object} stripeInvoice - Stripe Invoice object
 */
async function handleInvoicePaymentFailed(stripeInvoice) {
  console.log(`Invoice payment failed: ${stripeInvoice.id}`);
  
  // Find local invoice by provider invoice ID
  const invoice = await Invoice.findOne({
    'providerData.invoiceId': stripeInvoice.id
  });

  if (invoice) {
    // Update invoice status
    await invoiceService.updateInvoiceStatus(
      invoice._id.toString(),
      'failed'
    );
    
    console.log(`Invoice ${invoice.invoiceNumber} marked as failed`);
  }

  // Find subscription and update status
  const subscription = await Subscription.findOne({
    'providerData.subscriptionId': stripeInvoice.subscription
  });

  if (subscription) {
    // Update subscription to past_due
    await subscriptionService.updateSubscriptionStatus(
      subscription._id.toString(),
      'past_due'
    );

    // Notify organization about payment failure
    await notifyPaymentFailure(
      subscription.organization_id,
      null,
      { 
        id: stripeInvoice.id,
        amount: stripeInvoice.amount_due,
        currency: stripeInvoice.currency,
        attempt_count: stripeInvoice.attempt_count,
        next_payment_attempt: stripeInvoice.next_payment_attempt
      }
    );
  }
}

const { getEmailTemplate } = require('../utils/emailTemplate');

/**
 * Notify organization admin about payment failure
 * @param {string} organizationId - Organization ID
 * @param {Object} payment - Payment record (optional)
 * @param {Object} paymentDetails - Payment details from Stripe
 */
async function notifyPaymentFailure(organizationId, payment, paymentDetails) {
  try {
    const organization = await Organization.findById(organizationId);
    if (!organization) return;

    const recipientEmail = organization.billingEmail || organization.email;
    if (!recipientEmail) return;

    const amount = payment?.amount || paymentDetails?.amount || 0;
    const currency = payment?.currency || paymentDetails?.currency || 'usd';
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);

    const emailContent = getEmailTemplate({
      title: "Payment Failed",
      content: `
        <div class="alert alert-critical">
          <strong>Action Required:</strong> We were unable to process your payment of ${formattedAmount}.
        </div>
        <p>Hello ${organization.name},</p>
        <p>Please update your payment method to avoid any interruption to your service.</p>
        ${paymentDetails?.next_payment_attempt ? `
          <p>We will automatically retry the payment on ${new Date(paymentDetails.next_payment_attempt * 1000).toLocaleDateString()}.</p>
        ` : ''}
      `,
      actionUrl: `${process.env.FRONTEND_URL || ''}/settings/subscription`,
      actionText: "Update Payment Method",
      footerText: "If you have any questions, please contact our support team."
    });

    await sendEmail(recipientEmail, "Payment Failed - Action Required", emailContent);
    console.log(`Payment failure notification sent to ${recipientEmail}`);
  } catch (error) {
    console.error('Error sending payment failure notification:', error);
  }
}


/**
 * Notify organization about subscription cancellation
 * @param {string} organizationId - Organization ID
 */
async function notifySubscriptionCancelled(organizationId) {
  try {
    const organization = await Organization.findById(organizationId);
    if (!organization) return;

    const recipientEmail = organization.billingEmail || organization.email;
    if (!recipientEmail) return;

    const emailContent = getEmailTemplate({
      title: "Subscription Cancelled",
      content: `
        <p>Hello ${organization.name},</p>
        <p>Your subscription has been cancelled. You will continue to have access to your data in read-only mode.</p>
        <div class="alert alert-info">
          If you'd like to reactivate your subscription, you can do so at any time from your account settings.
        </div>
        <p>We're sorry to see you go. If there's anything we could have done better, please let us know.</p>
      `,
      actionUrl: `${process.env.FRONTEND_URL || ''}/settings/subscription`,
      actionText: "Reactivate Subscription",
      footerText: "Thank you for being a customer."
    });

    await sendEmail(recipientEmail, "Subscription Cancelled", emailContent);
    console.log(`Subscription cancellation notification sent to ${recipientEmail}`);
  } catch (error) {
    console.error('Error sending subscription cancellation notification:', error);
  }
}

module.exports = {
  handleStripeWebhook
};
