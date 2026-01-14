const { StripeAdapter, PaymentError, PaymentErrorCodes } = require('./adapters/stripe.adapter');
const PaymentMethod = require('../models/paymentMethod.model');
const Payment = require('../models/payment.model');
const Organization = require('../models/organization.model');
const { isValidObjectId } = require('mongoose');

/**
 * PaymentService - Core service for payment operations
 * Uses adapter pattern to support multiple payment providers.
 * 
 * @requirements 3.2, 3.3, 3.4
 */
class PaymentService {
  constructor() {
    this.adapters = new Map();
    this._initializeAdapters();
  }

  /**
   * Initialize payment provider adapters based on environment configuration
   * @private
   */
  _initializeAdapters() {
    // Initialize Stripe adapter if configured
    if (process.env.STRIPE_SECRET_KEY) {
      this.adapters.set('stripe', new StripeAdapter({
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
      }));
    }

    // Future: Add more adapters here
    // if (process.env.RAZORPAY_KEY_ID) {
    //   this.adapters.set('razorpay', new RazorpayAdapter({
    //     keyId: process.env.RAZORPAY_KEY_ID,
    //     keySecret: process.env.RAZORPAY_KEY_SECRET
    //   }));
    // }
  }

  /**
   * Get a specific payment adapter by provider name
   * @param {string} providerName - Name of the payment provider
   * @returns {PaymentProviderAdapter} The payment adapter instance
   * @throws {Error} If provider is not configured
   */
  getAdapter(providerName) {
    const adapter = this.adapters.get(providerName);
    if (!adapter) {
      throw new PaymentError(
        PaymentErrorCodes.PROVIDER_UNAVAILABLE,
        `Payment provider '${providerName}' is not configured`
      );
    }
    return adapter;
  }

  /**
   * Get list of available payment providers
   * @returns {string[]} Array of available provider names
   */
  getAvailableProviders() {
    return Array.from(this.adapters.keys());
  }

  /**
   * Get the default payment provider
   * @returns {string} Default provider name
   */
  getDefaultProvider() {
    // Return first available provider, preferring Stripe
    if (this.adapters.has('stripe')) {
      return 'stripe';
    }
    const providers = this.getAvailableProviders();
    if (providers.length === 0) {
      throw new PaymentError(
        PaymentErrorCodes.PROVIDER_UNAVAILABLE,
        'No payment providers configured'
      );
    }
    return providers[0];
  }


  // ==================== Customer Management ====================

  /**
   * Create a customer in the payment provider
   * @param {string} organizationId - Organization ID
   * @param {Object} customerData - Customer information
   * @param {string} [providerName] - Payment provider name (defaults to default provider)
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   */
  async createCustomer(organizationId, customerData, providerName) {
    try {
      if (!isValidObjectId(organizationId)) {
        return { isSuccess: false, message: 'Invalid organization ID', code: 400 };
      }

      const provider = providerName || this.getDefaultProvider();
      const adapter = this.getAdapter(provider);

      const result = await adapter.createCustomer({
        email: customerData.email,
        name: customerData.name,
        organizationId: organizationId,
        metadata: customerData.metadata
      });

      // Update organization with provider customer ID
      await Organization.findByIdAndUpdate(organizationId, {
        [`${provider}CustomerId`]: result.customerId
      });

      return {
        isSuccess: true,
        data: {
          customerId: result.customerId,
          provider: provider
        }
      };
    } catch (error) {
      console.error('Error in createCustomer:', error);
      if (error instanceof PaymentError) {
        return { isSuccess: false, message: error.message, code: 400 };
      }
      return { isSuccess: false, message: 'Failed to create customer', code: 500 };
    }
  }

  /**
   * Get or create a customer for an organization
   * @param {string} organizationId - Organization ID
   * @param {string} [providerName] - Payment provider name
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   */
  async getOrCreateCustomer(organizationId, providerName) {
    try {
      const provider = providerName || this.getDefaultProvider();
      const organization = await Organization.findById(organizationId);
      
      if (!organization) {
        return { isSuccess: false, message: 'Organization not found', code: 404 };
      }

      // Check if customer already exists for this provider
      const customerIdField = `${provider}CustomerId`;
      if (organization[customerIdField]) {
        return {
          isSuccess: true,
          data: {
            customerId: organization[customerIdField],
            provider: provider
          }
        };
      }

      // Create new customer
      return await this.createCustomer(organizationId, {
        email: organization.billingEmail || organization.email,
        name: organization.name
      }, provider);
    } catch (error) {
      console.error('Error in getOrCreateCustomer:', error);
      return { isSuccess: false, message: 'Failed to get or create customer', code: 500 };
    }
  }


