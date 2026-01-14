const router = require("express").Router();
const {
  createPaymentIntent,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  getAvailableProviders,
  processRefund,
} = require("../controllers/payment.controller");
const { isLoggedIn, checkPermission } = require("../middlewares/auth.middleware");

/**
 * Payment Routes
 * 
 * @requirements 4.2, 5.2, 5.3
 */

// POST /payments/intent - Create a payment intent for subscription payment
router.post("/intent", isLoggedIn, createPaymentIntent);

// GET /payments/methods - List all payment methods for the organization
router.get("/methods", isLoggedIn, getPaymentMethods);

// POST /payments/methods - Add a new payment method
router.post("/methods", isLoggedIn, addPaymentMethod);

// DELETE /payments/methods/:id - Remove a payment method
router.delete("/methods/:id", isLoggedIn, removePaymentMethod);

// PUT /payments/methods/:id/default - Set a payment method as default
router.put("/methods/:id/default", isLoggedIn, setDefaultPaymentMethod);

// GET /payments/providers - Get available payment providers
router.get("/providers", isLoggedIn, getAvailableProviders);

// POST /payments/:id/refund - Process a refund (admin only)
router.post("/:id/refund", isLoggedIn, processRefund);

module.exports = router;
