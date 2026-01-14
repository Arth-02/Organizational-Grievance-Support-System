import { createSlice } from "@reduxjs/toolkit";
import { invoiceApi } from "@/services/invoice.service";

/**
 * Invoice Slice
 * Manages invoice state including invoice list, pagination, and invoice details
 * 
 * @requirements 9.5
 */

const initialState = {
  // List of invoices
  invoices: [],
  // Currently selected invoice for detail view
  selectedInvoice: null,
  // Invoice statistics
  stats: {
    totalInvoices: 0,
    totalPaid: 0,
    totalPending: 0,
    totalAmount: 0,
  },
  // Pagination state
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  // Filters
  filters: {
    status: null,
    startDate: null,
    endDate: null,
  },
  // Loading states
  loading: {
    invoices: false,
    invoice: false,
    download: false,
    stats: false,
    sendEmail: false,
  },
  // Error states
  error: null,
  // Success message
  successMessage: null,
};

const invoiceSlice = createSlice({
  name: "invoice",
  initialState,
  reducers: {
    setInvoices: (state, action) => {
      state.invoices = action.payload;
    },
    setSelectedInvoice: (state, action) => {
      state.selectedInvoice = action.payload;
    },
    clearSelectedInvoice: (state) => {
      state.selectedInvoice = null;
    },
    setStats: (state, action) => {
      state.stats = action.payload;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1; // Reset to first page when limit changes
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset to first page when filters change
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.page = 1;
    },
    setLoading: (state, action) => {
      const { key, value } = action.payload;
      state.loading[key] = value;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setSuccessMessage: (state, action) => {
      state.successMessage = action.payload;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    resetInvoiceState: () => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle getInvoices
      .addMatcher(
        invoiceApi.endpoints.getInvoices.matchFulfilled,
        (state, action) => {
          const data = action.payload.data || action.payload;
          state.invoices = data.invoices || data;
          if (data.pagination) {
            state.pagination = {
              ...state.pagination,
              ...data.pagination,
            };
          }
          state.loading.invoices = false;
        }
      )
      .addMatcher(
        invoiceApi.endpoints.getInvoices.matchPending,
        (state) => {
          state.loading.invoices = true;
        }
      )
      .addMatcher(
        invoiceApi.endpoints.getInvoices.matchRejected,
        (state, action) => {
          state.loading.invoices = false;
          state.error = action.error?.message || "Failed to fetch invoices";
        }
      )
      // Handle getInvoice (single invoice)
      .addMatcher(
        invoiceApi.endpoints.getInvoice.matchFulfilled,
        (state, action) => {
          const data = action.payload.data || action.payload;
          state.selectedInvoice = data;
          state.loading.invoice = false;
        }
      )
      .addMatcher(
        invoiceApi.endpoints.getInvoice.matchPending,
        (state) => {
          state.loading.invoice = true;
        }
      )
      .addMatcher(
        invoiceApi.endpoints.getInvoice.matchRejected,
        (state, action) => {
          state.loading.invoice = false;
          state.error = action.error?.message || "Failed to fetch invoice";
        }
      )
      // Handle getInvoiceByNumber
      .addMatcher(
        invoiceApi.endpoints.getInvoiceByNumber.matchFulfilled,
        (state, action) => {
          const data = action.payload.data || action.payload;
          state.selectedInvoice = data;
          state.loading.invoice = false;
        }
      )
      .addMatcher(
        invoiceApi.endpoints.getInvoiceByNumber.matchPending,
        (state) => {
          state.loading.invoice = true;
        }
      )
      .addMatcher(
        invoiceApi.endpoints.getInvoiceByNumber.matchRejected,
        (state, action) => {
          state.loading.invoice = false;
          state.error = action.error?.message || "Failed to fetch invoice";
        }
      )
      // Handle getInvoiceStats
      .addMatcher(
        invoiceApi.endpoints.getInvoiceStats.matchFulfilled,
        (state, action) => {
          const data = action.payload.data || action.payload;
          state.stats = data;
          state.loading.stats = false;
        }
      )
      .addMatcher(
        invoiceApi.endpoints.getInvoiceStats.matchPending,
        (state) => {
          state.loading.stats = true;
        }
      )
      .addMatcher(
        invoiceApi.endpoints.getInvoiceStats.matchRejected,
        (state, action) => {
          state.loading.stats = false;
          state.error = action.error?.message || "Failed to fetch invoice stats";
        }
      )
      // Handle downloadInvoice
      .addMatcher(
        invoiceApi.endpoints.downloadInvoice.matchFulfilled,
        (state) => {
          state.loading.download = false;
          state.successMessage = "Invoice downloaded successfully";
        }
      )
      .addMatcher(
        invoiceApi.endpoints.downloadInvoice.matchPending,
        (state) => {
          state.loading.download = true;
        }
      )
      .addMatcher(
        invoiceApi.endpoints.downloadInvoice.matchRejected,
        (state, action) => {
          state.loading.download = false;
          state.error = action.error?.message || "Failed to download invoice";
        }
      )
      // Handle sendInvoiceEmail
      .addMatcher(
        invoiceApi.endpoints.sendInvoiceEmail.matchFulfilled,
        (state) => {
          state.loading.sendEmail = false;
          state.successMessage = "Invoice email sent successfully";
        }
      )
      .addMatcher(
        invoiceApi.endpoints.sendInvoiceEmail.matchPending,
        (state) => {
          state.loading.sendEmail = true;
        }
      )
      .addMatcher(
        invoiceApi.endpoints.sendInvoiceEmail.matchRejected,
        (state, action) => {
          state.loading.sendEmail = false;
          state.error = action.error?.message || "Failed to send invoice email";
        }
      );
  },
});

export const {
  setInvoices,
  setSelectedInvoice,
  clearSelectedInvoice,
  setStats,
  setPagination,
  setPage,
  setLimit,
  setFilters,
  clearFilters,
  setLoading,
  setError,
  clearError,
  setSuccessMessage,
  clearSuccessMessage,
  resetInvoiceState,
} = invoiceSlice.actions;

export default invoiceSlice.reducer;

// Selectors
export const selectInvoices = (state) => state.invoice.invoices;
export const selectSelectedInvoice = (state) => state.invoice.selectedInvoice;
export const selectInvoiceStats = (state) => state.invoice.stats;
export const selectInvoicePagination = (state) => state.invoice.pagination;
export const selectInvoiceFilters = (state) => state.invoice.filters;
export const selectInvoiceLoading = (state) => state.invoice.loading;
export const selectInvoiceError = (state) => state.invoice.error;
export const selectInvoiceSuccessMessage = (state) => state.invoice.successMessage;
