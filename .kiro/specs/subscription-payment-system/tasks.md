# Implementation Plan: Subscription & Payment System

## Overview

This implementation plan breaks down the subscription and payment system into incremental tasks. Each task builds on previous work, ensuring no orphaned code. The implementation follows a bottom-up approach: database models → services → middleware → controllers → routes → frontend.

## Tasks

- [x] 1. Set up database models for subscription system
  - [x] 1.1 Create SubscriptionPlan model
    - Create `backend/models/subscriptionPlan.model.js`
    - Define schema with name, displayName, description, monthlyPrice, annualPrice, currency, limits (maxUsers, maxProjects, maxStorageBytes), features array, stripePriceIds, isActive, sortOrder
    - Add indexes for name (unique) and isActive
    - _Requirements: 10.1, 1.1, 1.2, 1.3_

  - [x] 1.2 Create Subscription model
    - Create `backend/models/subscription.model.js`
    - Define schema with organization_id, plan_id, status enum, billingCycle, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd, trialStart, trialEnd, providerData (flexible object), pendingPlanChange
    - Add indexes for organization_id (unique), status, currentPeriodEnd
    - _Requirements: 10.2, 2.1, 2.5_

  - [x] 1.3 Create PaymentMethod model
    - Create `backend/models/paymentMethod.model.js`
    - Define schema with organization_id, provider, providerPaymentMethodId, type enum, card details, bank details, isDefault, isActive
    - Add indexes for organization_id and default lookup
    - _Requirements: 10.3, 5.2, 5.3_

  - [x] 1.4 Create Payment model
    - Create `backend/models/payment.model.js`
    - Define schema with organization_id, subscription_id, provider, providerPaymentId, amount, currency, status enum, paymentMethod ref, paidAt, failureReason, refundedAmount, metadata
    - Add indexes for organization_id, providerPaymentId, status
    - _Requirements: 10.4_

  - [x] 1.5 Create Invoice model
    - Create `backend/models/invoice.model.js`
    - Define schema with organization_id, subscription_id, payment_id, invoiceNumber (unique), status enum, amount, currency, lineItems array, billingPeriod, dueDate, paidAt, invoicePdfUrl, providerData
    - Add indexes for organization_id, invoiceNumber, status
    - _Requirements: 10.5, 8.1, 8.2_

  - [x] 1.6 Update Organization model
    - Add subscription ref, stripeCustomerId, billingEmail fields to existing Organization model
    - _Requirements: 10.7_

  - [ ]* 1.7 Write property test for plan data round-trip
    - **Property 1: Plan Data Round-Trip Consistency**
    - **Validates: Requirements 1.2**

- [x] 2. Create seed data and plan configuration
  - [x] 2.1 Create subscription plans seed script
    - Create `backend/database/seeds/subscriptionPlans.seed.js`
    - Define Starter plan: free, 10 users, 3 projects, 1GB storage, basic features
    - Define Professional plan: $29/mo or $290/yr, 50 users, unlimited projects, 10GB storage, advanced features
    - Define Enterprise plan: custom pricing, unlimited everything, all features
    - _Requirements: 1.1, 1.3_

  - [ ]* 2.2 Write property test for annual pricing discount
    - **Property 3: Annual Pricing Discount Calculation**
    - **Validates: Requirements 1.5**

- [ ] 3. Checkpoint - Ensure database models are correct
  - Ensure all models compile without errors
  - Run seed script to populate plans
  - Ask the user if questions arise

