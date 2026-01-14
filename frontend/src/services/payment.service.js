import { baseApi } from "./baseApi.service";

/**
 * Payment Service
 * Handles all payment-related API endpoints
 * 
 * @requirements 9.6, 9.8
 */
export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // POST /payments/intent - Create a payment intent for subscription payment
    createPaymentIntent: builder.mutation({
      query: (body) => ({
        url: "payments/intent",
        method: "POST",
        body,
      }),
    }),

    // GET /payments/methods - List all payment methods for the organization
    getPaymentMethods: builder.query({
      query: () => ({
        url: "payments/methods",
        method: "GET",
      }),
      providesTags: ["PaymentMethods"],
    }),

    // POST /payments/methods - Add a new payment method
    addPaymentMethod: builder.mutation({
      query: (body) => ({
        url: "payments/methods",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PaymentMethods"],
    }),

    // DELETE /payments/methods/:id - Remove a payment method
    removePaymentMethod: builder.mutation({
      query: (id) => ({
        url: `payments/methods/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PaymentMethods"],
    }),

    // PUT /payments/methods/:id/default - Set a payment method as default
    setDefaultPaymentMethod: builder.mutation({
      query: (id) => ({
        url: `payments/methods/${id}/default`,
        method: "PUT",
      }),
      invalidatesTags: ["PaymentMethods"],
    }),

    // GET /payments/providers - Get available payment providers
    getAvailableProviders: builder.query({
      query: () => ({
        url: "payments/providers",
        method: "GET",
      }),
    }),

    // POST /payments/:id/refund - Process a refund
    processRefund: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `payments/${id}/refund`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Invoices"],
    }),
  }),
});

export const {
  // Payment mutations
  useCreatePaymentIntentMutation,
  useAddPaymentMethodMutation,
  useRemovePaymentMethodMutation,
  useSetDefaultPaymentMethodMutation,
  useProcessRefundMutation,
  
  // Payment queries
  useGetPaymentMethodsQuery,
  useGetAvailableProvidersQuery,
} = paymentApi;
