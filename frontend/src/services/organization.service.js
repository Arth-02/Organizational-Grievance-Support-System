// organizationApi.js
import { baseApi } from './baseApi';

export const organizationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createOrganization: builder.mutation({
      query: (body) => ({
        url: "organizations/create",
        method: "POST",
        body,
      }),
    }),
    organizationVerify: builder.mutation({
      query: (body) => ({
        url: "super-admin/verify-organization",
        method: "POST",
        body,
      }),
    }),
    getOrganizationById: builder.query({
      query: (id) => ({
        url: `organizations/details/${id}`,
        method: "GET",
      }),
    }),
    createSuperAdmin: builder.mutation({
      query: (body) => ({
        url: "users/create-super-admin",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useCreateOrganizationMutation,
  useOrganizationVerifyMutation,
  useGetOrganizationByIdQuery,
  useCreateSuperAdminMutation,
} = organizationApi;
