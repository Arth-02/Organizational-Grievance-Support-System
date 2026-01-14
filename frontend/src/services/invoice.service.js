import { baseApi } from "./baseApi.service";

/**
 * Invoice Service
 * Handles all invoice-related API endpoints
 * 
 * @requirements 9.5
 */
export const invoiceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /invoices - List all invoices for the organization with pagination
    getInvoices: builder.query({
      query: (params = {}) => {
        const cleanedParams = Object.entries(params).reduce(
          (acc, [key, value]) => {
            if (value !== "" && value !== null && value !== undefined) {
              acc[key] = value;
            }
            return acc;
          },
          {}
        );
        const queryString = new URLSearchParams(cleanedParams).toString();
        return {
          url: `invoices${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Invoices"],
    }),

    // GET /invoices/stats - Get invoice statistics for the organization
    getInvoiceStats: builder.query({
      query: () => ({
        url: "invoices/stats",
        method: "GET",
      }),
      providesTags: ["Invoices"],
    }),

    // GET /invoices/number/:invoiceNumber - Get invoice by invoice number
    getInvoiceByNumber: builder.query({
      query: (invoiceNumber) => ({
        url: `invoices/number/${invoiceNumber}`,
        method: "GET",
      }),
      providesTags: (result, error, invoiceNumber) => [
        { type: "Invoice", id: invoiceNumber },
      ],
    }),

    // GET /invoices/:id - Get a single invoice by ID
    getInvoice: builder.query({
      query: (id) => ({
        url: `invoices/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Invoice", id }],
    }),

    // GET /invoices/:id/download - Download invoice as PDF
    downloadInvoice: builder.query({
      query: (id) => ({
        url: `invoices/${id}/download`,
        method: "GET",
        responseHandler: async (response) => {
          // Handle blob response for PDF download
          const blob = await response.blob();
          return URL.createObjectURL(blob);
        },
      }),
    }),

    // POST /invoices/:id/send - Send invoice email
    sendInvoiceEmail: builder.mutation({
      query: (id) => ({
        url: `invoices/${id}/send`,
        method: "POST",
      }),
    }),
  }),
});

export const {
  // Invoice queries
  useGetInvoicesQuery,
  useGetInvoiceStatsQuery,
  useGetInvoiceByNumberQuery,
  useGetInvoiceQuery,
  useLazyDownloadInvoiceQuery,
  
  // Invoice mutations
  useSendInvoiceEmailMutation,
} = invoiceApi;
