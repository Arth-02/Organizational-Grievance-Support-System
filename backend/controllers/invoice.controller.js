const {
  errorResponse,
  successResponse,
  catchResponse,
} = require("../utils/response");
const { invoiceService } = require("../services/invoice.service");

/**
 * InvoiceController - Handles invoice-related HTTP requests
 * 
 * @requirements 8.3, 8.4
 */

/**
 * Get all invoices for the organization with pagination
 * GET /invoices
 * Query: { page, limit, status, sortBy, sortOrder }
 * @requirements 8.3
 */
const getInvoices = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { page, limit, status, sortBy, sortOrder } = req.query;

    if (!organizationId) {
      return errorResponse(res, 400, "Organization ID is required");
    }

    const options = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
      status,
      sortBy: sortBy || 'created_at',
      sortOrder: sortOrder || 'desc'
    };

    const response = await invoiceService.getInvoices(organizationId, options);
    if (!response.isSuccess) {
      return errorResponse(res, response.code || 500, response.message);
    }
    return successResponse(res, response.data, "Invoices retrieved successfully");
  } catch (err) {
    console.error("Error getting invoices:", err);
    return catchResponse(res);
  }
};

/**
 * Get a single invoice by ID
 * GET /invoices/:id
 * @requirements 8.3
 */
const getInvoice = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { id } = req.params;

    if (!organizationId) {
      return errorResponse(res, 400, "Organization ID is required");
    }

    if (!id) {
      return errorResponse(res, 400, "Invoice ID is required");
    }

    const response = await invoiceService.getInvoice(id, organizationId);
    if (!response.isSuccess) {
      return errorResponse(res, response.code || 500, response.message);
    }
    return successResponse(res, response.data, "Invoice retrieved successfully");
  } catch (err) {
    console.error("Error getting invoice:", err);
    return catchResponse(res);
  }
};


/**
 * Download invoice as PDF
 * GET /invoices/:id/download
 * @requirements 8.4
 */
const downloadInvoice = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { id } = req.params;

    if (!organizationId) {
      return errorResponse(res, 400, "Organization ID is required");
    }

    if (!id) {
      return errorResponse(res, 400, "Invoice ID is required");
    }

    // Get or generate PDF
    const response = await invoiceService.getInvoicePdf(id, organizationId);
    if (!response.isSuccess) {
      return errorResponse(res, response.code || 500, response.message);
    }

    // Return the PDF URL for client-side download
    return successResponse(res, {
      invoiceId: response.data.invoiceId,
      invoiceNumber: response.data.invoiceNumber,
      downloadUrl: response.data.invoicePdfUrl
    }, "Invoice PDF ready for download");
  } catch (err) {
    console.error("Error downloading invoice:", err);
    return catchResponse(res);
  }
};

/**
 * Get invoice by invoice number
 * GET /invoices/number/:invoiceNumber
 * @requirements 8.3
 */
const getInvoiceByNumber = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { invoiceNumber } = req.params;

    if (!organizationId) {
      return errorResponse(res, 400, "Organization ID is required");
    }

    if (!invoiceNumber) {
      return errorResponse(res, 400, "Invoice number is required");
    }

    const response = await invoiceService.getInvoiceByNumber(invoiceNumber, organizationId);
    if (!response.isSuccess) {
      return errorResponse(res, response.code || 500, response.message);
    }
    return successResponse(res, response.data, "Invoice retrieved successfully");
  } catch (err) {
    console.error("Error getting invoice by number:", err);
    return catchResponse(res);
  }
};

/**
 * Get invoice statistics for the organization
 * GET /invoices/stats
 */
const getInvoiceStats = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;

    if (!organizationId) {
      return errorResponse(res, 400, "Organization ID is required");
    }

    const response = await invoiceService.getInvoiceStats(organizationId);
    if (!response.isSuccess) {
      return errorResponse(res, response.code || 500, response.message);
    }
    return successResponse(res, response.data, "Invoice statistics retrieved successfully");
  } catch (err) {
    console.error("Error getting invoice stats:", err);
    return catchResponse(res);
  }
};

/**
 * Send invoice email
 * POST /invoices/:id/send
 * Body: { type: 'new' | 'paid' | 'reminder' }
 */
const sendInvoiceEmail = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { id } = req.params;
    const { type } = req.body;

    if (!organizationId) {
      return errorResponse(res, 400, "Organization ID is required");
    }

    if (!id) {
      return errorResponse(res, 400, "Invoice ID is required");
    }

    // Verify the invoice belongs to the organization
    const invoiceCheck = await invoiceService.getInvoice(id, organizationId);
    if (!invoiceCheck.isSuccess) {
      return errorResponse(res, invoiceCheck.code || 404, invoiceCheck.message);
    }

    const response = await invoiceService.sendInvoiceEmail(id, type || 'new');
    if (!response.isSuccess) {
      return errorResponse(res, response.code || 500, response.message);
    }
    return successResponse(res, response.data, "Invoice email sent successfully");
  } catch (err) {
    console.error("Error sending invoice email:", err);
    return catchResponse(res);
  }
};

module.exports = {
  getInvoices,
  getInvoice,
  downloadInvoice,
  getInvoiceByNumber,
  getInvoiceStats,
  sendInvoiceEmail,
};
