const router = require("express").Router();
const {
  getInvoices,
  getInvoice,
  downloadInvoice,
  getInvoiceByNumber,
  getInvoiceStats,
  sendInvoiceEmail,
} = require("../controllers/invoice.controller");
const { isLoggedIn } = require("../middlewares/auth.middleware");

/**
 * Invoice Routes
 * 
 * @requirements 8.3, 8.4
 */

// GET /invoices - List all invoices for the organization with pagination
router.get("/", isLoggedIn, getInvoices);

// GET /invoices/stats - Get invoice statistics for the organization
router.get("/stats", isLoggedIn, getInvoiceStats);

// GET /invoices/number/:invoiceNumber - Get invoice by invoice number
router.get("/number/:invoiceNumber", isLoggedIn, getInvoiceByNumber);

// GET /invoices/:id - Get a single invoice by ID
router.get("/:id", isLoggedIn, getInvoice);

// GET /invoices/:id/download - Download invoice as PDF
router.get("/:id/download", isLoggedIn, downloadInvoice);

// POST /invoices/:id/send - Send invoice email
router.post("/:id/send", isLoggedIn, sendInvoiceEmail);

module.exports = router;
