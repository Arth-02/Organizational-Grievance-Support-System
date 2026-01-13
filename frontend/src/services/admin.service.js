import { baseApi } from "./baseApi.service";

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Dashboard endpoints
    getDashboardStats: builder.query({
      query: () => ({
        url: "super-admin/dashboard/stats",
        method: "GET",
      }),
      providesTags: ["AdminStats"],
    }),
    getRecentActivity: builder.query({
      query: (limit = 10) => ({
        url: `super-admin/dashboard/recent-activity?limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["AdminActivity"],
    }),
    getGrowthTrends: builder.query({
      query: () => ({
        url: "super-admin/dashboard/trends",
        method: "GET",
      }),
      providesTags: ["AdminTrends"],
    }),

    // Organizations management
    getAdminOrganizations: builder.query({
      query: (filters = {}) => {
        const cleanedFilters = Object.entries(filters).reduce(
          (acc, [key, value]) => {
            if (value !== "" && value !== null && value !== undefined && value !== "all") {
              acc[key] = value;
            }
            return acc;
          },
          {}
        );
        const params = new URLSearchParams(cleanedFilters).toString();
        return {
          url: `super-admin/organizations?${params}`,
          method: "GET",
        };
      },
      providesTags: ["AdminOrganizations"],
    }),
    getAdminOrganizationById: builder.query({
      query: (id) => ({
        url: `super-admin/organizations/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "AdminOrganization", id }],
    }),
    getOrganizationUsers: builder.query({
      query: ({ id, ...filters }) => {
        const cleanedFilters = Object.entries(filters).reduce(
          (acc, [key, value]) => {
            if (value !== "" && value !== null && value !== undefined && value !== "all") {
              acc[key] = value;
            }
            return acc;
          },
          {}
        );
        const params = new URLSearchParams(cleanedFilters).toString();
        return {
          url: `super-admin/organizations/${id}/users?${params}`,
          method: "GET",
        };
      },
      providesTags: (result, error, { id }) => [{ type: "AdminOrgUsers", id }],
    }),

    // Organization actions
    approveOrganization: builder.mutation({
      query: (id) => ({
        url: `super-admin/organizations/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: ["AdminOrganizations", "AdminStats", "AdminActivity"],
    }),
    rejectOrganization: builder.mutation({
      query: ({ id, reason }) => ({
        url: `super-admin/organizations/${id}/reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["AdminOrganizations", "AdminStats", "AdminActivity"],
    }),
    updateOrganizationStatus: builder.mutation({
      query: ({ id, is_active }) => ({
        url: `super-admin/organizations/${id}/status`,
        method: "PATCH",
        body: { is_active },
      }),
      invalidatesTags: (result, error, { id }) => [
        "AdminOrganizations",
        "AdminStats",
        { type: "AdminOrganization", id },
      ],
    }),
    deleteOrganization: builder.mutation({
      query: (id) => ({
        url: `super-admin/organizations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminOrganizations", "AdminStats", "AdminActivity"],
    }),

    // ==================== USER MANAGEMENT ====================
    
    getAdminUsers: builder.query({
      query: (filters = {}) => {
        const cleanedFilters = Object.entries(filters).reduce(
          (acc, [key, value]) => {
            if (value !== "" && value !== null && value !== undefined && value !== "all") {
              acc[key] = value;
            }
            return acc;
          },
          {}
        );
        const params = new URLSearchParams(cleanedFilters).toString();
        return {
          url: `super-admin/users?${params}`,
          method: "GET",
        };
      },
      providesTags: ["AdminUsers"],
    }),
    getAdminUserById: builder.query({
      query: (id) => ({
        url: `super-admin/users/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "AdminUser", id }],
    }),
    updateAdminUserStatus: builder.mutation({
      query: ({ id, is_active }) => ({
        url: `super-admin/users/${id}/status`,
        method: "PATCH",
        body: { is_active },
      }),
      invalidatesTags: (result, error, { id }) => [
        "AdminUsers",
        "AdminStats",
        { type: "AdminUser", id },
      ],
    }),
    deleteAdminUser: builder.mutation({
      query: (id) => ({
        url: `super-admin/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminUsers", "AdminStats"],
    }),
    getOrganizationNames: builder.query({
      query: () => ({
        url: "super-admin/organizations/names",
        method: "GET",
      }),
      providesTags: ["OrgNames"],
    }),

    // ==================== ROLE MANAGEMENT ====================

    getAdminRoles: builder.query({
      query: (filters = {}) => {
        const cleanedFilters = Object.entries(filters).reduce(
          (acc, [key, value]) => {
            if (value !== "" && value !== null && value !== undefined && value !== "all") {
              acc[key] = value;
            }
            return acc;
          },
          {}
        );
        const params = new URLSearchParams(cleanedFilters).toString();
        return {
          url: `super-admin/roles?${params}`,
          method: "GET",
        };
      },
      providesTags: ["AdminRoles"],
    }),
    getAdminRoleById: builder.query({
      query: (id) => ({
        url: `super-admin/roles/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "AdminRole", id }],
    }),
    updateAdminRoleStatus: builder.mutation({
      query: ({ id, is_active }) => ({
        url: `super-admin/roles/${id}/status`,
        method: "PATCH",
        body: { is_active },
      }),
      invalidatesTags: (result, error, { id }) => [
        "AdminRoles",
        "AdminStats",
        { type: "AdminRole", id },
      ],
    }),
    deleteAdminRole: builder.mutation({
      query: (id) => ({
        url: `super-admin/roles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminRoles", "AdminStats"],
    }),

    // ==================== GRIEVANCE MANAGEMENT ====================

    getAdminGrievances: builder.query({
      query: (filters = {}) => {
        const cleanedFilters = Object.entries(filters).reduce(
          (acc, [key, value]) => {
            if (value !== "" && value !== null && value !== undefined && value !== "all") {
              acc[key] = value;
            }
            return acc;
          },
          {}
        );
        const params = new URLSearchParams(cleanedFilters).toString();
        return {
          url: `super-admin/grievances?${params}`,
          method: "GET",
        };
      },
      providesTags: ["AdminGrievances"],
    }),
    getAdminGrievanceById: builder.query({
      query: (id) => ({
        url: `super-admin/grievances/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "AdminGrievance", id }],
    }),
    updateAdminGrievanceStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `super-admin/grievances/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        "AdminGrievances",
        "AdminStats",
        { type: "AdminGrievance", id },
      ],
    }),
    deleteAdminGrievance: builder.mutation({
      query: (id) => ({
        url: `super-admin/grievances/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminGrievances", "AdminStats"],
    }),

    // ==================== AUDIT LOG MANAGEMENT ====================

    getAuditLogs: builder.query({
      query: (filters = {}) => {
        const cleanedFilters = Object.entries(filters).reduce(
          (acc, [key, value]) => {
            if (value !== "" && value !== null && value !== undefined && value !== "all") {
              acc[key] = value;
            }
            return acc;
          },
          {}
        );
        const params = new URLSearchParams(cleanedFilters).toString();
        return {
          url: `super-admin/audit-logs?${params}`,
          method: "GET",
        };
      },
      providesTags: ["AuditLogs"],
    }),
    getAuditLogStats: builder.query({
      query: () => ({
        url: "super-admin/audit-logs/stats",
        method: "GET",
      }),
      providesTags: ["AuditLogStats"],
    }),
    getAuditLogActionTypes: builder.query({
      query: () => ({
        url: "super-admin/audit-logs/action-types",
        method: "GET",
      }),
      providesTags: ["AuditLogActionTypes"],
    }),
    getAuditLogById: builder.query({
      query: (id) => ({
        url: `super-admin/audit-logs/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "AuditLog", id }],
    }),
    clearOldAuditLogs: builder.mutation({
      query: ({ daysToKeep }) => ({
        url: "super-admin/audit-logs/clear",
        method: "DELETE",
        body: { daysToKeep },
      }),
      invalidatesTags: ["AuditLogs", "AuditLogStats"],
    }),

    // ==================== PROJECT MANAGEMENT ====================

    getAdminProjects: builder.query({
      query: (filters = {}) => {
        const cleanedFilters = Object.entries(filters).reduce(
          (acc, [key, value]) => {
            if (value !== "" && value !== null && value !== undefined && value !== "all") {
              acc[key] = value;
            }
            return acc;
          },
          {}
        );
        const params = new URLSearchParams(cleanedFilters).toString();
        return {
          url: `super-admin/projects?${params}`,
          method: "GET",
        };
      },
      providesTags: ["AdminProjects"],
    }),
    getAdminProjectById: builder.query({
      query: (id) => ({
        url: `super-admin/projects/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "AdminProject", id }],
    }),
    updateAdminProjectStatus: builder.mutation({
      query: ({ id, is_active }) => ({
        url: `super-admin/projects/${id}/status`,
        method: "PATCH",
        body: { is_active },
      }),
      invalidatesTags: (result, error, { id }) => [
        "AdminProjects",
        "AdminStats",
        { type: "AdminProject", id },
      ],
    }),
    deleteAdminProject: builder.mutation({
      query: (id) => ({
        url: `super-admin/projects/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminProjects", "AdminStats"],
    }),
  }),
});

export const {
  // Dashboard
  useGetDashboardStatsQuery,
  useGetRecentActivityQuery,
  useGetGrowthTrendsQuery,
  // Organizations
  useGetAdminOrganizationsQuery,
  useGetAdminOrganizationByIdQuery,
  useGetOrganizationUsersQuery,
  useApproveOrganizationMutation,
  useRejectOrganizationMutation,
  useUpdateOrganizationStatusMutation,
  useDeleteOrganizationMutation,
  // Users
  useGetAdminUsersQuery,
  useGetAdminUserByIdQuery,
  useUpdateAdminUserStatusMutation,
  useDeleteAdminUserMutation,
  useGetOrganizationNamesQuery,
  // Roles
  useGetAdminRolesQuery,
  useGetAdminRoleByIdQuery,
  useUpdateAdminRoleStatusMutation,
  useDeleteAdminRoleMutation,
  // Grievances
  useGetAdminGrievancesQuery,
  useGetAdminGrievanceByIdQuery,
  useUpdateAdminGrievanceStatusMutation,
  useDeleteAdminGrievanceMutation,
  // Projects
  useGetAdminProjectsQuery,
  useGetAdminProjectByIdQuery,
  useUpdateAdminProjectStatusMutation,
  useDeleteAdminProjectMutation,
  // Audit Logs
  useGetAuditLogsQuery,
  useGetAuditLogStatsQuery,
  useGetAuditLogActionTypesQuery,
  useGetAuditLogByIdQuery,
  useClearOldAuditLogsMutation,
} = adminApi;
