const Invoice = require('../models/invoice.model');
const Subscription = require('../models/subscription.model');
const Organization = require('../models/organization.model');
const Payment = require('../models/payment.model');
const { isValidObjectId } = require('mongoose');
const PDFDocument = require('pdfkit');
const cloudinary = require('cloudinary').v2;
const { sendEmail } = require('../utils/mail');

/**
 * Invoice error class for standardized error handling
 */
class InvoiceError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'InvoiceError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Invoice error codes for consistent error handling
 */
const InvoiceErrorCodes = {
  INVOICE_NOT_FOUND: 'invoice_not_found',
  ORGANIZATION_NOT_FOUND: 'organization_not_found',
  SUBSCRIPTION_NOT_FOUND: 'subscription_not_found',
  PAYMENT_NOT_FOUND: 'payment_not_found',
  INVALID_AMOUNT: 'invalid_amount',
  GENERATION_FAILED: 'generation_failed',
  PDF_GENERATION_FAILED: 'pdf_generation_failed',
  EMAIL_SEND_FAILED: 'email_send_failed'
};

/**
 * InvoiceService - Manages invoice generation and retrieval
 * 
 * @requirements 8.1, 8.2, 8.3, 8.4, 8.5
 */
class InvoiceService {
  /**
   * Generate a unique sequential invoice number
   * Format: INV-YYYYMM-XXXXX (e.g., INV-202401-00001)
   * @returns {Promise<string>} Unique invoice number
   * @requirements 8.1
   */
  async generateInvoiceNumber() {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `INV-${yearMonth}-`;
    
    // Find the latest invoice with this prefix
    const latestInvoice = await Invoice.findOne({
      invoiceNumber: { $regex: `^${prefix}` }
    }).sort({ invoiceNumber: -1 });

    let sequenceNumber = 1;
    if (latestInvoice) {
      const lastSequence = parseInt(latestInvoice.invoiceNumber.split('-')[2], 10);
      sequenceNumber = lastSequence + 1;
    }

    return `${prefix}${String(sequenceNumber).padStart(5, '0')}`;
  }