- [x] 4. Implement Payment Provider Adapter system
  - [x] 4.1 Create PaymentProviderAdapter base class
    - Create `backend/services/adapters/paymentProvider.adapter.js`
    - Define abstract interface with all required methods: createCustomer, createPaymentIntent, confirmPayment, createSubscription, updateSubscription, cancelSubscription, refund, attachPaymentMethod, detachPaymentMethod, listPaymentMethods, verifyWebhookSignature, getProviderName
    - _Requirements: 3.1_

  - [x] 4.2 Implement StripeAdapter
    - Create `backend/services/adapters/stripe.adapter.js`
    - Implement all PaymentProviderAdapter methods using Stripe SDK
    - Add status normalization methods for consistent response format
    - Handle Stripe-specific error mapping
    - _Requirements: 4.1, 4.2, 4.7_

  - [x] 4.3 Create PaymentService with adapter management
    - Create `backend/services/payment.service.js`
    - Implement adapter registry and dynamic loading based on environment config
    - Implement getAdapter, getAvailableProviders methods
    - Add processPayment, createCustomer, managePaymentMethods wrapper methods
    - _Requirements: 3.2, 3.3, 3.4_

  - [ ]* 4.4 Write property test for adapter response normalization
    - **Property 11: Adapter Response Normalization**
    - **Validates: Requirements 3.5, 3.6**

- [x] 5. Implement Subscription Service
  - [x] 5.1 Create SubscriptionService core methods
    - Create `backend/services/subscription.service.js`
    - Implement createSubscription: validate plan, check existing subscription, create record, initiate payment if paid plan
    - Implement getActiveSubscription: fetch subscription with plan details
    - Implement getSubscriptionWithUsage: combine subscription and usage data
    - _Requirements: 2.1_

  - [x] 5.2 Implement subscription lifecycle methods
    - Add upgradeSubscription: calculate proration, update with provider, update local record
    - Add downgradeSubscription: schedule change for period end
    - Add cancelSubscription: cancel with provider, update status or set cancelAtPeriodEnd
    - Add renewSubscription: handle automatic renewal logic
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 5.3 Implement trial and status management
    - Add startTrial: set trial dates for Professional plan (14 days)
    - Add checkTrialExpiry: transition from trialing to active or expired
    - Add updateSubscriptionStatus: handle status transitions
    - _Requirements: 2.5, 2.7_

  - [x] 5.4 Implement auto-assign Starter plan on organization creation
    - Create hook/middleware that assigns Starter plan when organization is created
    - Ensure subscription is created with correct period dates
    - _Requirements: 1.4_

  - [ ]* 5.5 Write property test for new organization default plan
    - **Property 2: New Organization Default Plan Assignment**
    - **Validates: Requirements 1.4**

  - [ ]* 5.6 Write property test for subscription creation completeness
    - **Property 4: Subscription Creation Field Completeness**
    - **Validates: Requirements 2.1**

  - [ ]* 5.7 Write property test for proration calculation
    - **Property 5: Proration Calculation Correctness**
    - **Validates: Requirements 2.2**

  - [ ]* 5.8 Write property test for downgrade scheduling
    - **Property 6: Downgrade Scheduling at Period End**
    - **Validates: Requirements 2.3**

  - [ ]* 5.9 Write property test for cancelled subscription access
    - **Property 7: Cancelled Subscription Access Preservation**
    - **Validates: Requirements 2.4**

  - [ ]* 5.10 Write property test for subscription status validity
    - **Property 8: Subscription Status Validity**
    - **Validates: Requirements 2.5**

  - [ ]* 5.11 Write property test for trial period duration
    - **Property 9: Trial Period Duration**
    - **Validates: Requirements 2.7**

- [x] 6. Checkpoint - Ensure subscription service works
  - Test subscription creation, upgrade, downgrade, cancel flows
  - Verify Stripe integration in test mode
  - Ask the user if questions arise

- [x] 7. Implement Usage Tracker Service
  - [x] 7.1 Create UsageTracker service
    - Create `backend/services/usageTracker.service.js`
    - Implement getUsage: count users, projects, calculate storage from attachments
    - Implement checkLimits: compare usage against plan limits
    - Implement getUsagePercentages: calculate percentage of each limit used
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 7.2 Implement usage notifications
    - Add checkAndNotify: detect 80% and 100% threshold crossings
    - Integrate with existing notification system (socket/email)
    - Track notification history to prevent duplicate alerts
    - _Requirements: 7.4, 7.5_

  - [x] 7.3 Add real-time usage update hooks
    - Create middleware/hooks to update usage cache on resource create/delete
    - Integrate with User, Project, Attachment model operations
    - _Requirements: 7.7_

  - [ ]* 7.4 Write property test for usage tracking accuracy
    - **Property 15: Usage Tracking Accuracy**
    - **Validates: Requirements 7.1, 7.2, 7.3**

  - [ ]* 7.5 Write property test for usage notification thresholds
    - **Property 16: Usage Notification Thresholds**
    - **Validates: Requirements 7.4, 7.5**

