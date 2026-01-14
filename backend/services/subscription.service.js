const Subscription = require('../models/subscription.model');
const SubscriptionPlan = require('../models/subscriptionPlan.model');
const Organization = require('../models/organization.model');
const User = require('../models/user.model');
const Project = require('../models/project.model');
const Attachment = require('../models/attachment.model');
const { paymentService, PaymentError } = require('./payment.service');
const { isValidObjectId } = require('mongoose');

/**
 * Subscription error class for standardized error handling
 */
class SubscriptionError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'SubscriptionError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Subscription error codes for consistent error handling
 */
const SubscriptionErrorCodes = {
  PLAN_NOT_FOUND: 'plan_not_found',
  ALREADY_SUBSCRIBED: 'already_subscribed',
  INVALID_UPGRADE: 'invalid_upgrade',
  INVALID_DOWNGRADE: 'invalid_downgrade',
  SUBSCRIPTION_NOT_FOUND: 'subscription_not_found',
  ALREADY_CANCELLED: 'already_cancelled',
  PAYMENT_REQUIRED: 'payment_required',
  INVALID_BILLING_CYCLE: 'invalid_billing_cycle',
  ORGANIZATION_NOT_FOUND: 'organization_not_found',
  TRIAL_NOT_AVAILABLE: 'trial_not_available'
};

/**
 * SubscriptionService - Manages subscription lifecycle
 * 
 * @requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.7
 */
class SubscriptionService {
  /**
   * Calculate period end date based on billing cycle
   * @param {Date} startDate - Period start date
   * @param {string} billingCycle - 'monthly' or 'annual'
   * @returns {Date} Period end date
   * @private
   */
  _calculatePeriodEnd(startDate, billingCycle) {
    const endDate = new Date(startDate);
    if (billingCycle === 'annual') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    return endDate;
  }

  /**
   * Get price for a plan based on billing cycle
   * @param {Object} plan - Subscription plan
   * @param {string} billingCycle - 'monthly' or 'annual'
   * @returns {number} Price in cents
   * @private
   */
  _getPlanPrice(plan, billingCycle) {
    return billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
  }

  /**
   * Get Stripe price ID for a plan based on billing cycle
   * @param {Object} plan - Subscription plan
   * @param {string} billingCycle - 'monthly' or 'annual'
   * @returns {string|null} Stripe price ID
   * @private
   */
  _getStripePriceId(plan, billingCycle) {
    return billingCycle === 'annual' 
      ? plan.stripePriceIds?.annual 
      : plan.stripePriceIds?.monthly;
  }


  // ==================== Core Methods ====================

