import { getFromLocalStorage } from "@/utils";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseUrl = import.meta.env.VITE_BASE_URL;

export const apiService = createApi({
  reducerPath: "apiService",
  baseQuery: fetchBaseQuery({ baseUrl: baseUrl }),
  endpoints: (builder) => ({
    userLogin: builder.mutation({
      query: (body) => ({
        url: "users/login",
        method: "POST",
        body,
      }),
      transformResponse: (response) => {
        return response.data;
      },
      transformErrorResponse: (response) => {
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
    }),
    getUserDetails: builder.query({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: `users/details/${body.userId}`,
        method: "GET",
      }),
    }),
    getAllUsers: builder.query({
      query: (filters) => {
        const params = new URLSearchParams(filters).toString();
        return {
          headers: {
            Authorization: `Bearer ${getFromLocalStorage("token")}`,
          },
          url: `users/all?${params}`,
          method: "GET",
        };
      },
      transformResponse: (response) => {
        return response.data;
      },
      transformErrorResponse: (response) => {
        return response.data;
      }
    }),
    createOrganization: builder.mutation({
      query: (body) => ({
        url: "organizations/create",
        method: "POST",
        body,
      }),
      transformResponse: (response) => {
        return response.data;
      },
      transformErrorResponse: (response) => {
        return response.data;
      },
    }),
    otpGenerate: builder.mutation({
      query: (body) => ({
        url: "users/generate-otp",
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
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: `organizations/details/${body.organization_id}`,
        method: "GET",
      }),
      transformResponse: (response) => {
        return response.data;
      },
      transformErrorResponse: (response) => {
        return response.data;
      },
    }),
    createSuperAdmin: builder.mutation({
      query: (body) => ({
        url: "users/create-super-admin",
        method: "POST",
        body,
      }),
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
    }),
    getDepartmentById: builder.query({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: `departments/details/${body.departmentId}`,
        method: "GET",
      }),
    }),
    getAllDepartmentName: builder.query({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: "departments/names",
        method: "GET",
      }),
    }),
    getAllDepartments: builder.query({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: "departments/all",
        method: "GET",
      }),
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
    }),
    deleteDepartment: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: `departments/delete/${body.departmentId}`,
        method: "DELETE",
      }),
    }),
    createRole: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: "roles/create",
        method: "POST",
        body,
      }),
    }),
    getRoleById: builder.query({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: `roles/details/${body.roleId}`,
        method: "GET",
      }),
    }),
    getAllRoleName: builder.query({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: "roles/names",
        method: "GET",
      }),
    }),
    getAllRoles: builder.query({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: "roles/all",
        method: "GET",
      }),
    }),
    updateRole: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: `roles/update/${body.roleId}`,
        method: "PATCH",
        body,
      }),
    }),
    deleteRole: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: `roles/delete/${body.roleId}`,
        method: "DELETE",
      }),
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
    }),
    deleteUser: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: `users/delete/${body.userId}`,
        method: "DELETE",
      }),
    }),
    checkUsername: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: "users/checkusername",
        method: "POST",
        body,
      }),
      transformResponse: (response) => {
        return response.data;
      },
      transformErrorResponse: (response) => {
        return response.data;
      },
    }),
    checkEmail: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: "users/checkemail",
        method: "POST",
        body,
      }),
      transformResponse: (response) => {
        return response.data;
      },
      transformErrorResponse: (response) => {
        return response.data;
      },
    }),
    checkEmployeeID: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${body.token}`,
        },
        url: "users/checkemployeeid",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useUserLoginMutation,
  useGetProfileQuery,
  useGetUserDetailsQuery,
  useGetAllUsersQuery,
  useCreateOrganizationMutation,
  useOtpGenerateMutation,
  useOrganizationVerifyMutation,
  useLazyGetOrganizationByIdQuery,
  useCreateSuperAdminMutation,
  useCreateDepartmentMutation,
  useGetDepartmentByIdQuery,
  useGetAllDepartmentNameQuery,
  useGetAllDepartmentsQuery,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useCreateRoleMutation,
  useGetRoleByIdQuery,
  useGetAllRoleNameQuery,
  useGetAllRolesQuery,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateUserSelfMutation,
  useDeleteUserMutation,
  useCheckUsernameMutation,
  useCheckEmailMutation,
  useCheckEmployeeIDMutation,
} = apiService;