- [-] 8. Implement Access Control Middleware
  - [ ] 8.1 Create subscription access middleware
    - Create `backend/middlewares/subscription.middleware.js`
    - Implement checkSubscriptionLimit middleware factory for users, projects, storage
    - Implement requireFeature middleware for feature-based access
    - Add subscription caching for performance
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.8_

  - [ ] 8.2 Implement limit enforcement responses
    - Return 403 with structured error response including limit info and upgrade URL
    - Include current usage and limit in response for UI display
    - _Requirements: 6.6_

  - [ ] 8.3 Implement expired subscription handling
    - Add read-only mode enforcement for expired/cancelled subscriptions
    - Allow GET requests, block POST/PUT/DELETE
    - _Requirements: 6.7_

  - [ ]* 8.4 Write property test for limit enforcement
    - **Property 12: Limit Enforcement**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.6**

  - [ ]* 8.5 Write property test for feature access enforcement
    - **Property 13: Feature Access Enforcement**
    - **Validates: Requirements 6.4, 6.5**

  - [ ]* 8.6 Write property test for expired subscription read-only mode
    - **Property 14: Expired Subscription Read-Only Mode**
    - **Validates: Requirements 6.7**

- [x] 9. Integrate access control with existing routes
  - [x] 9.1 Add user limit check to employee creation
    - Update user routes to use checkSubscriptionLimit('users') middleware
    - _Requirements: 6.1_

  - [x] 9.2 Add project limit check to project creation
    - Update project routes to use checkSubscriptionLimit('projects') middleware
    - _Requirements: 6.2_

  - [x] 9.3 Add storage limit check to attachment upload
    - Update attachment/upload routes to use checkSubscriptionLimit('storage') middleware
    - _Requirements: 6.3_

  - [x] 9.4 Add feature checks to protected routes
    - Add requireFeature('audit_logs') to audit log routes
    - Add requireFeature('api_access') to API routes (if applicable)
    - _Requirements: 6.4, 6.5_

- [x] 10. Checkpoint - Ensure access control works
  - Test limit enforcement for each resource type
  - Test feature access restrictions
  - Test expired subscription behavior
  - Ask the user if questions arise

- [x] 11. Implement Invoice Service
  - [x] 11.1 Create InvoiceService
    - Create `backend/services/invoice.service.js`
    - Implement generateInvoice: create invoice with line items from subscription
    - Implement generateInvoiceNumber: unique sequential numbering
    - Implement getInvoices: list invoices for organization with pagination
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 11.2 Implement invoice PDF generation
    - Add generateInvoicePdf: create PDF from invoice data
    - Store PDF URL in invoice record
    - _Requirements: 8.4_

  - [x] 11.3 Implement invoice email notifications
    - Add sendInvoiceEmail: send invoice via email on payment/renewal
    - Integrate with existing mail utility
    - _Requirements: 8.5_

  - [ ]* 11.4 Write property test for invoice generation completeness
    - **Property 17: Invoice Generation Completeness**
    - **Validates: Requirements 8.1**

  - [ ]* 11.5 Write property test for invoice line items sum
    - **Property 18: Invoice Line Items Sum Invariant**
    - **Validates: Requirements 8.2**

- [x] 12. Implement Webhook Handler
  - [x] 12.1 Create Stripe webhook handler
    - Create `backend/controllers/webhook.controller.js`
    - Implement signature verification using adapter
    - Handle payment_intent.succeeded: update payment status, create invoice
    - Handle payment_intent.failed: update payment status, notify admin
    - Handle customer.subscription.updated: sync subscription status
    - Handle customer.subscription.deleted: mark subscription cancelled
    - Handle invoice.paid: update invoice status
    - Handle invoice.payment_failed: update status, trigger retry logic
    - _Requirements: 4.5_

  - [x] 12.2 Create webhook routes
    - Create `backend/routes/webhook.routes.js`
    - Add POST /webhooks/stripe endpoint with raw body parsing
    - _Requirements: 4.5_