  // ==================== Payment Processing ====================

  /**
   * Create a payment intent for processing payment
   * @param {string} organizationId - Organization ID
   * @param {Object} paymentData - Payment information
   * @param {number} paymentData.amount - Amount in smallest currency unit
   * @param {string} [paymentData.currency='usd'] - Currency code
   * @param {Object} [paymentData.metadata] - Additional metadata
   * @param {string} [providerName] - Payment provider name
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   */
  async createPaymentIntent(organizationId, paymentData, providerName) {
    try {
      if (!isValidObjectId(organizationId)) {
        return { isSuccess: false, message: 'Invalid organization ID', code: 400 };
      }

      if (!paymentData.amount || paymentData.amount <= 0) {
        return { isSuccess: false, message: 'Invalid payment amount', code: 400 };
      }

      const provider = providerName || this.getDefaultProvider();
      const adapter = this.getAdapter(provider);

      // Get or create customer
      const customerResult = await this.getOrCreateCustomer(organizationId, provider);
      if (!customerResult.isSuccess) {
        return customerResult;
      }

      const result = await adapter.createPaymentIntent({
        amount: paymentData.amount,
        currency: paymentData.currency || 'usd',
        customerId: customerResult.data.customerId,
        metadata: {
          organizationId: organizationId,
          ...paymentData.metadata
        }
      });

      // Create payment record
      const payment = await Payment.create({
        organization_id: organizationId,
        provider: provider,
        providerPaymentId: result.paymentIntentId,
        amount: paymentData.amount,
        currency: paymentData.currency || 'usd',
        status: result.status,
        metadata: paymentData.metadata
      });

      return {
        isSuccess: true,
        data: {
          paymentId: payment._id,
          paymentIntentId: result.paymentIntentId,
          clientSecret: result.clientSecret,
          status: result.status,
          provider: provider
        }
      };
    } catch (error) {
      console.error('Error in createPaymentIntent:', error);
      if (error instanceof PaymentError) {
        return { isSuccess: false, message: error.message, code: 400 };
      }
      return { isSuccess: false, message: 'Failed to create payment intent', code: 500 };
    }
  }

