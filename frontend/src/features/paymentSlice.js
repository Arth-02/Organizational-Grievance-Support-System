import { createSlice } from "@reduxjs/toolkit";
import { paymentApi } from "@/services/payment.service";

/**
 * Payment Slice
 * Manages payment state including payment methods, payment intents, and available providers
 * 
 * @requirements 9.6
 */

const initialState = {
  // Saved payment methods for the organization
  paymentMethods: [],
  // Default payment method ID
  defaultPaymentMethodId: null,
  // Current payment intent (for processing payments)
  paymentIntent: null,
  // Available payment providers
  availableProviders: [],
  // Loading states
  loading: {
    paymentMethods: false,
    paymentIntent: false,
    addPaymentMethod: false,
    removePaymentMethod: false,
    setDefault: false,
    providers: false,
    refund: false,
  },
  // Error states
  error: null,
  // Success message for operations
  successMessage: null,
};

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    setPaymentMethods: (state, action) => {
      state.paymentMethods = action.payload;
      // Find and set default payment method
      const defaultMethod = action.payload.find((pm) => pm.isDefault);
      state.defaultPaymentMethodId = defaultMethod?._id || null;
    },
    setPaymentIntent: (state, action) => {
      state.paymentIntent = action.payload;
    },
    clearPaymentIntent: (state) => {
      state.paymentIntent = null;
    },
    setAvailableProviders: (state, action) => {
      state.availableProviders = action.payload;
    },
    addPaymentMethodToList: (state, action) => {
      state.paymentMethods.push(action.payload);
    },
    removePaymentMethodFromList: (state, action) => {
      state.paymentMethods = state.paymentMethods.filter(
        (pm) => pm._id !== action.payload
      );
    },
    updatePaymentMethodInList: (state, action) => {
      const index = state.paymentMethods.findIndex(
        (pm) => pm._id === action.payload._id
      );
      if (index !== -1) {
        state.paymentMethods[index] = action.payload;
      }
    },
    setDefaultPaymentMethodId: (state, action) => {
      // Update the default flag on all payment methods
      state.paymentMethods = state.paymentMethods.map((pm) => ({
        ...pm,
        isDefault: pm._id === action.payload,
      }));
      state.defaultPaymentMethodId = action.payload;
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
    resetPaymentState: () => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle getPaymentMethods
      .addMatcher(
        paymentApi.endpoints.getPaymentMethods.matchFulfilled,
        (state, action) => {
          const data = action.payload.data || action.payload;
          state.paymentMethods = Array.isArray(data) ? data : data.paymentMethods || [];
          const defaultMethod = state.paymentMethods.find((pm) => pm.isDefault);
          state.defaultPaymentMethodId = defaultMethod?._id || null;
          state.loading.paymentMethods = false;
        }
      )
      .addMatcher(
        paymentApi.endpoints.getPaymentMethods.matchPending,
        (state) => {
          state.loading.paymentMethods = true;
        }
      )
      .addMatcher(
        paymentApi.endpoints.getPaymentMethods.matchRejected,
        (state, action) => {
          state.loading.paymentMethods = false;
          state.error = action.error?.message || "Failed to fetch payment methods";
        }
      )
      // Handle createPaymentIntent
      .addMatcher(
        paymentApi.endpoints.createPaymentIntent.matchFulfilled,
        (state, action) => {
          const data = action.payload.data || action.payload;
          state.paymentIntent = data;
          state.loading.paymentIntent = false;
        }
      )
      .addMatcher(
        paymentApi.endpoints.createPaymentIntent.matchPending,
        (state) => {
          state.loading.paymentIntent = true;
        }
      )
      .addMatcher(
        paymentApi.endpoints.createPaymentIntent.matchRejected,
        (state, action) => {
          state.loading.paymentIntent = false;
          state.error = action.error?.message || "Failed to create payment intent";
        }
      )
      // Handle addPaymentMethod
      .addMatcher(
        paymentApi.endpoints.addPaymentMethod.matchFulfilled,
        (state, action) => {
          const data = action.payload.data || action.payload;
          state.paymentMethods.push(data);
          state.loading.addPaymentMethod = false;
          state.successMessage = "Payment method added successfully";
        }
      )
      .addMatcher(
        paymentApi.endpoints.addPaymentMethod.matchPending,
        (state) => {
          state.loading.addPaymentMethod = true;
        }
      )
      .addMatcher(
        paymentApi.endpoints.addPaymentMethod.matchRejected,
        (state, action) => {
          state.loading.addPaymentMethod = false;
          state.error = action.error?.message || "Failed to add payment method";
        }
      )
      // Handle removePaymentMethod
      .addMatcher(
        paymentApi.endpoints.removePaymentMethod.matchFulfilled,
        (state, action) => {
          const removedId = action.meta?.arg?.originalArgs;
          state.paymentMethods = state.paymentMethods.filter(
            (pm) => pm._id !== removedId
          );
          state.loading.removePaymentMethod = false;
          state.successMessage = "Payment method removed successfully";
        }
      )
      .addMatcher(
        paymentApi.endpoints.removePaymentMethod.matchPending,
        (state) => {
          state.loading.removePaymentMethod = true;
        }
      )
      .addMatcher(
        paymentApi.endpoints.removePaymentMethod.matchRejected,
        (state, action) => {
          state.loading.removePaymentMethod = false;
          state.error = action.error?.message || "Failed to remove payment method";
        }
      )
      // Handle setDefaultPaymentMethod
      .addMatcher(
        paymentApi.endpoints.setDefaultPaymentMethod.matchFulfilled,
        (state, action) => {
          const newDefaultId = action.meta?.arg?.originalArgs;
          state.paymentMethods = state.paymentMethods.map((pm) => ({
            ...pm,
            isDefault: pm._id === newDefaultId,
          }));
          state.defaultPaymentMethodId = newDefaultId;
          state.loading.setDefault = false;
          state.successMessage = "Default payment method updated";
        }
      )
      .addMatcher(
        paymentApi.endpoints.setDefaultPaymentMethod.matchPending,
        (state) => {
          state.loading.setDefault = true;
        }
      )
      .addMatcher(
        paymentApi.endpoints.setDefaultPaymentMethod.matchRejected,
        (state, action) => {
          state.loading.setDefault = false;
          state.error = action.error?.message || "Failed to set default payment method";
        }
      )
      // Handle getAvailableProviders
      .addMatcher(
        paymentApi.endpoints.getAvailableProviders.matchFulfilled,
        (state, action) => {
          const data = action.payload.data || action.payload;
          state.availableProviders = Array.isArray(data) ? data : data.providers || [];
          state.loading.providers = false;
        }
      )
      .addMatcher(
        paymentApi.endpoints.getAvailableProviders.matchPending,
        (state) => {
          state.loading.providers = true;
        }
      )
      .addMatcher(
        paymentApi.endpoints.getAvailableProviders.matchRejected,
        (state, action) => {
          state.loading.providers = false;
          state.error = action.error?.message || "Failed to fetch providers";
        }
      );
  },
});

export const {
  setPaymentMethods,
  setPaymentIntent,
  clearPaymentIntent,
  setAvailableProviders,
  addPaymentMethodToList,
  removePaymentMethodFromList,
  updatePaymentMethodInList,
  setDefaultPaymentMethodId,
  setLoading,
  setError,
  clearError,
  setSuccessMessage,
  clearSuccessMessage,
  resetPaymentState,
} = paymentSlice.actions;

export default paymentSlice.reducer;

// Selectors
export const selectPaymentMethods = (state) => state.payment.paymentMethods;
export const selectDefaultPaymentMethodId = (state) => state.payment.defaultPaymentMethodId;
export const selectDefaultPaymentMethod = (state) => 
  state.payment.paymentMethods.find((pm) => pm._id === state.payment.defaultPaymentMethodId);
export const selectPaymentIntent = (state) => state.payment.paymentIntent;
export const selectAvailableProviders = (state) => state.payment.availableProviders;
export const selectPaymentLoading = (state) => state.payment.loading;
export const selectPaymentError = (state) => state.payment.error;
export const selectPaymentSuccessMessage = (state) => state.payment.successMessage;