- [x] 13. Implement Subscription and Payment Controllers
  - [x] 13.1 Create SubscriptionController
    - Create `backend/controllers/subscription.controller.js`
    - Implement getPlans: list available subscription plans
    - Implement getCurrentSubscription: get org's subscription with usage
    - Implement createSubscription: initiate new subscription
    - Implement upgradeSubscription: handle plan upgrade
    - Implement downgradeSubscription: handle plan downgrade
    - Implement cancelSubscription: handle cancellation
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 13.2 Create PaymentController
    - Create `backend/controllers/payment.controller.js`
    - Implement createPaymentIntent: initiate payment for subscription
    - Implement getPaymentMethods: list saved payment methods
    - Implement addPaymentMethod: save new payment method
    - Implement removePaymentMethod: delete payment method
    - Implement setDefaultPaymentMethod: update default
    - _Requirements: 4.2, 5.2, 5.3_

  - [x] 13.3 Create InvoiceController
    - Create `backend/controllers/invoice.controller.js`
    - Implement getInvoices: list invoices with pagination
    - Implement getInvoice: get single invoice details
    - Implement downloadInvoice: return PDF
    - _Requirements: 8.3, 8.4_

  - [ ]* 13.4 Write property test for payment method default uniqueness
    - **Property 19: Payment Method Default Uniqueness**
    - **Validates: Requirements 5.3**

- [x] 14. Create API Routes
  - [x] 14.1 Create subscription routes
    - Create `backend/routes/subscription.routes.js`
    - GET /subscriptions/plans - list plans
    - GET /subscriptions/current - get current subscription
    - POST /subscriptions - create subscription
    - PUT /subscriptions/upgrade - upgrade plan
    - PUT /subscriptions/downgrade - downgrade plan
    - POST /subscriptions/cancel - cancel subscription
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 14.2 Create payment routes
    - Create `backend/routes/payment.routes.js`
    - POST /payments/intent - create payment intent
    - GET /payments/methods - list payment methods
    - POST /payments/methods - add payment method
    - DELETE /payments/methods/:id - remove payment method
    - PUT /payments/methods/:id/default - set default
    - _Requirements: 4.2, 5.2, 5.3_

  - [x] 14.3 Create invoice routes
    - Create `backend/routes/invoice.routes.js`
    - GET /invoices - list invoices
    - GET /invoices/:id - get invoice
    - GET /invoices/:id/download - download PDF
    - _Requirements: 8.3, 8.4_

  - [x] 14.4 Create usage routes
    - Add GET /usage endpoint to return current usage statistics
    - _Requirements: 7.6_

  - [x] 14.5 Register all routes in main app
    - Update `backend/index.js` to include new routes
    - Apply appropriate auth middleware

- [x] 15. Checkpoint - Ensure backend API is complete
  - Test all API endpoints with Postman/curl
  - Verify Stripe test mode integration
  - Ask the user if questions arise

- [x] 16. Implement Frontend - Redux State Management
  - [x] 16.1 Create subscription slice
    - Create `frontend/src/features/subscriptionSlice.js`
    - Add state for currentPlan, subscription, usage, plans
    - Add async thunks for fetching and updating subscription
    - _Requirements: 9.1, 9.2_

  - [x] 16.2 Create payment slice
    - Create `frontend/src/features/paymentSlice.js`
    - Add state for paymentMethods, paymentIntent, loading states
    - Add async thunks for payment operations
    - _Requirements: 9.6_

  - [x] 16.3 Create invoice slice
    - Create `frontend/src/features/invoiceSlice.js`
    - Add state for invoices, pagination
    - Add async thunks for fetching invoices
    - _Requirements: 9.5_

- [x] 17. Implement Frontend - API Services
  - [x] 17.1 Create subscription service
    - Create `frontend/src/services/subscription.service.js`
    - Add methods for all subscription API endpoints
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 17.2 Create payment service
    - Create `frontend/src/services/payment.service.js`
    - Add methods for payment API endpoints
    - _Requirements: 9.6, 9.8_

  - [x] 17.3 Create invoice service
    - Create `frontend/src/services/invoice.service.js`
    - Add methods for invoice API endpoints
    - _Requirements: 9.5_

