import { baseApi } from './baseApi.service';

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
      providesTags: ["Organization"]
    }),
    createSuperAdmin: builder.mutation({
      query: (body) => ({
        url: "users/create-super-admin",
        method: "POST",
        body,
      }),
    }),
    updateOrganization: builder.mutation({
      query: (body) => ({
        url: "organizations/update",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Organization", "MyProfile"],
    }),
    deleteOrganization: builder.mutation({
      query: () => ({
        url: "organizations/delete",
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useCreateOrganizationMutation,
  useOrganizationVerifyMutation,
  useGetOrganizationByIdQuery,
  useCreateSuperAdminMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
} = organizationApi;

