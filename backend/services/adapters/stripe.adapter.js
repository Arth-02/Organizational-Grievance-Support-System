const PaymentProviderAdapter = require('./paymentProvider.adapter');

/**
 * Payment error class for standardized error handling
 */
class PaymentError extends Error {
  constructor(code, message, providerError = null) {
    super(message);
    this.name = 'PaymentError';
    this.code = code;
    this.providerError = providerError;
  }
}

/**
 * Payment error codes for consistent error handling across providers
 */
const PaymentErrorCodes = {
  CARD_DECLINED: 'card_declined',
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  EXPIRED_CARD: 'expired_card',
  INVALID_CARD: 'invalid_card',
  PROCESSING_ERROR: 'processing_error',
  PROVIDER_UNAVAILABLE: 'provider_unavailable',
  INVALID_AMOUNT: 'invalid_amount',
  DUPLICATE_TRANSACTION: 'duplicate_transaction',
  INVALID_CUSTOMER: 'invalid_customer',
  INVALID_SUBSCRIPTION: 'invalid_subscription',
  WEBHOOK_SIGNATURE_INVALID: 'webhook_signature_invalid'
};

/**
 * StripeAdapter - Stripe-specific implementation of PaymentProviderAdapter
 * 
 * Implements all payment operations using the Stripe SDK with proper
 * status normalization and error mapping.
 * 
 * @extends PaymentProviderAdapter
 * @requirements 4.1, 4.2, 4.7
 */
class StripeAdapter extends PaymentProviderAdapter {
  /**
   * Create a new StripeAdapter instance
   * @param {Object} config - Stripe configuration
   * @param {string} config.secretKey - Stripe secret API key
   * @param {string} [config.webhookSecret] - Stripe webhook signing secret
   */
  constructor(config) {
    super();
    if (!config.secretKey) {
      throw new Error('Stripe secret key is required');
    }
    this.stripe = require('stripe')(config.secretKey);
    this.webhookSecret = config.webhookSecret;
  }

  /**
   * Get the provider name
   * @returns {string} 'stripe'
   */
  getProviderName() {
    return 'stripe';
  }


