const {
  errorResponse,
  successResponse,
  catchResponse,
} = require("../utils/response");
const { paymentService } = require("../services/payment.service");

/**
 * PaymentController - Handles payment-related HTTP requests
 * 
 * @requirements 4.2, 5.2, 5.3
 */

/**
 * Create a payment intent for subscription payment
 * POST /payments/intent
 * Body: { amount, currency, metadata }
 * @requirements 4.2
 */
const createPaymentIntent = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { amount, currency, metadata } = req.body;

    if (!organizationId) {
      return errorResponse(res, 400, "Organization ID is required");
    }

    if (!amount || amount <= 0) {
      return errorResponse(res, 400, "Valid amount is required");
    }

    const response = await paymentService.createPaymentIntent(
      organizationId,
      { amount, currency: currency || 'usd', metadata }
    );

    if (!response.isSuccess) {
      return errorResponse(res, response.code || 500, response.message);
    }
    return successResponse(res, response.data, "Payment intent created successfully", 201);
  } catch (err) {
    console.error("Error creating payment intent:", err);
    return catchResponse(res);
  }
};

/**
 * Get all payment methods for the organization
 * GET /payments/methods
 * @requirements 5.2
 */
const getPaymentMethods = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;

    if (!organizationId) {
      return errorResponse(res, 400, "Organization ID is required");
    }

    const response = await paymentService.getPaymentMethods(organizationId);
    if (!response.isSuccess) {
      return errorResponse(res, response.code || 500, response.message);
    }
    return successResponse(res, response.data, "Payment methods retrieved successfully");
  } catch (err) {
    console.error("Error getting payment methods:", err);
    return catchResponse(res);
  }
};


/**
 * Add a new payment method
 * POST /payments/methods
 * Body: { paymentMethodId, setAsDefault }
 * @requirements 5.2
 */
const addPaymentMethod = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { paymentMethodId, setAsDefault } = req.body;

    if (!organizationId) {
      return errorResponse(res, 400, "Organization ID is required");
    }

    if (!paymentMethodId) {
      return errorResponse(res, 400, "Payment method ID is required");
    }

    const response = await paymentService.addPaymentMethod(
      organizationId,
      paymentMethodId,
      setAsDefault === true
    );

    if (!response.isSuccess) {
      return errorResponse(res, response.code || 500, response.message);
    }
    return successResponse(res, response.data, "Payment method added successfully", 201);
  } catch (err) {
    console.error("Error adding payment method:", err);
    return catchResponse(res);
  }
};

/**
 * Remove a payment method
 * DELETE /payments/methods/:id
 * @requirements 5.2
 */
const removePaymentMethod = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { id } = req.params;

    if (!organizationId) {
      return errorResponse(res, 400, "Organization ID is required");
    }

    if (!id) {
      return errorResponse(res, 400, "Payment method ID is required");
    }

    const response = await paymentService.removePaymentMethod(organizationId, id);
    if (!response.isSuccess) {
      return errorResponse(res, response.code || 500, response.message);
    }
    return successResponse(res, null, "Payment method removed successfully");
  } catch (err) {
    console.error("Error removing payment method:", err);
    return catchResponse(res);
  }
};

/**
 * Set a payment method as default
 * PUT /payments/methods/:id/default
 * @requirements 5.3
 */
const setDefaultPaymentMethod = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { id } = req.params;

    if (!organizationId) {
      return errorResponse(res, 400, "Organization ID is required");
    }

    if (!id) {
      return errorResponse(res, 400, "Payment method ID is required");
    }

    const response = await paymentService.setDefaultPaymentMethod(organizationId, id);
    if (!response.isSuccess) {
      return errorResponse(res, response.code || 500, response.message);
    }
    return successResponse(res, null, "Default payment method updated successfully");
  } catch (err) {
    console.error("Error setting default payment method:", err);
    return catchResponse(res);
  }
};

/**
 * Get available payment providers
 * GET /payments/providers
 */
const getAvailableProviders = async (req, res) => {
  try {
    const providers = paymentService.getAvailableProviders();
    return successResponse(res, { providers }, "Payment providers retrieved successfully");
  } catch (err) {
    console.error("Error getting payment providers:", err);
    return catchResponse(res);
  }
};

/**
 * Process a refund for a payment
 * POST /payments/:id/refund
 * Body: { amount, reason }
 */
const processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    if (!id) {
      return errorResponse(res, 400, "Payment ID is required");
    }

    const response = await paymentService.processRefund(id, { amount, reason });
    if (!response.isSuccess) {
      return errorResponse(res, response.code || 500, response.message);
    }
    return successResponse(res, response.data, "Refund processed successfully");
  } catch (err) {
    console.error("Error processing refund:", err);
    return catchResponse(res);
  }
};

module.exports = {
  createPaymentIntent,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  getAvailableProviders,
  processRefund,
};
