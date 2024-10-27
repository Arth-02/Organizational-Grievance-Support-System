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
      query: () => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: "users/profile",
        method: "GET",
      }),
    }),
    getUserDetails: builder.query({
      query: (id) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `users/details/${id}`,
        method: "GET",
      }),
      
    }),
    getAllUsers: builder.query({
      query: (filters) => {
        const cleanedFilters = Object.entries(filters).reduce(
          (acc, [key, value]) => {
            if (
              value !== "" &&
              value !== null &&
              value !== undefined &&
              value !== "all"
            ) {
              acc[key] = value;
            }
            return acc;
          },
          {}
        );
        const params = new URLSearchParams(cleanedFilters).toString();
        return {
          headers: {
            Authorization: `Bearer ${getFromLocalStorage("token")}`,
          },
          url: `users/all?${params}`,
          method: "GET",
        };
      },
      
      providesTags: ["Users"],
    }),
    createOrganization: builder.mutation({
      query: (body) => ({
        url: "organizations/create",
        method: "POST",
        body,
      }),
      
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
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: "departments/create",
        method: "POST",
        body,
      }),
      
      invalidatesTags: ["Departments"],
    }),
    getDepartmentById: builder.query({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `departments/details/${body}`,
        method: "GET",
      }),
      
      providesTags: ["Departments"],
    }),
    getAllDepartmentName: builder.query({
      query: () => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: "departments/names",
        method: "GET",
      }),
      providesTags: ["Departments"],
    }),
    getAllDepartments: builder.query({
      query: (filters) => {
        const params = new URLSearchParams(filters).toString();
        return {
          headers: {
            Authorization: `Bearer ${getFromLocalStorage("token")}`,
          },
          url: `departments/all?${params}`,
          method: "GET",
        };
      },
      
      providesTags: ["Departments"],
    }),
    updateDepartment: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `departments/update/${body.id}`,
        method: "PATCH",
        body: body.data,
      }),
      
      invalidatesTags: ["Departments"],
    }),
    deleteDepartment: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `departments/delete/${body}`,
        method: "DELETE",
      }),
      
      invalidatesTags: ["Departments"],
    }),
    createRole: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: "roles/create",
        method: "POST",
        body,
      }),
      
      invalidatesTags: ["Roles"],
    }),
    getRoleById: builder.query({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `roles/details/${body}`,
        method: "GET",
      }),
      
      providesTags: ["Roles"],
    }),
    getAllRoleName: builder.query({
      query: () => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: "roles/names",
        method: "GET",
      }),
      
      providesTags: ["Roles"],
    }),
    getAllRoles: builder.query({
      query: (filters) => {
        const params = new URLSearchParams(filters).toString();
        return {
          headers: {
            Authorization: `Bearer ${getFromLocalStorage("token")}`,
          },
          url: `roles/all?${params}`,
          method: "GET",
        };
      },
      
      providesTags: ["Roles"],
    }),
    updateRole: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `roles/update/${body.id}`,
        method: "PATCH",
        body: body.data,
      }),
      
      invalidatesTags: ["Roles"],
    }),
    deleteRole: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `roles/delete/${body}`,
        method: "DELETE",
      }),
      
      invalidatesTags: ["Roles"],
    }),
    createUser: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: "users/create",
        method: "POST",
        body,
      }),
      
      invalidatesTags: ["Users"],
    }),
    updateUser: builder.mutation({
      query: ({ id, data }) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `users/update/${id}`,
        method: "PATCH",
        body: data,
      }),
      
      invalidatesTags: ["Users"],
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
      
      invalidatesTags: ["Users"],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `users/delete/${id}`,
        method: "DELETE",
      }),
      
      invalidatesTags: ["Users"],
    }),
    deleteAllUsers: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: "users/delete",
        method: "DELETE",
        body,
      }),
      
      invalidatesTags: ["Users"],
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
    getAllPermissions: builder.query({
      query: () => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: "users/permissions",
        method: "GET",
      }),
      
    }),
    getAllGrievances: builder.query({
      query: (filters) => {
        const params = new URLSearchParams(filters).toString();
        return {
          headers: {
            Authorization: `Bearer ${getFromLocalStorage("token")}`,
          },
          url: `grievances/all?${params}`,
          method: "GET",
        };
      },
      providesTags: ["Grievances"],
    }),
    updateGrievance: builder.mutation({
      query: ({ id, data }) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `grievances/update/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Grievances"],
    }),
    getGrievanceById: builder.query({
      query: (id) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `grievances/details/${id}`,
        method: "GET",
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
  useDeleteAllUsersMutation,
  useCheckUsernameMutation,
  useCheckEmailMutation,
  useCheckEmployeeIDMutation,
  useGetAllPermissionsQuery,
  useGetAllGrievancesQuery,
  useUpdateGrievanceMutation,
  useGetGrievanceByIdQuery,
} = apiService;
