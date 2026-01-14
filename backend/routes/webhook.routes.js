const router = require('express').Router();
const { handleStripeWebhook } = require('../controllers/webhook.controller');

/**
 * Webhook Routes
 * 
 * These routes handle incoming webhooks from payment providers.
 * IMPORTANT: Webhook routes must use raw body parsing for signature verification.
 * 
 * @requirements 4.5
 */

/**
 * POST /webhooks/stripe
 * Handle Stripe webhook events
 * 
 * Note: This route expects raw body (not JSON parsed) for signature verification.
 * The raw body parsing is configured in the main app file.
 */
router.post('/stripe', handleStripeWebhook);

module.exports = router;