  /**
   * Process and confirm a payment
   * @param {string} paymentId - Internal payment ID
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   */
  async processPayment(paymentId) {
    try {
      if (!isValidObjectId(paymentId)) {
        return { isSuccess: false, message: 'Invalid payment ID', code: 400 };
      }

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return { isSuccess: false, message: 'Payment not found', code: 404 };
      }

      const adapter = this.getAdapter(payment.provider);
      const result = await adapter.confirmPayment(payment.providerPaymentId);

      // Update payment record
      payment.status = result.status;
      if (result.paidAt) {
        payment.paidAt = result.paidAt;
      }
      await payment.save();

      return {
        isSuccess: true,
        data: {
          paymentId: payment._id,
          status: result.status,
          paidAt: result.paidAt
        }
      };
    } catch (error) {
      console.error('Error in processPayment:', error);
      if (error instanceof PaymentError) {
        return { isSuccess: false, message: error.message, code: 400 };
      }
      return { isSuccess: false, message: 'Failed to process payment', code: 500 };
    }
  }


  // ==================== Payment Method Management ====================

  /**
   * Add a payment method for an organization
   * @param {string} organizationId - Organization ID
   * @param {string} paymentMethodId - Provider payment method ID
   * @param {boolean} [setAsDefault=false] - Whether to set as default
   * @param {string} [providerName] - Payment provider name
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   */
  async addPaymentMethod(organizationId, paymentMethodId, setAsDefault = false, providerName) {
    try {
      if (!isValidObjectId(organizationId)) {
        return { isSuccess: false, message: 'Invalid organization ID', code: 400 };
      }

      const provider = providerName || this.getDefaultProvider();
      const adapter = this.getAdapter(provider);

      // Get or create customer
      const customerResult = await this.getOrCreateCustomer(organizationId, provider);
      if (!customerResult.isSuccess) {
        return customerResult;
      }

      // Attach payment method to customer
      const result = await adapter.attachPaymentMethod(
        customerResult.data.customerId,
        paymentMethodId
      );

      // If setting as default, unset other defaults first
      if (setAsDefault) {
        await PaymentMethod.updateMany(
          { organization_id: organizationId, isDefault: true },
          { isDefault: false }
        );
      }

      // Check if this is the first payment method (auto-set as default)
      const existingMethods = await PaymentMethod.countDocuments({
        organization_id: organizationId,
        isActive: true
      });
      const isDefault = setAsDefault || existingMethods === 0;

      // Create payment method record
      const paymentMethod = await PaymentMethod.create({
        organization_id: organizationId,
        provider: provider,
        providerPaymentMethodId: result.id,
        type: result.type,
        card: result.type === 'card' ? {
          brand: result.brand,
          last4: result.last4,
          expiryMonth: result.expiryMonth,
          expiryYear: result.expiryYear
        } : undefined,
        isDefault: isDefault,
        isActive: true
      });

      return {
        isSuccess: true,
        data: {
          paymentMethodId: paymentMethod._id,
          type: result.type,
          last4: result.last4,
          brand: result.brand,
          isDefault: isDefault
        }
      };
    } catch (error) {
      console.error('Error in addPaymentMethod:', error);
      if (error instanceof PaymentError) {
        return { isSuccess: false, message: error.message, code: 400 };
      }
      return { isSuccess: false, message: 'Failed to add payment method', code: 500 };
    }
  }

  /**
   * Remove a payment method
   * @param {string} organizationId - Organization ID
   * @param {string} paymentMethodId - Internal payment method ID
   * @returns {Promise<{isSuccess: boolean, message?: string, code?: number}>}
   */
  async removePaymentMethod(organizationId, paymentMethodId) {
    try {
      if (!isValidObjectId(organizationId) || !isValidObjectId(paymentMethodId)) {
        return { isSuccess: false, message: 'Invalid ID', code: 400 };
      }

      const paymentMethod = await PaymentMethod.findOne({
        _id: paymentMethodId,
        organization_id: organizationId
      });

      if (!paymentMethod) {
        return { isSuccess: false, message: 'Payment method not found', code: 404 };
      }

      const adapter = this.getAdapter(paymentMethod.provider);

      // Detach from provider
      await adapter.detachPaymentMethod(paymentMethod.providerPaymentMethodId);

      // Soft delete the payment method
      paymentMethod.isActive = false;
      await paymentMethod.save();

      // If this was the default, set another as default
      if (paymentMethod.isDefault) {
        const nextDefault = await PaymentMethod.findOne({
          organization_id: organizationId,
          isActive: true
        });
        if (nextDefault) {
          nextDefault.isDefault = true;
          await nextDefault.save();
        }
      }

      return { isSuccess: true, message: 'Payment method removed successfully' };
    } catch (error) {
      console.error('Error in removePaymentMethod:', error);
      if (error instanceof PaymentError) {
        return { isSuccess: false, message: error.message, code: 400 };
      }
      return { isSuccess: false, message: 'Failed to remove payment method', code: 500 };
    }
  }


  /**
   * Set a payment method as default
   * @param {string} organizationId - Organization ID
   * @param {string} paymentMethodId - Internal payment method ID
   * @returns {Promise<{isSuccess: boolean, message?: string, code?: number}>}
   */
  async setDefaultPaymentMethod(organizationId, paymentMethodId) {
    try {
      if (!isValidObjectId(organizationId) || !isValidObjectId(paymentMethodId)) {
        return { isSuccess: false, message: 'Invalid ID', code: 400 };
      }

      const paymentMethod = await PaymentMethod.findOne({
        _id: paymentMethodId,
        organization_id: organizationId,
        isActive: true
      });

      if (!paymentMethod) {
        return { isSuccess: false, message: 'Payment method not found', code: 404 };
      }

      // Unset other defaults
      await PaymentMethod.updateMany(
        { organization_id: organizationId, isDefault: true },
        { isDefault: false }
      );

      // Set this as default
      paymentMethod.isDefault = true;
      await paymentMethod.save();

      return { isSuccess: true, message: 'Default payment method updated' };
    } catch (error) {
      console.error('Error in setDefaultPaymentMethod:', error);
      return { isSuccess: false, message: 'Failed to set default payment method', code: 500 };
    }
  }

  /**
   * Get all payment methods for an organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<{isSuccess: boolean, data?: Array, message?: string, code?: number}>}
   */
  async getPaymentMethods(organizationId) {
    try {
      if (!isValidObjectId(organizationId)) {
        return { isSuccess: false, message: 'Invalid organization ID', code: 400 };
      }

      const paymentMethods = await PaymentMethod.find({
        organization_id: organizationId,
        isActive: true
      }).sort({ isDefault: -1, createdAt: -1 });

      return {
        isSuccess: true,
        data: paymentMethods.map(pm => ({
          id: pm._id,
          provider: pm.provider,
          type: pm.type,
          last4: pm.card?.last4,
          brand: pm.card?.brand,
          expiryMonth: pm.card?.expiryMonth,
          expiryYear: pm.card?.expiryYear,
          isDefault: pm.isDefault
        }))
      };
    } catch (error) {
      console.error('Error in getPaymentMethods:', error);
      return { isSuccess: false, message: 'Failed to get payment methods', code: 500 };
    }
  }

  /**
   * Get the default payment method for an organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   */
  async getDefaultPaymentMethod(organizationId) {
    try {
      if (!isValidObjectId(organizationId)) {
        return { isSuccess: false, message: 'Invalid organization ID', code: 400 };
      }

      const paymentMethod = await PaymentMethod.findOne({
        organization_id: organizationId,
        isDefault: true,
        isActive: true
      });

      if (!paymentMethod) {
        return { isSuccess: false, message: 'No default payment method found', code: 404 };
      }

      return {
        isSuccess: true,
        data: {
          id: paymentMethod._id,
          provider: paymentMethod.provider,
          providerPaymentMethodId: paymentMethod.providerPaymentMethodId,
          type: paymentMethod.type,
          last4: paymentMethod.card?.last4,
          brand: paymentMethod.card?.brand
        }
      };
    } catch (error) {
      console.error('Error in getDefaultPaymentMethod:', error);
      return { isSuccess: false, message: 'Failed to get default payment method', code: 500 };
    }
  }


  // ==================== Refund Processing ====================

  /**
   * Process a refund for a payment
   * @param {string} paymentId - Internal payment ID
   * @param {Object} refundData - Refund information
   * @param {number} [refundData.amount] - Amount to refund (full if not specified)
   * @param {string} [refundData.reason] - Reason for refund
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   */
  async processRefund(paymentId, refundData = {}) {
    try {
      if (!isValidObjectId(paymentId)) {
        return { isSuccess: false, message: 'Invalid payment ID', code: 400 };
      }

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return { isSuccess: false, message: 'Payment not found', code: 404 };
      }

      if (payment.status !== 'succeeded') {
        return { isSuccess: false, message: 'Can only refund successful payments', code: 400 };
      }

      const adapter = this.getAdapter(payment.provider);
      const result = await adapter.refund(payment.providerPaymentId, refundData);

      // Update payment record
      const refundAmount = refundData.amount || payment.amount;
      payment.refundedAmount = (payment.refundedAmount || 0) + refundAmount;
      payment.status = payment.refundedAmount >= payment.amount 
        ? 'refunded' 
        : 'partially_refunded';
      await payment.save();

      return {
        isSuccess: true,
        data: {
          refundId: result.refundId,
          status: result.status,
          amount: result.amount,
          paymentStatus: payment.status
        }
      };
    } catch (error) {
      console.error('Error in processRefund:', error);
      if (error instanceof PaymentError) {
        return { isSuccess: false, message: error.message, code: 400 };
      }
      return { isSuccess: false, message: 'Failed to process refund', code: 500 };
    }
  }

  // ==================== Webhook Handling ====================

  /**
   * Verify and parse a webhook event
   * @param {string} providerName - Payment provider name
   * @param {string|Buffer} payload - Raw webhook payload
   * @param {string} signature - Webhook signature
   * @returns {{isSuccess: boolean, data?: Object, message?: string, code?: number}}
   */
  verifyWebhook(providerName, payload, signature) {
    try {
      const adapter = this.getAdapter(providerName);
      const event = adapter.verifyWebhookSignature(payload, signature);
      return { isSuccess: true, data: event };
    } catch (error) {
      console.error('Error in verifyWebhook:', error);
      if (error instanceof PaymentError) {
        return { isSuccess: false, message: error.message, code: 400 };
      }
      return { isSuccess: false, message: 'Failed to verify webhook', code: 400 };
    }
  }
}

// Export singleton instance
const paymentService = new PaymentService();

module.exports = {
  paymentService,
  PaymentService,
  PaymentError,
  PaymentErrorCodes
};