- [x] 18. Implement Frontend - Subscription UI Components
  - [x] 18.1 Create SubscriptionSettings component
    - Create `frontend/src/components/page/organization/SubscriptionSettings.jsx`
    - Display current plan name, status, billing cycle
    - Show usage metrics with progress bars
    - Add upgrade/downgrade buttons
    - _Requirements: 9.1, 9.2_

  - [x] 18.2 Create PlanComparison component
    - Create `frontend/src/components/page/organization/PlanComparison.jsx`
    - Display all plans side-by-side with features
    - Highlight current plan and recommended plan
    - Show pricing with monthly/annual toggle
    - _Requirements: 9.3_

  - [x] 18.3 Create UsageMetrics component
    - Create `frontend/src/components/page/organization/UsageMetrics.jsx`
    - Display user count, project count, storage usage
    - Show progress bars with color coding (green/yellow/red)
    - _Requirements: 9.2_

  - [x] 18.4 Create UpgradePrompt component
    - Create `frontend/src/components/ui/UpgradePrompt.jsx`
    - Contextual prompt shown when limits reached
    - Include current usage, limit, and upgrade CTA
    - _Requirements: 9.7_

- [x] 19. Implement Frontend - Payment UI Components
  - [x] 19.1 Create PaymentMethodList component
    - Create `frontend/src/components/page/organization/PaymentMethodList.jsx`
    - Display saved payment methods with card icons
    - Show default indicator, add/remove buttons
    - _Requirements: 9.6_

  - [x] 19.2 Create AddPaymentMethod component with Stripe Elements
    - Create `frontend/src/components/page/organization/AddPaymentMethod.jsx`
    - Integrate Stripe Elements for secure card input
    - Handle payment method creation flow
    - _Requirements: 9.8_

  - [x] 19.3 Create CheckoutModal component
    - Create `frontend/src/components/page/organization/CheckoutModal.jsx`
    - Show plan details, prorated amount (if upgrade)
    - Payment method selection
    - Confirm button with loading state
    - _Requirements: 9.4_

- [x] 20. Implement Frontend - Billing History UI
  - [x] 20.1 Create BillingHistory component
    - Create `frontend/src/components/page/organization/BillingHistory.jsx`
    - Display invoices in table format
    - Show date, amount, status, download link
    - Add pagination
    - _Requirements: 9.5_

  - [x] 20.2 Create InvoiceDetail component
    - Create `frontend/src/components/page/organization/InvoiceDetail.jsx`
    - Display full invoice with line items
    - Download PDF button
    - _Requirements: 9.5_

- [x] 21. Integrate subscription UI into organization settings
  - [x] 21.1 Update OrganizationSettings page
    - Add Subscription tab to existing settings page
    - Include SubscriptionSettings, PlanComparison, PaymentMethodList, BillingHistory
    - _Requirements: 9.1_

  - [x] 21.2 Add upgrade prompts to limit-reached scenarios
    - Update user creation flow to show UpgradePrompt on 403
    - Update project creation flow to show UpgradePrompt on 403
    - Update file upload to show UpgradePrompt on 403
    - _Requirements: 9.7_

- [x] 22. Update Landing Page Pricing Section
  - [x] 22.1 Review and update PricingSection if needed
    - Verify pricing matches backend plan configuration
    - Ensure CTAs link to registration with plan parameter
    - _Requirements: 9.3_

  - [x] 22.2 Update RegisterOrg to handle plan selection
    - Accept plan query parameter from pricing page
    - Show selected plan during registration
    - Create subscription after organization approval
    - _Requirements: 9.3_

- [x] 23. Final Checkpoint - Full system integration test
  - Test complete flow: register org → select plan → pay → use features → hit limits → upgrade
  - Verify webhook handling in Stripe test mode
  - Test downgrade and cancellation flows
  - Verify invoice generation and download
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Stripe integration uses test mode keys during development
- Frontend uses Stripe Elements for PCI compliance

