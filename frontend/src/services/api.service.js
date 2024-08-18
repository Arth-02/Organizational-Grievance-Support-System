import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseUrl = import.meta.env.VITE_BASE_URL;

export const apiService = createApi({
  reducerPath: "apiService",
  baseQuery: fetchBaseQuery({ baseUrl: baseUrl}),
  endpoints: (builder) => ({
    userLogin: builder.mutation({
      query: (body) => ({
        url: "users/login",
        method: "POST",
        body,
      }),
      transformErrorResponse: (response) => {
        return response;
      },
      transformResponse: (response) => {
        return response.data;
      },
    }),
    getProfile: builder.query({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: "users/profile",
        method: "GET",
      }),
      transformErrorResponse: (response) => {
        return response;
      },
      transformResponse: (response) => {
        return response.data;
      },
    }),
    getUserDetails: builder.query({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: `users/details/${body.userId}`,
        method: "GET",
      }),
      transformErrorResponse: (response) => {
        return response;
      },
      transformResponse: (response) => {
        return response.data;
      },
    }),
    createOrganization: builder.mutation({
      query: (body) => ({
        url: "organizations/create",
        method: "POST",
        body,
      }),
      transformErrorResponse: (response) => {
        return response;
      },
      transformResponse: (response) => {
        return response.data;
      },
    }),
    otpGenerate: builder.mutation({
      query: (body) => ({
        url: "users/generate-otp",
        method: "POST",
        body,
      }),
      transformErrorResponse: (response) => {
        return response;
      },
      transformResponse: (response) => {
        return response.data;
      },
    }),
    organizationVerify: builder.mutation({
      query: (body) => ({
        url: "super-admin/verify-organization",
        method: "POST",
        body,
      }),
      transformErrorResponse: (response) => {
        return response;
      },
      transformResponse: (response) => {
        return response.data;
      },
    }),
    createSuperAdmin: builder.mutation({
      query: (body) => ({
        url: "users/create-super-admin",
        method: "POST",
        body,
      }),
      transformErrorResponse: (response) => {
        return response;
      },
      transformResponse: (response) => {
        return response.data;
      },
    }),
    createDepartment: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: "departments/create",
        method: "POST",
        body,
      }),
      transformErrorResponse: (response) => {
        return response;
      },
      transformResponse: (response) => {
        return response.data;
      },
    }),
    getDepartmentById: builder.query({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: `departments/details/${body.departmentId}`,
        method: "GET",
      }),
      transformErrorResponse: (response) => {
        return response;
      },
      transformResponse: (response) => {
        return response.data;
      },
    }),
    updateDepartment: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: `departments/update/${body.departmentId}`,
        method: "PATCH",
        body,
      }),
      transformErrorResponse: (response) => {
        return response;
      },
      transformResponse: (response) => {
        return response.data;
      },
    }),
    deleteDepartment: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: `departments/delete/${body.departmentId}`,
        method: "DELETE",
      }),
      transformErrorResponse: (response) => {
        return response;
      },
      transformResponse: (response) => {
        return response.data;
      },
    }),
    createRole : builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: "roles/create",
        method: "POST",
        body,
      }),
      transformErrorResponse: (response) => {
        return response;
      },
      transformResponse: (response) => {
        return response.data;
      },
    }),
    getRoleById: builder.query({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: `roles/details/${body.roleId}`,
        method: "GET",
      }),
      transformErrorResponse: (response) => {
        return response;
      },
      transformResponse: (response) => {
        return response.data;
      },
    }),
    getAllOrganizationsRoles: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: "roles/all",
        method: "POST",
        body,
      }),
      transformErrorResponse: (response) => {
        return response;
      },
      transformResponse: (response) => {
        return response.data;
      },
    }),
    updateRole:builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: `roles/update/${body.roleId}`,
        method: "PATCH",
        body,
      }),
      transformErrorResponse: (response) => {
        return response;
      },
      transformResponse: (response) => {
        return response.data;
      },
    }),
    deleteRole: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: `roles/delete/${body.roleId}`,
        method: "DELETE",
      }),
      transformErrorResponse: (response) => {
        return response;
      },
      transformResponse: (response) => {
        return response.data;
      },
    }),
    createUser: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: "users/create",
        method: "POST",
        body,
      }),
      transformErrorResponse: (response) => {
        return response;
      },
      transformResponse: (response) => {
        return response.data;
      },
    }),
    updateUser: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: `users/update${body.userId}`,
        method: "PATCH",
        body,
      }),
      transformErrorResponse: (response) => {
        return response;
      },
      transformResponse: (response) => {
        return response.data;
      },
    }),
    updateUserSelf: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: "users/profile/update",
        method: "PATCH",
        body,
      }),
      transformErrorResponse: (response) => {
        return response;
      },
      transformResponse: (response) => {
        return response.data;
      },
    }),
    deleteUser: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: `users/delete/${body.userId}`,
        method: "DELETE",
      }),
      transformErrorResponse: (response) => {
        return response;
      },
      transformResponse: (response) => {
        return response.data;
      },
    }),
  }),
});

export const {
  useUserLoginMutation,
  useGetProfileQuery,
  useGetUserDetailsQuery,
  useCreateOrganizationMutation,
  useOtpGenerateMutation,
  useOrganizationVerifyMutation,
  useCreateSuperAdminMutation,
  useCreateDepartmentMutation,
  useGetDepartmentByIdQuery,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useCreateRoleMutation,
  useGetRoleByIdQuery,
  useGetAllOrganizationsRolesMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateUserSelfMutation,
  useDeleteUserMutation,
} = apiService;
