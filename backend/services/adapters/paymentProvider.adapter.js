/**
 * PaymentProviderAdapter - Abstract interface for payment providers
 * All payment provider implementations must conform to this interface.
 * 
 * This adapter pattern allows integration with multiple payment providers
 * (Stripe, Razorpay, PayPal, etc.) without changing core business logic.
 * 
 * @abstract
 * @class PaymentProviderAdapter
 * @requirements 3.1
 */
class PaymentProviderAdapter {
  /**
   * Create a customer in the payment provider's system
   * @param {Object} customerData - Customer information
   * @param {string} customerData.email - Customer email address
   * @param {string} customerData.name - Customer/Organization name
   * @param {string} customerData.organizationId - Internal organization ID
   * @param {Object} [customerData.metadata] - Additional metadata
   * @returns {Promise<{customerId: string, providerData: Object}>}
   * @throws {Error} If not implemented by subclass
   */
  async createCustomer(customerData) {
    throw new Error('Method createCustomer must be implemented by subclass');
  }

  /**
   * Create a payment intent for one-time or subscription payment
   * @param {Object} paymentData - Payment information
   * @param {number} paymentData.amount - Amount in smallest currency unit (e.g., cents)
   * @param {string} [paymentData.currency='usd'] - Currency code
   * @param {string} paymentData.customerId - Provider customer ID
   * @param {Object} [paymentData.metadata] - Additional metadata
   * @returns {Promise<{paymentIntentId: string, clientSecret: string, status: string}>}
   * @throws {Error} If not implemented by subclass
   */
  async createPaymentIntent(paymentData) {
    throw new Error('Method createPaymentIntent must be implemented by subclass');
  }

  /**
   * Confirm a payment intent
   * @param {string} paymentIntentId - The payment intent ID to confirm
   * @returns {Promise<{status: string, paidAt: Date, providerData: Object}>}
   * @throws {Error} If not implemented by subclass
   */
  async confirmPayment(paymentIntentId) {
    throw new Error('Method confirmPayment must be implemented by subclass');
  }

  /**
   * Create a subscription for recurring billing
   * @param {Object} subscriptionData - Subscription information
   * @param {string} subscriptionData.customerId - Provider customer ID
   * @param {string} subscriptionData.priceId - Provider price ID
   * @param {number} [subscriptionData.trialDays=0] - Trial period in days
   * @param {Object} [subscriptionData.metadata] - Additional metadata
   * @returns {Promise<{subscriptionId: string, status: string, currentPeriodEnd: Date, clientSecret?: string}>}
   * @throws {Error} If not implemented by subclass
   */
  async createSubscription(subscriptionData) {
    throw new Error('Method createSubscription must be implemented by subclass');
  }

  /**
   * Update an existing subscription (upgrade/downgrade)
   * @param {string} subscriptionId - The subscription ID to update
   * @param {Object} updateData - Update information
   * @param {string} updateData.priceId - New price ID
   * @param {string} [updateData.prorationBehavior='create_prorations'] - How to handle proration
   * @returns {Promise<{subscriptionId: string, status: string, currentPeriodEnd: Date}>}
   * @throws {Error} If not implemented by subclass
   */
  async updateSubscription(subscriptionId, updateData) {
    throw new Error('Method updateSubscription must be implemented by subclass');
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - The subscription ID to cancel
   * @param {Object} [options] - Cancellation options
   * @param {boolean} [options.cancelAtPeriodEnd=true] - Whether to cancel at period end
   * @returns {Promise<{status: string, cancelAt: Date}>}
   * @throws {Error} If not implemented by subclass
   */
  async cancelSubscription(subscriptionId, options = {}) {
    throw new Error('Method cancelSubscription must be implemented by subclass');
  }

  /**
   * Process a refund
   * @param {string} paymentId - The payment/charge ID to refund
   * @param {Object} refundData - Refund information
   * @param {number} [refundData.amount] - Amount to refund (full refund if not specified)
   * @param {string} [refundData.reason] - Reason for refund
   * @returns {Promise<{refundId: string, status: string, amount: number}>}
   * @throws {Error} If not implemented by subclass
   */
  async refund(paymentId, refundData = {}) {
    throw new Error('Method refund must be implemented by subclass');
  }

  /**
   * Attach a payment method to a customer
   * @param {string} customerId - Provider customer ID
   * @param {string} paymentMethodId - Payment method ID to attach
   * @returns {Promise<{paymentMethodId: string, type: string, last4: string, brand?: string, expiryMonth?: number, expiryYear?: number}>}
   * @throws {Error} If not implemented by subclass
   */
  async attachPaymentMethod(customerId, paymentMethodId) {
    throw new Error('Method attachPaymentMethod must be implemented by subclass');
  }

  /**
   * Detach a payment method from a customer
   * @param {string} paymentMethodId - Payment method ID to detach
   * @returns {Promise<{success: boolean}>}
   * @throws {Error} If not implemented by subclass
   */
  async detachPaymentMethod(paymentMethodId) {
    throw new Error('Method detachPaymentMethod must be implemented by subclass');
  }

  /**
   * List payment methods for a customer
   * @param {string} customerId - Provider customer ID
   * @param {string} [type='card'] - Payment method type to list
   * @returns {Promise<Array<{id: string, type: string, last4: string, brand?: string, expiryMonth?: number, expiryYear?: number}>>}
   * @throws {Error} If not implemented by subclass
   */
  async listPaymentMethods(customerId, type = 'card') {
    throw new Error('Method listPaymentMethods must be implemented by subclass');
  }

  /**
   * Verify webhook signature and parse event
   * @param {string|Buffer} payload - Raw webhook payload
   * @param {string} signature - Webhook signature header
   * @returns {Object} Parsed and verified webhook event
   * @throws {Error} If signature is invalid or not implemented
   */
  verifyWebhookSignature(payload, signature) {
    throw new Error('Method verifyWebhookSignature must be implemented by subclass');
  }

  /**
   * Get the provider name
   * @returns {string} Provider name (e.g., 'stripe', 'razorpay', 'paypal')
   * @throws {Error} If not implemented by subclass
   */
  getProviderName() {
    throw new Error('Method getProviderName must be implemented by subclass');
  }
}

module.exports = PaymentProviderAdapter;