  /**
   * Create a new subscription for an organization
   * @param {string} organizationId - Organization ID
   * @param {string} planId - Subscription plan ID
   * @param {string} [billingCycle='monthly'] - Billing cycle
   * @param {string} [paymentMethodId] - Payment method ID for paid plans
   * @param {Object} [session] - Mongoose session for transactions
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   * @requirements 2.1
   */
  async createSubscription(organizationId, planId, billingCycle = 'monthly', paymentMethodId = null, session = null) {
    try {
      // Validate organization ID
      if (!isValidObjectId(organizationId)) {
        return { isSuccess: false, message: 'Invalid organization ID', code: 400 };
      }

      // Validate plan ID
      if (!isValidObjectId(planId)) {
        return { isSuccess: false, message: 'Invalid plan ID', code: 400 };
      }

      // Validate billing cycle
      if (!['monthly', 'annual'].includes(billingCycle)) {
        return { 
          isSuccess: false, 
          message: 'Invalid billing cycle. Must be "monthly" or "annual"', 
          code: 400 
        };
      }

      // Check if organization exists
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return { 
          isSuccess: false, 
          message: 'Organization not found', 
          code: 404 
        };
      }

      // Check if plan exists and is active
      const plan = await SubscriptionPlan.findOne({ _id: planId, isActive: true });
      if (!plan) {
        return { 
          isSuccess: false, 
          message: 'Subscription plan not found or inactive', 
          code: 404 
        };
      }

      // Check if organization already has an active subscription
      const existingSubscription = await Subscription.findOne({
        organization_id: organizationId,
        status: { $in: ['active', 'trialing', 'pending'] }
      });

      if (existingSubscription) {
        return { 
          isSuccess: false, 
          message: 'Organization already has an active subscription', 
          code: 400 
        };
      }

      const now = new Date();
      const periodEnd = this._calculatePeriodEnd(now, billingCycle);
      const price = this._getPlanPrice(plan, billingCycle);

      // Create subscription record
      const subscriptionData = {
        organization_id: organizationId,
        plan_id: planId,
        status: price > 0 ? 'pending' : 'active',
        billingCycle: billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false
      };

      // If it's a paid plan, initiate payment with provider
      if (price > 0) {
        const priceId = this._getStripePriceId(plan, billingCycle);
        
        if (priceId) {
          // Create subscription with Stripe
          const customerResult = await paymentService.getOrCreateCustomer(organizationId);
          if (!customerResult.isSuccess) {
            return customerResult;
          }

          const adapter = paymentService.getAdapter('stripe');
          const stripeResult = await adapter.createSubscription({
            customerId: customerResult.data.customerId,
            priceId: priceId,
            metadata: { organizationId: organizationId }
          });

          subscriptionData.providerData = {
            provider: 'stripe',
            customerId: customerResult.data.customerId,
            subscriptionId: stripeResult.subscriptionId
          };
          subscriptionData.status = stripeResult.status;
          subscriptionData.currentPeriodEnd = stripeResult.currentPeriodEnd;
          subscriptionData.currentPeriodStart = stripeResult.currentPeriodStart || now;
        }
      }

      const subscription = session 
        ? await Subscription.create([subscriptionData], { session }).then(docs => docs[0])
        : await Subscription.create(subscriptionData);

      // Update organization with subscription reference
      const updateQuery = { subscription: subscription._id };
      if (session) {
        await Organization.findByIdAndUpdate(organizationId, updateQuery, { session });
      } else {
        await Organization.findByIdAndUpdate(organizationId, updateQuery);
      }

      return {
        isSuccess: true,
        data: {
          subscriptionId: subscription._id,
          planId: plan._id,
          planName: plan.name,
          status: subscription.status,
          billingCycle: subscription.billingCycle,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd
        }
      };
    } catch (error) {
      console.error('Error in createSubscription:', error);
      if (error instanceof SubscriptionError || error instanceof PaymentError) {
        return { isSuccess: false, message: error.message, code: 400 };
      }
      return { isSuccess: false, message: 'Failed to create subscription', code: 500 };
    }
  }


  /**
   * Get active subscription for an organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   * @requirements 2.1
   */
  async getActiveSubscription(organizationId) {
    try {
      if (!isValidObjectId(organizationId)) {
        return { isSuccess: false, message: 'Invalid organization ID', code: 400 };
      }

      const subscription = await Subscription.findOne({
        organization_id: organizationId
      }).populate('plan_id');

      if (!subscription) {
        return { 
          isSuccess: false, 
          message: 'No subscription found for this organization', 
          code: 404 
        };
      }

      const plan = subscription.plan_id;

      return {
        isSuccess: true,
        data: {
          subscriptionId: subscription._id,
          organizationId: subscription.organization_id,
          plan: {
            id: plan._id,
            name: plan.name,
            displayName: plan.displayName,
            description: plan.description,
            monthlyPrice: plan.monthlyPrice,
            annualPrice: plan.annualPrice,
            currency: plan.currency,
            limits: plan.limits,
            features: plan.features
          },
          status: subscription.status,
          billingCycle: subscription.billingCycle,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          cancelledAt: subscription.cancelledAt,
          trialStart: subscription.trialStart,
          trialEnd: subscription.trialEnd,
          pendingPlanChange: subscription.pendingPlanChange
        }
      };
    } catch (error) {
      console.error('Error in getActiveSubscription:', error);
      return { isSuccess: false, message: 'Failed to get subscription', code: 500 };
    }
  }

  /**
   * Get subscription with usage data for an organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   * @requirements 2.1, 7.1, 7.2, 7.3
   */
  async getSubscriptionWithUsage(organizationId) {
    try {
      if (!isValidObjectId(organizationId)) {
        return { isSuccess: false, message: 'Invalid organization ID', code: 400 };
      }

      // Get subscription
      const subscriptionResult = await this.getActiveSubscription(organizationId);
      if (!subscriptionResult.isSuccess) {
        return subscriptionResult;
      }

      // Get usage data - ensure organizationId is a string for ObjectId conversion
      const orgIdString = organizationId.toString();
      const mongoose = require('mongoose');
      
      const [userCount, projectCount, storageResult] = await Promise.all([
        User.countDocuments({ 
          organization_id: organizationId, 
          is_deleted: { $ne: true }
        }),
        Project.countDocuments({ 
          organization_id: organizationId, 
          deleted_at: null 
        }),
        Attachment.aggregate([
          { $match: { organization_id: new mongoose.Types.ObjectId(orgIdString), is_active: true } },
          { $group: { _id: null, totalBytes: { $sum: '$filesize' } } }
        ])
      ]);

      const storageBytes = storageResult[0]?.totalBytes || 0;
      const plan = subscriptionResult.data.plan;

      // Calculate usage percentages
      const usage = {
        users: {
          current: userCount,
          limit: plan.limits.maxUsers,
          percentage: plan.limits.maxUsers === -1 ? 0 : Math.round((userCount / plan.limits.maxUsers) * 100),
          unlimited: plan.limits.maxUsers === -1
        },
        projects: {
          current: projectCount,
          limit: plan.limits.maxProjects,
          percentage: plan.limits.maxProjects === -1 ? 0 : Math.round((projectCount / plan.limits.maxProjects) * 100),
          unlimited: plan.limits.maxProjects === -1
        },
        storage: {
          current: storageBytes,
          limit: plan.limits.maxStorageBytes,
          percentage: plan.limits.maxStorageBytes === -1 ? 0 : Math.round((storageBytes / plan.limits.maxStorageBytes) * 100),
          unlimited: plan.limits.maxStorageBytes === -1
        }
      };

      return {
        isSuccess: true,
        data: {
          ...subscriptionResult.data,
          usage
        }
      };
    } catch (error) {
      console.error('Error in getSubscriptionWithUsage:', error);
      return { isSuccess: false, message: 'Failed to get subscription with usage', code: 500 };
    }
  }


  // ==================== Lifecycle Methods ====================

  /**
   * Calculate proration amount for upgrade
   * @param {Object} currentSubscription - Current subscription
   * @param {Object} currentPlan - Current plan
   * @param {Object} newPlan - New plan
   * @returns {number} Proration amount in cents
   * @private
   */
  _calculateProration(currentSubscription, currentPlan, newPlan) {
    const now = new Date();
    const periodStart = new Date(currentSubscription.currentPeriodStart);
    const periodEnd = new Date(currentSubscription.currentPeriodEnd);
    
    const totalDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 0) return 0;

    const currentPrice = this._getPlanPrice(currentPlan, currentSubscription.billingCycle);
    const newPrice = this._getPlanPrice(newPlan, currentSubscription.billingCycle);
    
    const priceDifference = newPrice - currentPrice;
    const prorationAmount = Math.round((daysRemaining / totalDays) * priceDifference);
    
    return Math.max(0, prorationAmount);
  }

  /**
   * Upgrade subscription to a higher tier plan
   * @param {string} organizationId - Organization ID
   * @param {string} newPlanId - New plan ID
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   * @requirements 2.2
   */
  async upgradeSubscription(organizationId, newPlanId) {
    try {
      if (!isValidObjectId(organizationId) || !isValidObjectId(newPlanId)) {
        return { isSuccess: false, message: 'Invalid ID', code: 400 };
      }

      // Get current subscription
      const subscription = await Subscription.findOne({
        organization_id: organizationId,
        status: { $in: ['active', 'trialing'] }
      }).populate('plan_id');

      if (!subscription) {
        return { 
          isSuccess: false, 
          message: 'No active subscription found', 
          code: 404 
        };
      }

      const currentPlan = subscription.plan_id;

      // Get new plan
      const newPlan = await SubscriptionPlan.findOne({ _id: newPlanId, isActive: true });
      if (!newPlan) {
        return { 
          isSuccess: false, 
          message: 'New plan not found or inactive', 
          code: 404 
        };
      }

      // Validate upgrade (new plan should be higher tier)
      const planOrder = { starter: 0, professional: 1, enterprise: 2 };
      if (planOrder[newPlan.name] <= planOrder[currentPlan.name]) {
        return { 
          isSuccess: false, 
          message: 'Can only upgrade to a higher tier plan. Use downgrade for lower tiers.', 
          code: 400 
        };
      }

      // Calculate proration
      const prorationAmount = this._calculateProration(subscription, currentPlan, newPlan);

      // Update with payment provider if applicable
      if (subscription.providerData?.subscriptionId) {
        const priceId = this._getStripePriceId(newPlan, subscription.billingCycle);
        
        if (priceId) {
          const adapter = paymentService.getAdapter(subscription.providerData.provider);
          await adapter.updateSubscription(subscription.providerData.subscriptionId, {
            priceId: priceId,
            prorationBehavior: 'create_prorations'
          });
        }
      }

      // Update local subscription record
      subscription.plan_id = newPlanId;
      subscription.pendingPlanChange = null; // Clear any pending downgrade
      await subscription.save();

      return {
        isSuccess: true,
        data: {
          subscriptionId: subscription._id,
          previousPlan: currentPlan.name,
          newPlan: newPlan.name,
          prorationAmount: prorationAmount,
          status: subscription.status
        }
      };
    } catch (error) {
      console.error('Error in upgradeSubscription:', error);
      if (error instanceof PaymentError) {
        return { isSuccess: false, message: error.message, code: 400 };
      }
      return { isSuccess: false, message: 'Failed to upgrade subscription', code: 500 };
    }
  }

  /**
   * Downgrade subscription to a lower tier plan (scheduled for period end)
   * @param {string} organizationId - Organization ID
   * @param {string} newPlanId - New plan ID
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   * @requirements 2.3
   */
  async downgradeSubscription(organizationId, newPlanId) {
    try {
      if (!isValidObjectId(organizationId) || !isValidObjectId(newPlanId)) {
        return { isSuccess: false, message: 'Invalid ID', code: 400 };
      }

      // Get current subscription
      const subscription = await Subscription.findOne({
        organization_id: organizationId,
        status: { $in: ['active', 'trialing'] }
      }).populate('plan_id');

      if (!subscription) {
        return { 
          isSuccess: false, 
          message: 'No active subscription found', 
          code: 404 
        };
      }

      const currentPlan = subscription.plan_id;

      // Get new plan
      const newPlan = await SubscriptionPlan.findOne({ _id: newPlanId, isActive: true });
      if (!newPlan) {
        return { 
          isSuccess: false, 
          message: 'New plan not found or inactive', 
          code: 404 
        };
      }

      // Validate downgrade (new plan should be lower tier)
      const planOrder = { starter: 0, professional: 1, enterprise: 2 };
      if (planOrder[newPlan.name] >= planOrder[currentPlan.name]) {
        return { 
          isSuccess: false, 
          message: 'Can only downgrade to a lower tier plan. Use upgrade for higher tiers.', 
          code: 400 
        };
      }

      // Schedule downgrade for end of billing period
      subscription.pendingPlanChange = {
        newPlanId: newPlanId,
        effectiveDate: subscription.currentPeriodEnd
      };
      await subscription.save();

      return {
        isSuccess: true,
        data: {
          subscriptionId: subscription._id,
          currentPlan: currentPlan.name,
          scheduledPlan: newPlan.name,
          effectiveDate: subscription.currentPeriodEnd,
          message: `Downgrade to ${newPlan.displayName} scheduled for ${subscription.currentPeriodEnd.toISOString()}`
        }
      };
    } catch (error) {
      console.error('Error in downgradeSubscription:', error);
      return { isSuccess: false, message: 'Failed to downgrade subscription', code: 500 };
    }
  }


  /**
   * Cancel subscription
   * @param {string} organizationId - Organization ID
   * @param {boolean} [immediate=false] - Cancel immediately or at period end
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   * @requirements 2.4
   */
  async cancelSubscription(organizationId, immediate = false) {
    try {
      if (!isValidObjectId(organizationId)) {
        return { isSuccess: false, message: 'Invalid organization ID', code: 400 };
      }

      // Get current subscription
      const subscription = await Subscription.findOne({
        organization_id: organizationId,
        status: { $in: ['active', 'trialing', 'past_due'] }
      });

      if (!subscription) {
        return { 
          isSuccess: false, 
          message: 'No active subscription found', 
          code: 404 
        };
      }

      if (subscription.cancelAtPeriodEnd || subscription.status === 'cancelled') {
        return { 
          isSuccess: false, 
          message: 'Subscription is already cancelled or scheduled for cancellation', 
          code: 400 
        };
      }

      // Cancel with payment provider if applicable
      if (subscription.providerData?.subscriptionId) {
        const adapter = paymentService.getAdapter(subscription.providerData.provider);
        await adapter.cancelSubscription(subscription.providerData.subscriptionId, {
          cancelAtPeriodEnd: !immediate
        });
      }

      // Update local subscription record
      const now = new Date();
      
      if (immediate) {
        subscription.status = 'cancelled';
        subscription.cancelledAt = now;
        subscription.cancelAtPeriodEnd = false;
      } else {
        // Keep access until period end
        subscription.cancelAtPeriodEnd = true;
        subscription.cancelledAt = now;
      }
      
      await subscription.save();

      return {
        isSuccess: true,
        data: {
          subscriptionId: subscription._id,
          status: subscription.status,
          cancelledAt: subscription.cancelledAt,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          accessUntil: immediate ? now : subscription.currentPeriodEnd,
          message: immediate 
            ? 'Subscription cancelled immediately' 
            : `Subscription will be cancelled at ${subscription.currentPeriodEnd.toISOString()}`
        }
      };
    } catch (error) {
      console.error('Error in cancelSubscription:', error);
      if (error instanceof PaymentError) {
        return { isSuccess: false, message: error.message, code: 400 };
      }
      return { isSuccess: false, message: 'Failed to cancel subscription', code: 500 };
    }
  }

  /**
   * Renew subscription (handle automatic renewal)
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   * @requirements 2.4
   */
  async renewSubscription(subscriptionId) {
    try {
      if (!isValidObjectId(subscriptionId)) {
        return { isSuccess: false, message: 'Invalid subscription ID', code: 400 };
      }

      const subscription = await Subscription.findById(subscriptionId).populate('plan_id');
      
      if (!subscription) {
        return { 
          isSuccess: false, 
          message: 'Subscription not found', 
          code: 404 
        };
      }

      // Check if subscription should be renewed
      if (subscription.cancelAtPeriodEnd) {
        // Apply pending downgrade if exists
        if (subscription.pendingPlanChange?.newPlanId) {
          subscription.plan_id = subscription.pendingPlanChange.newPlanId;
          subscription.pendingPlanChange = null;
        } else {
          // Cancel the subscription
          subscription.status = 'cancelled';
          await subscription.save();
          return {
            isSuccess: true,
            data: {
              subscriptionId: subscription._id,
              status: 'cancelled',
              message: 'Subscription cancelled as scheduled'
            }
          };
        }
      }

      // Calculate new period dates
      const newPeriodStart = subscription.currentPeriodEnd;
      const newPeriodEnd = this._calculatePeriodEnd(newPeriodStart, subscription.billingCycle);

      // Update subscription
      subscription.currentPeriodStart = newPeriodStart;
      subscription.currentPeriodEnd = newPeriodEnd;
      subscription.status = 'active';
      await subscription.save();

      return {
        isSuccess: true,
        data: {
          subscriptionId: subscription._id,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd
        }
      };
    } catch (error) {
      console.error('Error in renewSubscription:', error);
      return { isSuccess: false, message: 'Failed to renew subscription', code: 500 };
    }
  }


  // ==================== Trial and Status Management ====================

  /**
   * Start a trial for Professional plan
   * @param {string} organizationId - Organization ID
   * @param {number} [trialDays=14] - Trial duration in days
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   * @requirements 2.7
   */
  async startTrial(organizationId, trialDays = 14) {
    try {
      if (!isValidObjectId(organizationId)) {
        return { isSuccess: false, message: 'Invalid organization ID', code: 400 };
      }

      // Get Professional plan
      const professionalPlan = await SubscriptionPlan.findOne({ 
        name: 'professional', 
        isActive: true 
      });

      if (!professionalPlan) {
        return { 
          isSuccess: false, 
          message: 'Professional plan not found', 
          code: 404 
        };
      }

      // Check if organization already has a subscription
      const existingSubscription = await Subscription.findOne({
        organization_id: organizationId
      });

      if (existingSubscription) {
        // Check if they've already had a trial
        if (existingSubscription.trialStart) {
          return { 
            isSuccess: false, 
            message: 'Organization has already used their trial', 
            code: 400 
          };
        }

        // Check if they're on a paid plan
        const currentPlan = await SubscriptionPlan.findById(existingSubscription.plan_id);
        if (currentPlan && currentPlan.monthlyPrice > 0) {
          return { 
            isSuccess: false, 
            message: 'Cannot start trial while on a paid plan', 
            code: 400 
          };
        }
      }

      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + trialDays);

      if (existingSubscription) {
        // Upgrade existing subscription to trial
        existingSubscription.plan_id = professionalPlan._id;
        existingSubscription.status = 'trialing';
        existingSubscription.trialStart = now;
        existingSubscription.trialEnd = trialEnd;
        existingSubscription.currentPeriodStart = now;
        existingSubscription.currentPeriodEnd = trialEnd;
        await existingSubscription.save();

        return {
          isSuccess: true,
          data: {
            subscriptionId: existingSubscription._id,
            planName: professionalPlan.displayName,
            status: 'trialing',
            trialStart: now,
            trialEnd: trialEnd,
            trialDays: trialDays
          }
        };
      } else {
        // Create new trial subscription
        const subscription = await Subscription.create({
          organization_id: organizationId,
          plan_id: professionalPlan._id,
          status: 'trialing',
          billingCycle: 'monthly',
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
          trialStart: now,
          trialEnd: trialEnd
        });

        // Update organization with subscription reference
        await Organization.findByIdAndUpdate(organizationId, {
          subscription: subscription._id
        });

        return {
          isSuccess: true,
          data: {
            subscriptionId: subscription._id,
            planName: professionalPlan.displayName,
            status: 'trialing',
            trialStart: now,
            trialEnd: trialEnd,
            trialDays: trialDays
          }
        };
      }
    } catch (error) {
      console.error('Error in startTrial:', error);
      return { isSuccess: false, message: 'Failed to start trial', code: 500 };
    }
  }

  /**
   * Check and handle trial expiry
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   * @requirements 2.5, 2.7
   */
  async checkTrialExpiry(subscriptionId) {
    try {
      if (!isValidObjectId(subscriptionId)) {
        return { isSuccess: false, message: 'Invalid subscription ID', code: 400 };
      }

      const subscription = await Subscription.findById(subscriptionId);
      
      if (!subscription) {
        return { 
          isSuccess: false, 
          message: 'Subscription not found', 
          code: 404 
        };
      }

      if (subscription.status !== 'trialing') {
        return {
          isSuccess: true,
          data: {
            subscriptionId: subscription._id,
            status: subscription.status,
            message: 'Subscription is not in trial status'
          }
        };
      }

      const now = new Date();
      
      if (subscription.trialEnd && now >= subscription.trialEnd) {
        // Trial has expired
        // Check if they have a payment method set up
        const defaultPaymentMethod = await paymentService.getDefaultPaymentMethod(
          subscription.organization_id.toString()
        );

        if (defaultPaymentMethod.isSuccess) {
          // Transition to active (payment will be processed)
          subscription.status = 'active';
          const newPeriodEnd = this._calculatePeriodEnd(now, subscription.billingCycle);
          subscription.currentPeriodStart = now;
          subscription.currentPeriodEnd = newPeriodEnd;
        } else {
          // No payment method - downgrade to Starter
          const starterPlan = await SubscriptionPlan.findOne({ name: 'starter', isActive: true });
          if (starterPlan) {
            subscription.plan_id = starterPlan._id;
            subscription.status = 'active';
            const newPeriodEnd = this._calculatePeriodEnd(now, 'monthly');
            subscription.currentPeriodStart = now;
            subscription.currentPeriodEnd = newPeriodEnd;
          } else {
            subscription.status = 'expired';
          }
        }

        await subscription.save();

        return {
          isSuccess: true,
          data: {
            subscriptionId: subscription._id,
            status: subscription.status,
            transitioned: true,
            message: `Trial expired. Status changed to ${subscription.status}`
          }
        };
      }

      return {
        isSuccess: true,
        data: {
          subscriptionId: subscription._id,
          status: subscription.status,
          trialEnd: subscription.trialEnd,
          daysRemaining: Math.ceil((subscription.trialEnd - now) / (1000 * 60 * 60 * 24)),
          transitioned: false
        }
      };
    } catch (error) {
      console.error('Error in checkTrialExpiry:', error);
      return { isSuccess: false, message: 'Failed to check trial expiry', code: 500 };
    }
  }

  /**
   * Update subscription status
   * @param {string} subscriptionId - Subscription ID
   * @param {string} newStatus - New status
   * @param {Object} [additionalData] - Additional data to update
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   * @requirements 2.5
   */
  async updateSubscriptionStatus(subscriptionId, newStatus, additionalData = {}) {
    try {
      if (!isValidObjectId(subscriptionId)) {
        return { isSuccess: false, message: 'Invalid subscription ID', code: 400 };
      }

      const validStatuses = ['active', 'trialing', 'past_due', 'cancelled', 'expired', 'pending'];
      if (!validStatuses.includes(newStatus)) {
        return { 
          isSuccess: false, 
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 
          code: 400 
        };
      }

      const subscription = await Subscription.findById(subscriptionId);
      
      if (!subscription) {
        return { 
          isSuccess: false, 
          message: 'Subscription not found', 
          code: 404 
        };
      }

      const previousStatus = subscription.status;
      subscription.status = newStatus;

      // Handle status-specific updates
      if (newStatus === 'cancelled' && !subscription.cancelledAt) {
        subscription.cancelledAt = new Date();
      }

      // Apply additional data
      Object.keys(additionalData).forEach(key => {
        if (subscription.schema.paths[key]) {
          subscription[key] = additionalData[key];
        }
      });

      await subscription.save();

      return {
        isSuccess: true,
        data: {
          subscriptionId: subscription._id,
          previousStatus: previousStatus,
          newStatus: newStatus,
          updatedAt: subscription.updated_at
        }
      };
    } catch (error) {
      console.error('Error in updateSubscriptionStatus:', error);
      return { isSuccess: false, message: 'Failed to update subscription status', code: 500 };
    }
  }

  /**
   * Process expired subscriptions (batch job)
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   */
  async processExpiredSubscriptions() {
    try {
      const now = new Date();

      // Find subscriptions that have passed their period end
      const expiredSubscriptions = await Subscription.find({
        status: { $in: ['active', 'trialing'] },
        currentPeriodEnd: { $lt: now },
        cancelAtPeriodEnd: true
      });

      const results = [];

      for (const subscription of expiredSubscriptions) {
        subscription.status = 'cancelled';
        await subscription.save();
        results.push({
          subscriptionId: subscription._id,
          organizationId: subscription.organization_id,
          newStatus: 'cancelled'
        });
      }

      // Process trial expirations
      const expiredTrials = await Subscription.find({
        status: 'trialing',
        trialEnd: { $lt: now }
      });

      for (const subscription of expiredTrials) {
        await this.checkTrialExpiry(subscription._id.toString());
        results.push({
          subscriptionId: subscription._id,
          organizationId: subscription.organization_id,
          type: 'trial_expired'
        });
      }

      return {
        isSuccess: true,
        data: {
          processedCount: results.length,
          results: results
        }
      };
    } catch (error) {
      console.error('Error in processExpiredSubscriptions:', error);
      return { isSuccess: false, message: 'Failed to process expired subscriptions', code: 500 };
    }
  }


  // ==================== Auto-Assignment ====================

  /**
   * Assign Starter plan to a new organization
   * @param {string} organizationId - Organization ID
   * @param {Object} [session] - Mongoose session for transactions
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   * @requirements 1.4
   */
  async assignStarterPlan(organizationId, session = null) {
    try {
      if (!isValidObjectId(organizationId)) {
        return { isSuccess: false, message: 'Invalid organization ID', code: 400 };
      }

      // Get Starter plan
      const starterPlan = await SubscriptionPlan.findOne({ 
        name: 'starter', 
        isActive: true 
      });

      if (!starterPlan) {
        console.error('Starter plan not found in database');
        return { 
          isSuccess: false, 
          message: 'Starter plan not configured', 
          code: 500 
        };
      }

      // Check if organization already has a subscription
      const existingSubscription = await Subscription.findOne({
        organization_id: organizationId
      });

      if (existingSubscription) {
        return {
          isSuccess: true,
          data: {
            subscriptionId: existingSubscription._id,
            message: 'Organization already has a subscription'
          }
        };
      }

      // Create subscription with Starter plan
      const now = new Date();
      const periodEnd = this._calculatePeriodEnd(now, 'monthly');

      const subscriptionData = {
        organization_id: organizationId,
        plan_id: starterPlan._id,
        status: 'active',
        billingCycle: 'monthly',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        providerData: {
          provider: 'manual'
        }
      };

      const subscription = session 
        ? await Subscription.create([subscriptionData], { session }).then(docs => docs[0])
        : await Subscription.create(subscriptionData);

      // Update organization with subscription reference
      if (session) {
        await Organization.findByIdAndUpdate(
          organizationId, 
          { subscription: subscription._id },
          { session }
        );
      } else {
        await Organization.findByIdAndUpdate(
          organizationId, 
          { subscription: subscription._id }
        );
      }

      return {
        isSuccess: true,
        data: {
          subscriptionId: subscription._id,
          planId: starterPlan._id,
          planName: starterPlan.name,
          displayName: starterPlan.displayName,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd
        }
      };
    } catch (error) {
      console.error('Error in assignStarterPlan:', error);
      return { isSuccess: false, message: 'Failed to assign starter plan', code: 500 };
    }
  }

  // ==================== Utility Methods ====================

  /**
   * Get all available subscription plans
   * @returns {Promise<{isSuccess: boolean, data?: Array, message?: string, code?: number}>}
   */
  async getAvailablePlans() {
    try {
      const plans = await SubscriptionPlan.find({ isActive: true })
        .sort({ sortOrder: 1 });

      return {
        isSuccess: true,
        data: plans.map(plan => ({
          id: plan._id,
          name: plan.name,
          displayName: plan.displayName,
          description: plan.description,
          monthlyPrice: plan.monthlyPrice,
          annualPrice: plan.annualPrice,
          currency: plan.currency,
          limits: plan.limits,
          features: plan.features
        }))
      };
    } catch (error) {
      console.error('Error in getAvailablePlans:', error);
      return { isSuccess: false, message: 'Failed to get plans', code: 500 };
    }
  }

  /**
   * Check if organization has access to a specific feature
   * @param {string} organizationId - Organization ID
   * @param {string} featureName - Feature name to check
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   */
  async hasFeatureAccess(organizationId, featureName) {
    try {
      const subscriptionResult = await this.getActiveSubscription(organizationId);
      
      if (!subscriptionResult.isSuccess) {
        return { 
          isSuccess: true, 
          data: { 
            hasAccess: false, 
            reason: 'No active subscription' 
          } 
        };
      }

      const subscription = subscriptionResult.data;
      
      // Check if subscription is active
      if (!['active', 'trialing'].includes(subscription.status)) {
        return { 
          isSuccess: true, 
          data: { 
            hasAccess: false, 
            reason: `Subscription status is ${subscription.status}` 
          } 
        };
      }

      // Check if feature is included in plan
      const hasFeature = subscription.plan.features.includes(featureName);

      return {
        isSuccess: true,
        data: {
          hasAccess: hasFeature,
          planName: subscription.plan.name,
          features: subscription.plan.features,
          reason: hasFeature ? null : `Feature '${featureName}' not included in ${subscription.plan.displayName} plan`
        }
      };
    } catch (error) {
      console.error('Error in hasFeatureAccess:', error);
      return { isSuccess: false, message: 'Failed to check feature access', code: 500 };
    }
  }

  /**
   * Check if organization is within resource limits
   * @param {string} organizationId - Organization ID
   * @param {string} resourceType - 'users', 'projects', or 'storage'
   * @param {number} [additionalCount=1] - Additional count to check
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   */
  async checkResourceLimit(organizationId, resourceType, additionalCount = 1) {
    try {
      const usageResult = await this.getSubscriptionWithUsage(organizationId);
      
      if (!usageResult.isSuccess) {
        return usageResult;
      }

      const { usage, plan, status } = usageResult.data;

      // Check subscription status
      if (!['active', 'trialing'].includes(status)) {
        return {
          isSuccess: true,
          data: {
            withinLimit: false,
            reason: `Subscription status is ${status}`
          }
        };
      }

      const resourceUsage = usage[resourceType];
      
      if (!resourceUsage) {
        return { isSuccess: false, message: 'Invalid resource type', code: 400 };
      }

      // Unlimited
      if (resourceUsage.unlimited) {
        return {
          isSuccess: true,
          data: {
            withinLimit: true,
            current: resourceUsage.current,
            limit: -1,
            unlimited: true
          }
        };
      }

      const withinLimit = (resourceUsage.current + additionalCount) <= resourceUsage.limit;

      return {
        isSuccess: true,
        data: {
          withinLimit: withinLimit,
          current: resourceUsage.current,
          limit: resourceUsage.limit,
          percentage: resourceUsage.percentage,
          unlimited: false,
          reason: withinLimit ? null : `${resourceType} limit reached (${resourceUsage.current}/${resourceUsage.limit})`
        }
      };
    } catch (error) {
      console.error('Error in checkResourceLimit:', error);
      return { isSuccess: false, message: 'Failed to check resource limit', code: 500 };
    }
  }

  /**
   * Assign a plan to an organization based on their selection during registration
   * For Professional plan, starts a trial. For Starter, assigns directly.
   * Enterprise requires manual setup.
   * @param {string} organizationId - Organization ID
   * @param {string} [planName='starter'] - Plan name (starter, professional, enterprise)
   * @param {string} [billingCycle='monthly'] - Billing cycle (monthly, annual)
   * @param {Object} [session] - Mongoose session for transactions
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   * @requirements 9.3
   */
  async assignSelectedPlan(organizationId, planName = 'starter', billingCycle = 'monthly', session = null) {
    try {
      if (!isValidObjectId(organizationId)) {
        return { isSuccess: false, message: 'Invalid organization ID', code: 400 };
      }

      // Validate plan name
      const validPlans = ['starter', 'professional', 'enterprise'];
      if (!validPlans.includes(planName)) {
        console.warn(`Invalid plan name '${planName}', defaulting to starter`);
        planName = 'starter';
      }

      // For starter plan, use the existing assignStarterPlan method
      if (planName === 'starter') {
        return await this.assignStarterPlan(organizationId, session);
      }

      // For professional plan, start a trial
      if (planName === 'professional') {
        // First assign starter plan as base
        const starterResult = await this.assignStarterPlan(organizationId, session);
        if (!starterResult.isSuccess) {
          return starterResult;
        }

        // Then start trial for professional
        const trialResult = await this.startTrial(organizationId, 14);
        if (trialResult.isSuccess) {
          // Update billing cycle preference
          const subscription = await Subscription.findOne({ organization_id: organizationId });
          if (subscription) {
            subscription.billingCycle = billingCycle;
            if (session) {
              await subscription.save({ session });
            } else {
              await subscription.save();
            }
          }
        }
        return trialResult;
      }

      // For enterprise plan, assign starter and mark for enterprise contact
      if (planName === 'enterprise') {
        const starterResult = await this.assignStarterPlan(organizationId, session);
        if (starterResult.isSuccess) {
          return {
            isSuccess: true,
            data: {
              ...starterResult.data,
              message: 'Starter plan assigned. Enterprise plan requires contacting sales for custom setup.',
              pendingEnterprise: true
            }
          };
        }
        return starterResult;
      }

      return { isSuccess: false, message: 'Unknown plan type', code: 400 };
    } catch (error) {
      console.error('Error in assignSelectedPlan:', error);
      return { isSuccess: false, message: 'Failed to assign selected plan', code: 500 };
    }
  }
}

// Create singleton instance
const subscriptionService = new SubscriptionService();

module.exports = {
  subscriptionService,
  SubscriptionService,
  SubscriptionError,
  SubscriptionErrorCodes
};
