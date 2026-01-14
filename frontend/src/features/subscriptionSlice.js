import { createSlice } from "@reduxjs/toolkit";
import { subscriptionApi } from "@/services/subscription.service";

/**
 * Subscription Slice
 * Manages subscription state including current plan, subscription details, usage, and available plans
 * 
 * @requirements 9.1, 9.2
 */

const initialState = {
  // Current subscription details
  subscription: null,
  // Current plan details
  currentPlan: null,
  // Usage statistics
  usage: {
    userCount: 0,
    projectCount: 0,
    storageBytes: 0,
  },
  // Usage percentages relative to plan limits
  usagePercentages: {
    users: 0,
    projects: 0,
    storage: 0,
  },
  // Available subscription plans
  plans: [],
  // Loading states
  loading: {
    subscription: false,
    plans: false,
    usage: false,
    upgrade: false,
    downgrade: false,
    cancel: false,
  },
  // Error states
  error: null,
};

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    setSubscription: (state, action) => {
      state.subscription = action.payload;
      if (action.payload?.plan) {
        state.currentPlan = action.payload.plan;
      }
    },
    setCurrentPlan: (state, action) => {
      state.currentPlan = action.payload;
    },
    setUsage: (state, action) => {
      state.usage = action.payload;
    },
    setUsagePercentages: (state, action) => {
      state.usagePercentages = action.payload;
    },
    setPlans: (state, action) => {
      state.plans = action.payload;
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
    resetSubscriptionState: () => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle getPlans fulfilled
      .addMatcher(
        subscriptionApi.endpoints.getPlans.matchFulfilled,
        (state, action) => {
          state.plans = action.payload.data || action.payload;
          state.loading.plans = false;
        }
      )
      .addMatcher(
        subscriptionApi.endpoints.getPlans.matchPending,
        (state) => {
          state.loading.plans = true;
        }
      )
      .addMatcher(
        subscriptionApi.endpoints.getPlans.matchRejected,
        (state, action) => {
          state.loading.plans = false;
          state.error = action.error?.message || "Failed to fetch plans";
        }
      )
      // Handle getCurrentSubscription fulfilled
      .addMatcher(
        subscriptionApi.endpoints.getCurrentSubscription.matchFulfilled,
        (state, action) => {
          const data = action.payload.data || action.payload;
          state.subscription = data.subscription || data;
          state.currentPlan = data.plan || data.subscription?.plan_id;
          if (data.usage) {
            state.usage = data.usage;
          }
          state.loading.subscription = false;
        }
      )
      .addMatcher(
        subscriptionApi.endpoints.getCurrentSubscription.matchPending,
        (state) => {
          state.loading.subscription = true;
        }
      )
      .addMatcher(
        subscriptionApi.endpoints.getCurrentSubscription.matchRejected,
        (state, action) => {
          state.loading.subscription = false;
          state.error = action.error?.message || "Failed to fetch subscription";
        }
      )
      // Handle getUsage fulfilled
      .addMatcher(
        subscriptionApi.endpoints.getUsage.matchFulfilled,
        (state, action) => {
          const data = action.payload.data || action.payload;
          state.usage = data;
          state.loading.usage = false;
        }
      )
      .addMatcher(
        subscriptionApi.endpoints.getUsage.matchPending,
        (state) => {
          state.loading.usage = true;
        }
      )
      .addMatcher(
        subscriptionApi.endpoints.getUsage.matchRejected,
        (state, action) => {
          state.loading.usage = false;
          state.error = action.error?.message || "Failed to fetch usage";
        }
      )
      // Handle getUsagePercentages fulfilled
      .addMatcher(
        subscriptionApi.endpoints.getUsagePercentages.matchFulfilled,
        (state, action) => {
          const data = action.payload.data || action.payload;
          state.usagePercentages = data;
          state.loading.usage = false;
        }
      )
      // Handle upgradeSubscription
      .addMatcher(
        subscriptionApi.endpoints.upgradeSubscription.matchFulfilled,
        (state, action) => {
          const data = action.payload.data || action.payload;
          state.subscription = data.subscription || data;
          state.currentPlan = data.plan || data.subscription?.plan_id;
          state.loading.upgrade = false;
        }
      )
      .addMatcher(
        subscriptionApi.endpoints.upgradeSubscription.matchPending,
        (state) => {
          state.loading.upgrade = true;
        }
      )
      .addMatcher(
        subscriptionApi.endpoints.upgradeSubscription.matchRejected,
        (state, action) => {
          state.loading.upgrade = false;
          state.error = action.error?.message || "Failed to upgrade subscription";
        }
      )
      // Handle downgradeSubscription
      .addMatcher(
        subscriptionApi.endpoints.downgradeSubscription.matchFulfilled,
        (state, action) => {
          const data = action.payload.data || action.payload;
          state.subscription = data.subscription || data;
          state.loading.downgrade = false;
        }
      )
      .addMatcher(
        subscriptionApi.endpoints.downgradeSubscription.matchPending,
        (state) => {
          state.loading.downgrade = true;
        }
      )
      .addMatcher(
        subscriptionApi.endpoints.downgradeSubscription.matchRejected,
        (state, action) => {
          state.loading.downgrade = false;
          state.error = action.error?.message || "Failed to downgrade subscription";
        }
      )
      // Handle cancelSubscription
      .addMatcher(
        subscriptionApi.endpoints.cancelSubscription.matchFulfilled,
        (state, action) => {
          const data = action.payload.data || action.payload;
          state.subscription = data.subscription || data;
          state.loading.cancel = false;
        }
      )
      .addMatcher(
        subscriptionApi.endpoints.cancelSubscription.matchPending,
        (state) => {
          state.loading.cancel = true;
        }
      )
      .addMatcher(
        subscriptionApi.endpoints.cancelSubscription.matchRejected,
        (state, action) => {
          state.loading.cancel = false;
          state.error = action.error?.message || "Failed to cancel subscription";
        }
      );
  },
});

export const {
  setSubscription,
  setCurrentPlan,
  setUsage,
  setUsagePercentages,
  setPlans,
  setLoading,
  setError,
  clearError,
  resetSubscriptionState,
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;

// Selectors
export const selectSubscription = (state) => state.subscription.subscription;
export const selectCurrentPlan = (state) => state.subscription.currentPlan;
export const selectUsage = (state) => state.subscription.usage;
export const selectUsagePercentages = (state) => state.subscription.usagePercentages;
export const selectPlans = (state) => state.subscription.plans;
export const selectSubscriptionLoading = (state) => state.subscription.loading;
export const selectSubscriptionError = (state) => state.subscription.error;