  /**
   * Generate an invoice from a subscription payment
   * @param {Object} params - Invoice generation parameters
   * @param {string} params.organizationId - Organization ID
   * @param {string} [params.subscriptionId] - Subscription ID
   * @param {string} [params.paymentId] - Payment ID
   * @param {number} params.amount - Invoice amount in cents
   * @param {string} [params.currency='usd'] - Currency code
   * @param {string} [params.status='pending'] - Invoice status
   * @param {Array} [params.lineItems] - Line items for the invoice
   * @param {Object} [params.billingPeriod] - Billing period { start, end }
   * @param {Date} [params.dueDate] - Due date for the invoice
   * @param {Object} [params.providerData] - Provider-specific data
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   * @requirements 8.1, 8.2
   */
  async generateInvoice(params) {
    try {
      const {
        organizationId,
        subscriptionId,
        paymentId,
        amount,
        currency = 'usd',
        status = 'pending',
        lineItems = [],
        billingPeriod,
        dueDate,
        providerData
      } = params;

      // Validate organization ID
      if (!isValidObjectId(organizationId)) {
        return { isSuccess: false, message: 'Invalid organization ID', code: 400 };
      }

      // Validate amount
      if (typeof amount !== 'number' || amount < 0) {
        return { isSuccess: false, message: 'Invalid amount', code: 400 };
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

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Build line items if not provided
      let finalLineItems = lineItems;
      if (finalLineItems.length === 0 && subscriptionId) {
        const subscription = await Subscription.findById(subscriptionId).populate('plan_id');
        if (subscription && subscription.plan_id) {
          const plan = subscription.plan_id;
          const billingCycleLabel = subscription.billingCycle === 'annual' ? 'Annual' : 'Monthly';
          finalLineItems = [{
            description: `${plan.displayName} Plan - ${billingCycleLabel} Subscription`,
            quantity: 1,
            unitPrice: amount,
            amount: amount
          }];
        }
      }

      // Ensure line items sum equals total amount (invariant check)
      const lineItemsSum = finalLineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      if (finalLineItems.length > 0 && lineItemsSum !== amount) {
        // Adjust the last line item to match total
        if (finalLineItems.length === 1) {
          finalLineItems[0].amount = amount;
          finalLineItems[0].unitPrice = amount;
        }
      }

      // Create invoice record
      const invoiceData = {
        organization_id: organizationId,
        invoiceNumber,
        amount,
        currency,
        status,
        lineItems: finalLineItems,
        dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      };

      if (subscriptionId && isValidObjectId(subscriptionId)) {
        invoiceData.subscription_id = subscriptionId;
      }

      if (paymentId && isValidObjectId(paymentId)) {
        invoiceData.payment_id = paymentId;
      }

      if (billingPeriod) {
        invoiceData.billingPeriod = billingPeriod;
      }

      if (providerData) {
        invoiceData.providerData = providerData;
      }

      // Set paidAt if status is paid
      if (status === 'paid') {
        invoiceData.paidAt = new Date();
      }

      const invoice = await Invoice.create(invoiceData);

      return {
        isSuccess: true,
        data: {
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          currency: invoice.currency,
          status: invoice.status,
          lineItems: invoice.lineItems,
          billingPeriod: invoice.billingPeriod,
          dueDate: invoice.dueDate,
          paidAt: invoice.paidAt,
          createdAt: invoice.created_at
        }
      };
    } catch (error) {
      console.error('Error in generateInvoice:', error);
      if (error.code === 11000) {
        // Duplicate invoice number - retry with new number
        return this.generateInvoice(params);
      }
      return { isSuccess: false, message: 'Failed to generate invoice', code: 500 };
    }
  }


  /**
   * Get invoices for an organization with pagination
   * @param {string} organizationId - Organization ID
   * @param {Object} [options] - Query options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=10] - Items per page
   * @param {string} [options.status] - Filter by status
   * @param {string} [options.sortBy='created_at'] - Sort field
   * @param {string} [options.sortOrder='desc'] - Sort order
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   * @requirements 8.3
   */
  async getInvoices(organizationId, options = {}) {
    try {
      if (!isValidObjectId(organizationId)) {
        return { isSuccess: false, message: 'Invalid organization ID', code: 400 };
      }

      const {
        page = 1,
        limit = 10,
        status,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = options;

      // Build query
      const query = { organization_id: organizationId };
      if (status) {
        query.status = status;
      }

      // Build sort
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Calculate skip
      const skip = (page - 1) * limit;

      // Execute query with pagination
      const [invoices, totalCount] = await Promise.all([
        Invoice.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('subscription_id', 'plan_id billingCycle')
          .populate('payment_id', 'provider status paidAt')
          .lean(),
        Invoice.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        isSuccess: true,
        data: {
          invoices: invoices.map(invoice => ({
            invoiceId: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.amount,
            currency: invoice.currency,
            status: invoice.status,
            lineItems: invoice.lineItems,
            billingPeriod: invoice.billingPeriod,
            dueDate: invoice.dueDate,
            paidAt: invoice.paidAt,
            invoicePdfUrl: invoice.invoicePdfUrl,
            subscription: invoice.subscription_id,
            payment: invoice.payment_id,
            createdAt: invoice.created_at
          })),
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      };
    } catch (error) {
      console.error('Error in getInvoices:', error);
      return { isSuccess: false, message: 'Failed to get invoices', code: 500 };
    }
  }

  /**
   * Get a single invoice by ID
   * @param {string} invoiceId - Invoice ID
   * @param {string} [organizationId] - Organization ID for authorization check
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   * @requirements 8.3
   */
  async getInvoice(invoiceId, organizationId = null) {
    try {
      if (!isValidObjectId(invoiceId)) {
        return { isSuccess: false, message: 'Invalid invoice ID', code: 400 };
      }

      const query = { _id: invoiceId };
      if (organizationId) {
        if (!isValidObjectId(organizationId)) {
          return { isSuccess: false, message: 'Invalid organization ID', code: 400 };
        }
        query.organization_id = organizationId;
      }

      const invoice = await Invoice.findOne(query)
        .populate('organization_id', 'name email address')
        .populate({
          path: 'subscription_id',
          populate: { path: 'plan_id', select: 'name displayName' }
        })
        .populate('payment_id', 'provider status paidAt amount');

      if (!invoice) {
        return { 
          isSuccess: false, 
          message: 'Invoice not found', 
          code: 404 
        };
      }

      return {
        isSuccess: true,
        data: {
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          organization: invoice.organization_id,
          subscription: invoice.subscription_id,
          payment: invoice.payment_id,
          amount: invoice.amount,
          currency: invoice.currency,
          status: invoice.status,
          lineItems: invoice.lineItems,
          billingPeriod: invoice.billingPeriod,
          dueDate: invoice.dueDate,
          paidAt: invoice.paidAt,
          invoicePdfUrl: invoice.invoicePdfUrl,
          providerData: invoice.providerData,
          createdAt: invoice.created_at,
          updatedAt: invoice.updated_at
        }
      };
    } catch (error) {
      console.error('Error in getInvoice:', error);
      return { isSuccess: false, message: 'Failed to get invoice', code: 500 };
    }
  }

  /**
   * Get invoice by invoice number
   * @param {string} invoiceNumber - Invoice number
   * @param {string} [organizationId] - Organization ID for authorization check
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   * @requirements 8.3
   */
  async getInvoiceByNumber(invoiceNumber, organizationId = null) {
    try {
      if (!invoiceNumber || typeof invoiceNumber !== 'string') {
        return { isSuccess: false, message: 'Invalid invoice number', code: 400 };
      }

      const query = { invoiceNumber };
      if (organizationId) {
        if (!isValidObjectId(organizationId)) {
          return { isSuccess: false, message: 'Invalid organization ID', code: 400 };
        }
        query.organization_id = organizationId;
      }

      const invoice = await Invoice.findOne(query)
        .populate('organization_id', 'name email address')
        .populate({
          path: 'subscription_id',
          populate: { path: 'plan_id', select: 'name displayName' }
        })
        .populate('payment_id', 'provider status paidAt amount');

      if (!invoice) {
        return { 
          isSuccess: false, 
          message: 'Invoice not found', 
          code: 404 
        };
      }

      return {
        isSuccess: true,
        data: {
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          organization: invoice.organization_id,
          subscription: invoice.subscription_id,
          payment: invoice.payment_id,
          amount: invoice.amount,
          currency: invoice.currency,
          status: invoice.status,
          lineItems: invoice.lineItems,
          billingPeriod: invoice.billingPeriod,
          dueDate: invoice.dueDate,
          paidAt: invoice.paidAt,
          invoicePdfUrl: invoice.invoicePdfUrl,
          providerData: invoice.providerData,
          createdAt: invoice.created_at,
          updatedAt: invoice.updated_at
        }
      };
    } catch (error) {
      console.error('Error in getInvoiceByNumber:', error);
      return { isSuccess: false, message: 'Failed to get invoice', code: 500 };
    }
  }


  /**
   * Update invoice status
   * @param {string} invoiceId - Invoice ID
   * @param {string} status - New status
   * @param {Object} [additionalData] - Additional data to update
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   * @requirements 8.1
   */
  async updateInvoiceStatus(invoiceId, status, additionalData = {}) {
    try {
      if (!isValidObjectId(invoiceId)) {
        return { isSuccess: false, message: 'Invalid invoice ID', code: 400 };
      }

      const validStatuses = ['draft', 'pending', 'paid', 'failed', 'refunded', 'void'];
      if (!validStatuses.includes(status)) {
        return { isSuccess: false, message: 'Invalid status', code: 400 };
      }

      const updateData = { status, ...additionalData };
      
      // Set paidAt if transitioning to paid
      if (status === 'paid' && !additionalData.paidAt) {
        updateData.paidAt = new Date();
      }

      const invoice = await Invoice.findByIdAndUpdate(
        invoiceId,
        updateData,
        { new: true }
      );

      if (!invoice) {
        return { 
          isSuccess: false, 
          message: 'Invoice not found', 
          code: 404 
        };
      }

      return {
        isSuccess: true,
        data: {
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          paidAt: invoice.paidAt,
          updatedAt: invoice.updated_at
        }
      };
    } catch (error) {
      console.error('Error in updateInvoiceStatus:', error);
      return { isSuccess: false, message: 'Failed to update invoice status', code: 500 };
    }
  }

  /**
   * Generate invoice from a payment record
   * @param {string} paymentId - Payment ID
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   * @requirements 8.1, 8.2
   */
  async generateInvoiceFromPayment(paymentId) {
    try {
      if (!isValidObjectId(paymentId)) {
        return { isSuccess: false, message: 'Invalid payment ID', code: 400 };
      }

      const payment = await Payment.findById(paymentId)
        .populate({
          path: 'subscription_id',
          populate: { path: 'plan_id' }
        });

      if (!payment) {
        return { 
          isSuccess: false, 
          message: 'Payment not found', 
          code: 404 
        };
      }

      // Check if invoice already exists for this payment
      const existingInvoice = await Invoice.findOne({ payment_id: paymentId });
      if (existingInvoice) {
        return {
          isSuccess: true,
          data: {
            invoiceId: existingInvoice._id,
            invoiceNumber: existingInvoice.invoiceNumber,
            message: 'Invoice already exists for this payment'
          }
        };
      }

      // Build line items from subscription
      const lineItems = [];
      let billingPeriod = null;

      if (payment.subscription_id && payment.subscription_id.plan_id) {
        const subscription = payment.subscription_id;
        const plan = subscription.plan_id;
        const billingCycleLabel = subscription.billingCycle === 'annual' ? 'Annual' : 'Monthly';
        
        lineItems.push({
          description: `${plan.displayName} Plan - ${billingCycleLabel} Subscription`,
          quantity: 1,
          unitPrice: payment.amount,
          amount: payment.amount
        });

        billingPeriod = {
          start: subscription.currentPeriodStart,
          end: subscription.currentPeriodEnd
        };
      } else {
        lineItems.push({
          description: 'Payment',
          quantity: 1,
          unitPrice: payment.amount,
          amount: payment.amount
        });
      }

      // Determine invoice status based on payment status
      let invoiceStatus = 'pending';
      if (payment.status === 'succeeded') {
        invoiceStatus = 'paid';
      } else if (payment.status === 'failed') {
        invoiceStatus = 'failed';
      } else if (payment.status === 'refunded') {
        invoiceStatus = 'refunded';
      }

      return this.generateInvoice({
        organizationId: payment.organization_id.toString(),
        subscriptionId: payment.subscription_id?._id?.toString(),
        paymentId: paymentId,
        amount: payment.amount,
        currency: payment.currency,
        status: invoiceStatus,
        lineItems,
        billingPeriod,
        providerData: {
          provider: payment.provider,
          paymentId: payment.providerPaymentId
        }
      });
    } catch (error) {
      console.error('Error in generateInvoiceFromPayment:', error);
      return { isSuccess: false, message: 'Failed to generate invoice from payment', code: 500 };
    }
  }

  /**
   * Get invoice statistics for an organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   */
  async getInvoiceStats(organizationId) {
    try {
      if (!isValidObjectId(organizationId)) {
        return { isSuccess: false, message: 'Invalid organization ID', code: 400 };
      }

      const stats = await Invoice.aggregate([
        { $match: { organization_id: require('mongoose').Types.ObjectId.createFromHexString(organizationId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      const result = {
        total: 0,
        totalAmount: 0,
        byStatus: {}
      };

      stats.forEach(stat => {
        result.byStatus[stat._id] = {
          count: stat.count,
          totalAmount: stat.totalAmount
        };
        result.total += stat.count;
        if (stat._id === 'paid') {
          result.totalAmount += stat.totalAmount;
        }
      });

      return {
        isSuccess: true,
        data: result
      };
    } catch (error) {
      console.error('Error in getInvoiceStats:', error);
      return { isSuccess: false, message: 'Failed to get invoice statistics', code: 500 };
    }
  }

  /**
   * Format currency amount for display
   * @param {number} amount - Amount in cents
   * @param {string} currency - Currency code
   * @returns {string} Formatted amount
   * @private
   */
  _formatCurrency(amount, currency = 'usd') {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    });
    return formatter.format(amount / 100);
  }

  /**
   * Format date for display
   * @param {Date} date - Date to format
   * @returns {string} Formatted date
   * @private
   */
  _formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Generate PDF buffer from invoice data
   * @param {Object} invoiceData - Invoice data with organization info
   * @returns {Promise<Buffer>} PDF buffer
   * @private
   */
  async _generatePdfBuffer(invoiceData) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).text('INVOICE', { align: 'right' });
      doc.moveDown(0.5);
      
      // Invoice details
      doc.fontSize(10)
        .text(`Invoice Number: ${invoiceData.invoiceNumber}`, { align: 'right' })
        .text(`Date: ${this._formatDate(invoiceData.createdAt)}`, { align: 'right' })
        .text(`Due Date: ${this._formatDate(invoiceData.dueDate)}`, { align: 'right' })
        .text(`Status: ${invoiceData.status.toUpperCase()}`, { align: 'right' });

      doc.moveDown(2);

      // Bill To section
      doc.fontSize(12).text('Bill To:', { underline: true });
      doc.fontSize(10);
      if (invoiceData.organization) {
        doc.text(invoiceData.organization.name || 'N/A');
        doc.text(invoiceData.organization.email || 'N/A');
        doc.text(invoiceData.organization.address || 'N/A');
      }

      doc.moveDown(2);

      // Billing Period
      if (invoiceData.billingPeriod) {
        doc.fontSize(10)
          .text(`Billing Period: ${this._formatDate(invoiceData.billingPeriod.start)} - ${this._formatDate(invoiceData.billingPeriod.end)}`);
        doc.moveDown();
      }

      // Line items table header
      const tableTop = doc.y;
      const tableLeft = 50;
      
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Description', tableLeft, tableTop);
      doc.text('Qty', tableLeft + 280, tableTop, { width: 50, align: 'center' });
      doc.text('Unit Price', tableLeft + 330, tableTop, { width: 80, align: 'right' });
      doc.text('Amount', tableLeft + 420, tableTop, { width: 80, align: 'right' });

      // Line under header
      doc.moveTo(tableLeft, tableTop + 15)
        .lineTo(tableLeft + 500, tableTop + 15)
        .stroke();

      // Line items
      doc.font('Helvetica');
      let yPosition = tableTop + 25;

      if (invoiceData.lineItems && invoiceData.lineItems.length > 0) {
        invoiceData.lineItems.forEach(item => {
          doc.text(item.description || 'Item', tableLeft, yPosition, { width: 270 });
          doc.text(String(item.quantity || 1), tableLeft + 280, yPosition, { width: 50, align: 'center' });
          doc.text(this._formatCurrency(item.unitPrice || 0, invoiceData.currency), tableLeft + 330, yPosition, { width: 80, align: 'right' });
          doc.text(this._formatCurrency(item.amount || 0, invoiceData.currency), tableLeft + 420, yPosition, { width: 80, align: 'right' });
          yPosition += 20;
        });
      }

      // Total line
      doc.moveTo(tableLeft + 330, yPosition + 5)
        .lineTo(tableLeft + 500, yPosition + 5)
        .stroke();

      yPosition += 15;
      doc.font('Helvetica-Bold');
      doc.text('Total:', tableLeft + 330, yPosition, { width: 80, align: 'right' });
      doc.text(this._formatCurrency(invoiceData.amount, invoiceData.currency), tableLeft + 420, yPosition, { width: 80, align: 'right' });

      // Payment status
      doc.moveDown(3);
      if (invoiceData.status === 'paid') {
        doc.fontSize(14).fillColor('green')
          .text('PAID', { align: 'center' });
        if (invoiceData.paidAt) {
          doc.fontSize(10).fillColor('black')
            .text(`Paid on: ${this._formatDate(invoiceData.paidAt)}`, { align: 'center' });
        }
      }

      // Footer
      doc.fontSize(8).fillColor('gray');
      doc.text('Thank you for your business!', 50, doc.page.height - 50, { align: 'center' });

      doc.end();
    });
  }

  /**
   * Upload PDF buffer to Cloudinary
   * @param {Buffer} pdfBuffer - PDF buffer
   * @param {string} organizationId - Organization ID for folder
   * @param {string} invoiceNumber - Invoice number for filename
   * @returns {Promise<string>} Cloudinary URL
   * @private
   */
  async _uploadPdfToCloudinary(pdfBuffer, organizationId, invoiceNumber) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `${organizationId}/invoices`,
          public_id: invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_'),
          resource_type: 'raw',
          format: 'pdf'
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result.secure_url);
          }
        }
      );
      uploadStream.end(pdfBuffer);
    });
  }

  /**
   * Generate PDF for an invoice and store URL
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   * @requirements 8.4
   */
  async generateInvoicePdf(invoiceId) {
    try {
      if (!isValidObjectId(invoiceId)) {
        return { isSuccess: false, message: 'Invalid invoice ID', code: 400 };
      }

      // Get invoice with organization details
      const invoice = await Invoice.findById(invoiceId)
        .populate('organization_id', 'name email address city state country')
        .populate({
          path: 'subscription_id',
          populate: { path: 'plan_id', select: 'name displayName' }
        });

      if (!invoice) {
        return { 
          isSuccess: false, 
          message: 'Invoice not found', 
          code: 404 
        };
      }

      // Prepare invoice data for PDF
      const invoiceData = {
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        lineItems: invoice.lineItems,
        billingPeriod: invoice.billingPeriod,
        dueDate: invoice.dueDate,
        paidAt: invoice.paidAt,
        createdAt: invoice.created_at,
        organization: invoice.organization_id ? {
          name: invoice.organization_id.name,
          email: invoice.organization_id.email,
          address: [
            invoice.organization_id.address,
            invoice.organization_id.city,
            invoice.organization_id.state,
            invoice.organization_id.country
          ].filter(Boolean).join(', ')
        } : null
      };

      // Generate PDF buffer
      const pdfBuffer = await this._generatePdfBuffer(invoiceData);

      // Upload to Cloudinary
      const pdfUrl = await this._uploadPdfToCloudinary(
        pdfBuffer,
        invoice.organization_id._id.toString(),
        invoice.invoiceNumber
      );

      // Update invoice with PDF URL
      invoice.invoicePdfUrl = pdfUrl;
      await invoice.save();

      return {
        isSuccess: true,
        data: {
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          invoicePdfUrl: pdfUrl
        }
      };
    } catch (error) {
      console.error('Error in generateInvoicePdf:', error);
      return { 
        isSuccess: false, 
        message: 'Failed to generate invoice PDF', 
        code: 500 
      };
    }
  }

  /**
   * Get or generate PDF for an invoice
   * @param {string} invoiceId - Invoice ID
   * @param {string} [organizationId] - Organization ID for authorization
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   * @requirements 8.4
   */
  async getInvoicePdf(invoiceId, organizationId = null) {
    try {
      if (!isValidObjectId(invoiceId)) {
        return { isSuccess: false, message: 'Invalid invoice ID', code: 400 };
      }

      const query = { _id: invoiceId };
      if (organizationId) {
        if (!isValidObjectId(organizationId)) {
          return { isSuccess: false, message: 'Invalid organization ID', code: 400 };
        }
        query.organization_id = organizationId;
      }

      const invoice = await Invoice.findOne(query);

      if (!invoice) {
        return { 
          isSuccess: false, 
          message: 'Invoice not found', 
          code: 404 
        };
      }

      // If PDF already exists, return it
      if (invoice.invoicePdfUrl) {
        return {
          isSuccess: true,
          data: {
            invoiceId: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            invoicePdfUrl: invoice.invoicePdfUrl
          }
        };
      }

      // Generate PDF if it doesn't exist
      return this.generateInvoicePdf(invoiceId);
    } catch (error) {
      console.error('Error in getInvoicePdf:', error);
      return { isSuccess: false, message: 'Failed to get invoice PDF', code: 500 };
    }
  }

  /**
   * Generate HTML email template for invoice
   * @param {Object} invoiceData - Invoice data
   * @param {string} type - Email type ('new', 'paid', 'reminder')
   * @returns {string} HTML email content
   * @private
   */

   /**
   * Generate HTML email template for invoice
   * @param {Object} invoiceData - Invoice data
   * @param {string} type - Email type ('new', 'paid', 'reminder')
   * @returns {Object} { subject, html }
   * @private
   */
  _generateInvoiceEmailHtml(invoiceData, type = 'new') {
    const { getEmailTemplate } = require('../utils/emailTemplate');
    const { invoiceNumber, amount, currency, status, dueDate, paidAt, organization, lineItems, invoicePdfUrl } = invoiceData;
    
    const formattedAmount = this._formatCurrency(amount, currency);
    const formattedDueDate = this._formatDate(dueDate);
    const formattedPaidAt = paidAt ? this._formatDate(paidAt) : null;

    let subject = '';
    let headerText = '';
    let statusClass = 'alert-info';
    let statusMessage = '';

    switch (type) {
      case 'paid':
        subject = `Payment Received - Invoice ${invoiceNumber}`;
        headerText = 'Thank you for your payment!';
        statusClass = 'alert-info'; // Using info for success/paid as green isn't default
        statusMessage = `Payment of ${formattedAmount} received on ${formattedPaidAt}.`;
        break;
      case 'reminder':
        subject = `Payment Reminder - Invoice ${invoiceNumber}`;
        headerText = 'Payment Reminder';
        statusClass = 'alert-warning';
        statusMessage = `This is a reminder that invoice ${invoiceNumber} is due on ${formattedDueDate}.`;
        break;
      case 'new':
      default:
        subject = `New Invoice - ${invoiceNumber}`;
        headerText = 'New Invoice';
        statusClass = 'alert-info';
        statusMessage = `A new invoice has been generated for your account.`;
        break;
    }

    const lineItemsHtml = lineItems && lineItems.length > 0
      ? lineItems.map(item => `
          <tr>
            <td>${item.description || 'Item'}</td>
            <td style="text-align: center;">${item.quantity || 1}</td>
            <td style="text-align: right;">${this._formatCurrency(item.amount || 0, currency)}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="3" style="text-align: center;">No items</td></tr>';

    const content = `
      <p>Hello ${organization.name || 'Customer'},</p>
      
      <div class="alert ${statusClass}">
        <strong>${headerText}</strong><br>
        ${statusMessage}
      </div>

      <table class="data-table">
        <tr>
          <td><strong>Invoice Number:</strong></td>
          <td style="text-align: right;">${invoiceNumber}</td>
        </tr>
        <tr>
          <td><strong>Status:</strong></td>
          <td style="text-align: right;"><span style="font-weight: bold; text-transform: uppercase;">${status}</span></td>
        </tr>
        <tr>
          <td><strong>Due Date:</strong></td>
          <td style="text-align: right;">${formattedDueDate}</td>
        </tr>
        ${formattedPaidAt ? `
        <tr>
          <td><strong>Paid On:</strong></td>
          <td style="text-align: right;">${formattedPaidAt}</td>
        </tr>
        ` : ''}
      </table>

      <h3>Invoice Details</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemsHtml}
        </tbody>
        <tfoot>
          <tr style="font-weight: bold; background-color: #f9fafb;">
            <td colspan="2" style="text-align: right; padding: 12px;">Total:</td>
            <td style="text-align: right; padding: 12px; font-size: 18px; color: #6366f1;">${formattedAmount}</td>
          </tr>
        </tfoot>
      </table>
    `;

    const html = getEmailTemplate({
      title: headerText,
      content,
      actionUrl: invoicePdfUrl,
      actionText: "Download Invoice PDF",
      footerText: "Thank you for your business!"
    });

    return { subject, html };
  }

  /**
   * Send invoice email notification
   * @param {string} invoiceId - Invoice ID
   * @param {string} [type='new'] - Email type ('new', 'paid', 'reminder')
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   * @requirements 8.5
   */
  async sendInvoiceEmail(invoiceId, type = 'new') {
    try {
      if (!isValidObjectId(invoiceId)) {
        return { isSuccess: false, message: 'Invalid invoice ID', code: 400 };
      }

      // Get invoice with organization details
      const invoice = await Invoice.findById(invoiceId)
        .populate('organization_id', 'name email billingEmail')
        .populate({
          path: 'subscription_id',
          populate: { path: 'plan_id', select: 'name displayName' }
        });

      if (!invoice) {
        return { 
          isSuccess: false, 
          message: 'Invoice not found', 
          code: 404 
        };
      }

      const organization = invoice.organization_id;
      if (!organization) {
        return { 
          isSuccess: false, 
          message: 'Organization not found', 
          code: 404 
        };
      }

      // Determine recipient email (prefer billing email)
      const recipientEmail = organization.billingEmail || organization.email;
      if (!recipientEmail) {
        return { 
          isSuccess: false, 
          message: 'No email address found for organization', 
          code: 400 
        };
      }

      // Ensure PDF is generated
      if (!invoice.invoicePdfUrl) {
        const pdfResult = await this.generateInvoicePdf(invoiceId);
        if (pdfResult.isSuccess) {
          invoice.invoicePdfUrl = pdfResult.data.invoicePdfUrl;
        }
      }

      // Prepare invoice data for email
      const invoiceData = {
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        lineItems: invoice.lineItems,
        dueDate: invoice.dueDate,
        paidAt: invoice.paidAt,
        invoicePdfUrl: invoice.invoicePdfUrl,
        organization: {
          name: organization.name,
          email: organization.email
        }
      };

      // Generate email content
      const { subject, html } = this._generateInvoiceEmailHtml(invoiceData, type);

      // Send email
      const emailSent = await sendEmail(recipientEmail, subject, html);

      if (!emailSent) {
        return { 
          isSuccess: false, 
          message: 'Failed to send invoice email', 
          code: 500 
        };
      }

      return {
        isSuccess: true,
        data: {
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          recipientEmail,
          emailType: type,
          sentAt: new Date()
        }
      };
    } catch (error) {
      console.error('Error in sendInvoiceEmail:', error);
      return { isSuccess: false, message: 'Failed to send invoice email', code: 500 };
    }
  }

  /**
   * Send invoice email on payment/renewal
   * This is a convenience method that generates PDF and sends email
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   * @requirements 8.5
   */
  async sendInvoiceOnPayment(invoiceId) {
    try {
      // First, ensure PDF is generated
      const pdfResult = await this.generateInvoicePdf(invoiceId);
      if (!pdfResult.isSuccess) {
        console.warn('Failed to generate PDF for invoice:', invoiceId);
        // Continue anyway - email can be sent without PDF
      }

      // Get invoice to determine email type
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        return { 
          isSuccess: false, 
          message: 'Invoice not found', 
          code: 404 
        };
      }

      // Determine email type based on invoice status
      const emailType = invoice.status === 'paid' ? 'paid' : 'new';

      // Send email
      return this.sendInvoiceEmail(invoiceId, emailType);
    } catch (error) {
      console.error('Error in sendInvoiceOnPayment:', error);
      return { isSuccess: false, message: 'Failed to send invoice on payment', code: 500 };
    }
  }

  /**
   * Send payment reminder for unpaid invoices
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<{isSuccess: boolean, data?: Object, message?: string, code?: number}>}
   * @requirements 8.5
   */
  async sendPaymentReminder(invoiceId) {
    try {
      const invoice = await Invoice.findById(invoiceId);
      
      if (!invoice) {
        return { 
          isSuccess: false, 
          message: 'Invoice not found', 
          code: 404 
        };
      }

      // Only send reminders for pending invoices
      if (invoice.status !== 'pending') {
        return { 
          isSuccess: false, 
          message: 'Can only send reminders for pending invoices', 
          code: 400 
        };
      }

      return this.sendInvoiceEmail(invoiceId, 'reminder');
    } catch (error) {
      console.error('Error in sendPaymentReminder:', error);
      return { isSuccess: false, message: 'Failed to send payment reminder', code: 500 };
    }
  }
}

// Create singleton instance
const invoiceService = new InvoiceService();

module.exports = {
  invoiceService,
  InvoiceService,
  InvoiceError,
  InvoiceErrorCodes
};
