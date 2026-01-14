import { baseApi } from "./baseApi.service";

/**
 * Subscription Service
 * Handles all subscription-related API endpoints
 * 
 * @requirements 9.1, 9.2, 9.3, 9.4
 */
export const subscriptionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /subscriptions/plans - List all available subscription plans
    getPlans: builder.query({
      query: () => ({
        url: "subscriptions/plans",
        method: "GET",
      }),
      providesTags: ["SubscriptionPlans"],
    }),

    // GET /subscriptions/current - Get current subscription for the organization
    getCurrentSubscription: builder.query({
      query: () => ({
        url: "subscriptions/current",
        method: "GET",
      }),
      providesTags: ["Subscription"],
    }),

    // POST /subscriptions - Create a new subscription
    createSubscription: builder.mutation({
      query: (body) => ({
        url: "subscriptions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Subscription", "Usage"],
    }),

    // PUT /subscriptions/upgrade - Upgrade to a higher tier plan
    upgradeSubscription: builder.mutation({
      query: (body) => ({
        url: "subscriptions/upgrade",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Subscription", "Usage"],
    }),

    // PUT /subscriptions/downgrade - Downgrade to a lower tier plan
    downgradeSubscription: builder.mutation({
      query: (body) => ({
        url: "subscriptions/downgrade",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Subscription"],
    }),

    // POST /subscriptions/cancel - Cancel subscription
    cancelSubscription: builder.mutation({
      query: (body) => ({
        url: "subscriptions/cancel",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Subscription"],
    }),

    // POST /subscriptions/trial - Start a trial for Professional plan
    startTrial: builder.mutation({
      query: () => ({
        url: "subscriptions/trial",
        method: "POST",
      }),
      invalidatesTags: ["Subscription"],
    }),

    // GET /subscriptions/features/:featureName - Check feature access
    checkFeatureAccess: builder.query({
      query: (featureName) => ({
        url: `subscriptions/features/${featureName}`,
        method: "GET",
      }),
    }),

    // GET /usage - Get current usage statistics
    getUsage: builder.query({
      query: () => ({
        url: "usage",
        method: "GET",
      }),
      providesTags: ["Usage"],
    }),

    // GET /usage/percentages - Get usage percentages with plan limits
    getUsagePercentages: builder.query({
      query: () => ({
        url: "usage/percentages",
        method: "GET",
      }),
      providesTags: ["Usage"],
    }),

    // GET /usage/limits - Check if organization is within plan limits
    checkUsageLimits: builder.query({
      query: () => ({
        url: "usage/limits",
        method: "GET",
      }),
      providesTags: ["Usage"],
    }),

    // GET /usage/report - Get detailed usage report
    getUsageReport: builder.query({
      query: () => ({
        url: "usage/report",
        method: "GET",
      }),
      providesTags: ["Usage"],
    }),

    // GET /usage/can-add - Check if a resource can be added
    canAddResource: builder.query({
      query: (resourceType) => ({
        url: `usage/can-add?resourceType=${resourceType}`,
        method: "GET",
      }),
    }),

    // GET /usage/notifications - Get unacknowledged usage notifications
    getUsageNotifications: builder.query({
      query: () => ({
        url: "usage/notifications",
        method: "GET",
      }),
      providesTags: ["UsageNotifications"],
    }),

    // POST /usage/notifications/:id/acknowledge - Acknowledge a usage notification
    acknowledgeNotification: builder.mutation({
      query: (id) => ({
        url: `usage/notifications/${id}/acknowledge`,
        method: "POST",
      }),
      invalidatesTags: ["UsageNotifications"],
    }),
  }),
});

export const {
  // Subscription queries
  useGetPlansQuery,
  useGetCurrentSubscriptionQuery,
  useCheckFeatureAccessQuery,
  
  // Subscription mutations
  useCreateSubscriptionMutation,
  useUpgradeSubscriptionMutation,
  useDowngradeSubscriptionMutation,
  useCancelSubscriptionMutation,
  useStartTrialMutation,
  
  // Usage queries
  useGetUsageQuery,
  useGetUsagePercentagesQuery,
  useCheckUsageLimitsQuery,
  useGetUsageReportQuery,
  useCanAddResourceQuery,
  useGetUsageNotificationsQuery,
  
  // Usage mutations
  useAcknowledgeNotificationMutation,
} = subscriptionApi;