  /**
   * Create a customer in Stripe
   * @param {Object} customerData - Customer information
   * @returns {Promise<{customerId: string, providerData: Object}>}
   */
  async createCustomer(customerData) {
    try {
      // Ensure organizationId is converted to string for Stripe metadata
      const metadata = {
        ...(customerData.organizationId && { organizationId: String(customerData.organizationId) }),
        ...customerData.metadata
      };
      
      // Convert any non-string metadata values to strings
      Object.keys(metadata).forEach(key => {
        if (metadata[key] !== null && metadata[key] !== undefined) {
          metadata[key] = String(metadata[key]);
        }
      });

      const customer = await this.stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        metadata
      });
      return {
        customerId: customer.id,
        providerData: customer
      };
    } catch (error) {
      throw this._mapStripeError(error);
    }
  }

  /**
   * Create a payment intent in Stripe
   * @param {Object} paymentData - Payment information
   * @returns {Promise<{paymentIntentId: string, clientSecret: string, status: string}>}
   */
  async createPaymentIntent(paymentData) {
    try {
      // Ensure all metadata values are strings
      const metadata = { ...(paymentData.metadata || {}) };
      Object.keys(metadata).forEach(key => {
        if (metadata[key] !== null && metadata[key] !== undefined) {
          metadata[key] = String(metadata[key]);
        }
      });

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: paymentData.amount,
        currency: paymentData.currency || 'usd',
        customer: paymentData.customerId,
        metadata,
        automatic_payment_methods: { enabled: true }
      });
      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: this._normalizePaymentStatus(paymentIntent.status)
      };
    } catch (error) {
      throw this._mapStripeError(error);
    }
  }

  /**
   * Confirm a payment intent
   * @param {string} paymentIntentId - The payment intent ID
   * @returns {Promise<{status: string, paidAt: Date, providerData: Object}>}
   */
  async confirmPayment(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return {
        status: this._normalizePaymentStatus(paymentIntent.status),
        paidAt: paymentIntent.status === 'succeeded' 
          ? new Date(paymentIntent.created * 1000) 
          : null,
        providerData: paymentIntent
      };
    } catch (error) {
      throw this._mapStripeError(error);
    }
  }

  /**
   * Create a subscription in Stripe
   * @param {Object} subscriptionData - Subscription information
   * @returns {Promise<{subscriptionId: string, status: string, currentPeriodEnd: Date, clientSecret?: string}>}
   */
  async createSubscription(subscriptionData) {
    try {
      // Ensure all metadata values are strings
      const metadata = { ...(subscriptionData.metadata || {}) };
      Object.keys(metadata).forEach(key => {
        if (metadata[key] !== null && metadata[key] !== undefined) {
          metadata[key] = String(metadata[key]);
        }
      });

      const subscriptionParams = {
        customer: subscriptionData.customerId,
        items: [{ price: subscriptionData.priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata
      };

      if (subscriptionData.trialDays && subscriptionData.trialDays > 0) {
        subscriptionParams.trial_period_days = subscriptionData.trialDays;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionParams);
      
      return {
        subscriptionId: subscription.id,
        status: this._normalizeSubscriptionStatus(subscription.status),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret || null
      };
    } catch (error) {
      throw this._mapStripeError(error);
    }
  }


  /**
   * Update an existing subscription
   * @param {string} subscriptionId - The subscription ID
   * @param {Object} updateData - Update information
   * @returns {Promise<{subscriptionId: string, status: string, currentPeriodEnd: Date}>}
   */
  async updateSubscription(subscriptionId, updateData) {
    try {
      // First get the subscription to find the item ID
      const currentSubscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      const itemId = currentSubscription.items.data[0].id;

      const updateParams = {
        items: [{
          id: itemId,
          price: updateData.priceId
        }],
        proration_behavior: updateData.prorationBehavior || 'create_prorations'
      };

      const subscription = await this.stripe.subscriptions.update(
        subscriptionId,
        updateParams
      );

      return {
        subscriptionId: subscription.id,
        status: this._normalizeSubscriptionStatus(subscription.status),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        currentPeriodStart: new Date(subscription.current_period_start * 1000)
      };
    } catch (error) {
      throw this._mapStripeError(error);
    }
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - The subscription ID
   * @param {Object} options - Cancellation options
   * @returns {Promise<{status: string, cancelAt: Date}>}
   */
  async cancelSubscription(subscriptionId, options = {}) {
    try {
      const cancelAtPeriodEnd = options.cancelAtPeriodEnd !== false;

      let subscription;
      if (cancelAtPeriodEnd) {
        subscription = await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
        });
      } else {
        subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      }

      return {
        status: this._normalizeSubscriptionStatus(subscription.status),
        cancelAt: subscription.cancel_at 
          ? new Date(subscription.cancel_at * 1000) 
          : new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      };
    } catch (error) {
      throw this._mapStripeError(error);
    }
  }

  /**
   * Process a refund
   * @param {string} paymentId - The payment intent ID
   * @param {Object} refundData - Refund information
   * @returns {Promise<{refundId: string, status: string, amount: number}>}
   */
  async refund(paymentId, refundData = {}) {
    try {
      const refundParams = {
        payment_intent: paymentId
      };

      if (refundData.amount) {
        refundParams.amount = refundData.amount;
      }

      if (refundData.reason) {
        refundParams.reason = this._mapRefundReason(refundData.reason);
      }

      const refund = await this.stripe.refunds.create(refundParams);

      return {
        refundId: refund.id,
        status: this._normalizeRefundStatus(refund.status),
        amount: refund.amount
      };
    } catch (error) {
      throw this._mapStripeError(error);
    }
  }


  /**
   * Attach a payment method to a customer
   * @param {string} customerId - Stripe customer ID
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<{paymentMethodId: string, type: string, last4: string, brand?: string, expiryMonth?: number, expiryYear?: number}>}
   */
  async attachPaymentMethod(customerId, paymentMethodId) {
    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(
        paymentMethodId,
        { customer: customerId }
      );

      return this._normalizePaymentMethod(paymentMethod);
    } catch (error) {
      throw this._mapStripeError(error);
    }
  }

  /**
   * Detach a payment method from a customer
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<{success: boolean}>}
   */
  async detachPaymentMethod(paymentMethodId) {
    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);
      return { success: true };
    } catch (error) {
      throw this._mapStripeError(error);
    }
  }

  /**
   * List payment methods for a customer
   * @param {string} customerId - Stripe customer ID
   * @param {string} type - Payment method type
   * @returns {Promise<Array>}
   */
  async listPaymentMethods(customerId, type = 'card') {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: type
      });

      return paymentMethods.data.map(pm => this._normalizePaymentMethod(pm));
    } catch (error) {
      throw this._mapStripeError(error);
    }
  }

  /**
   * Verify webhook signature and parse event
   * @param {string|Buffer} payload - Raw webhook payload
   * @param {string} signature - Stripe signature header
   * @returns {Object} Parsed webhook event
   */
  verifyWebhookSignature(payload, signature) {
    if (!this.webhookSecret) {
      throw new PaymentError(
        PaymentErrorCodes.WEBHOOK_SIGNATURE_INVALID,
        'Webhook secret not configured'
      );
    }

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );
    } catch (error) {
      throw new PaymentError(
        PaymentErrorCodes.WEBHOOK_SIGNATURE_INVALID,
        'Invalid webhook signature',
        error
      );
    }
  }


  // ==================== Status Normalization Methods ====================

  /**
   * Normalize Stripe payment intent status to common format
   * @param {string} stripeStatus - Stripe payment intent status
   * @returns {string} Normalized status
   * @private
   */
  _normalizePaymentStatus(stripeStatus) {
    const statusMap = {
      'requires_payment_method': 'pending',
      'requires_confirmation': 'pending',
      'requires_action': 'requires_action',
      'processing': 'processing',
      'requires_capture': 'processing',
      'succeeded': 'succeeded',
      'canceled': 'cancelled'
    };
    return statusMap[stripeStatus] || stripeStatus;
  }

  /**
   * Normalize Stripe subscription status to common format
   * @param {string} stripeStatus - Stripe subscription status
   * @returns {string} Normalized status
   * @private
   */
  _normalizeSubscriptionStatus(stripeStatus) {
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
    return statusMap[stripeStatus] || stripeStatus;
  }

  /**
   * Normalize Stripe refund status to common format
   * @param {string} stripeStatus - Stripe refund status
   * @returns {string} Normalized status
   * @private
   */
  _normalizeRefundStatus(stripeStatus) {
    const statusMap = {
      'succeeded': 'succeeded',
      'pending': 'pending',
      'failed': 'failed',
      'canceled': 'cancelled',
      'requires_action': 'requires_action'
    };
    return statusMap[stripeStatus] || stripeStatus;
  }

  /**
   * Normalize payment method to common format
   * @param {Object} paymentMethod - Stripe payment method object
   * @returns {Object} Normalized payment method
   * @private
   */
  _normalizePaymentMethod(paymentMethod) {
    const normalized = {
      id: paymentMethod.id,
      type: paymentMethod.type
    };

    if (paymentMethod.card) {
      normalized.last4 = paymentMethod.card.last4;
      normalized.brand = paymentMethod.card.brand;
      normalized.expiryMonth = paymentMethod.card.exp_month;
      normalized.expiryYear = paymentMethod.card.exp_year;
    }

    return normalized;
  }

  /**
   * Map refund reason to Stripe format
   * @param {string} reason - Generic refund reason
   * @returns {string} Stripe refund reason
   * @private
   */
  _mapRefundReason(reason) {
    const reasonMap = {
      'duplicate': 'duplicate',
      'fraudulent': 'fraudulent',
      'requested_by_customer': 'requested_by_customer'
    };
    return reasonMap[reason] || 'requested_by_customer';
  }


  // ==================== Error Mapping ====================

  /**
   * Map Stripe errors to standardized PaymentError
   * @param {Error} error - Stripe error
   * @returns {PaymentError} Standardized payment error
   * @private
   */
  _mapStripeError(error) {
    // Handle Stripe-specific error types
    if (error.type === 'StripeCardError') {
      const codeMap = {
        'card_declined': PaymentErrorCodes.CARD_DECLINED,
        'insufficient_funds': PaymentErrorCodes.INSUFFICIENT_FUNDS,
        'expired_card': PaymentErrorCodes.EXPIRED_CARD,
        'incorrect_cvc': PaymentErrorCodes.INVALID_CARD,
        'incorrect_number': PaymentErrorCodes.INVALID_CARD,
        'invalid_expiry_month': PaymentErrorCodes.INVALID_CARD,
        'invalid_expiry_year': PaymentErrorCodes.INVALID_CARD
      };
      const code = codeMap[error.code] || PaymentErrorCodes.CARD_DECLINED;
      return new PaymentError(code, error.message, error);
    }

    if (error.type === 'StripeInvalidRequestError') {
      if (error.message.includes('customer')) {
        return new PaymentError(
          PaymentErrorCodes.INVALID_CUSTOMER,
          error.message,
          error
        );
      }
      if (error.message.includes('subscription')) {
        return new PaymentError(
          PaymentErrorCodes.INVALID_SUBSCRIPTION,
          error.message,
          error
        );
      }
      return new PaymentError(
        PaymentErrorCodes.PROCESSING_ERROR,
        error.message,
        error
      );
    }

    if (error.type === 'StripeAPIError' || error.type === 'StripeConnectionError') {
      return new PaymentError(
        PaymentErrorCodes.PROVIDER_UNAVAILABLE,
        'Payment provider is temporarily unavailable',
        error
      );
    }

    if (error.type === 'StripeIdempotencyError') {
      return new PaymentError(
        PaymentErrorCodes.DUPLICATE_TRANSACTION,
        'Duplicate transaction detected',
        error
      );
    }

    // Default error mapping
    return new PaymentError(
      PaymentErrorCodes.PROCESSING_ERROR,
      error.message || 'An unexpected error occurred',
      error
    );
  }
}

module.exports = {
  StripeAdapter,
  PaymentError,
  PaymentErrorCodes
};
