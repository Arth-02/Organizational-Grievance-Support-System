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
    addBoard: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: "users/add-board",
        method: "POST",
        body,
      }),
    }),
    deleteBoard: builder.mutation({
      query: (id) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `users/delete-board/${id}`,
        method: "DELETE",
      }),
    }),
    addBoardTag: builder.mutation({
      query: ({ id, data }) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `users/add-board-tag/${id}`,
        method: "POST",
        body: data,
      }),
    }),
    updateBoardTag: builder.mutation({
      query: ({ id, data }) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `users/update-board-tag/${id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    deleteBoardTag: builder.mutation({
      query: ({ id, data }) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `users/delete-board-tag/${id}`,
        method: "DELETE",
        body: data,
      }),
    }),
    addBoardTask: builder.mutation({
      query: ({ id, data }) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `users/add-board-task/${id}`,
        method: "POST",
        body: data,
      }),
    }),
    updateBoardTask: builder.mutation({
      query: ({ board_id, task_id, data }) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `users/update-board-task/${board_id}/task/${task_id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    updateBoardTaskAttachment: builder.mutation({
      query: ({ board_id, task_id, data }) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `users/update-board-task-attachment/${board_id}/task/${task_id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    deleteBoardTask: builder.mutation({
      query: ({ board_id, task_id }) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `users/delete-board-task/${board_id}/task/${task_id}`,
        method: "DELETE",
      }),
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
    createGrievance: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: "grievances/create",
        method: "POST",
        body,
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
      // invalidatesTags: ["Grievances"],
    }),
    deleteGrievanceById: builder.mutation({
      query: (id) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `grievances/delete/${id}`,
        method: "DELETE",
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
      providesTags: ["singleGrievance"],
    }),
    updateAttachment: builder.mutation({
      query: ({ id, data }) => {
        return {
          headers: {
            Authorization: `Bearer ${getFromLocalStorage("token")}`,
          },
          url: `grievances/update/attachment/${id}`,
          method: "PATCH",
          body: data,
        };
      },
      invalidatesTags: ["singleGrievance", "Grievances"],
    }),
    createProject: builder.mutation({
      query: (body) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: "projects/create",
        method: "POST",
        body,
      }),
    }),
    updateProject: builder.mutation({
      query: ({ id, data }) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `projects/update/${id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    addProjectBoardTag: builder.mutation({
      query: ({ id, data }) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `projects/add-board-tag/${id}`,
        method: "POST",
        body: data,
      }),
    }),
    updateProjectBoardTag: builder.mutation({
      query: ({ id, data }) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `projects/update-board-tag/${id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    deleteProjectBoardTag: builder.mutation({
      query: ({ id, data }) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `projects/delete-board-tag/${id}`,
        method: "DELETE",
        body: data,
      }),
    }),
    addProjectBoardTask: builder.mutation({
      query: ({ id, data }) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `projects/add-board-task/${id}`,
        method: "POST",
        body: data,
      }),
    }),
    updateProjectBoardTask: builder.mutation({
      query: ({ project_id, task_id, data }) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `projects/update-board-task/${project_id}/task/${task_id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    updateProjectBoardTaskAttachment: builder.mutation({
      query: ({ project_id, task_id, data }) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `projects/update-board-task-attachment/${project_id}/task/${task_id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    deleteProjectBoardTask: builder.mutation({
      query: ({ project_id, task_id }) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `projects/delete-board-task/${project_id}/task/${task_id}`,
        method: "DELETE",
      }),
    }),
    getProjectById: builder.query({
      query: (id) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `projects/details/${id}`,
        method: "GET",
      }),
    }),
    deleteProject: builder.mutation({
      query: (id) => ({
        headers: {
          Authorization: `Bearer ${getFromLocalStorage("token")}`,
        },
        url: `projects/delete/${id}`,
        method: "DELETE",
      }),
    }),
    getAllProjects: builder.query({
      query: (filters) => {
        const params = new URLSearchParams(filters).toString();
        return {
          headers: {
            Authorization: `Bearer ${getFromLocalStorage("token")}`,
          },
          url: `projects/all?${params}`,
          method: "GET",
        };
      },
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
  useAddBoardMutation,
  useDeleteBoardMutation,
  useAddBoardTagMutation,
  useUpdateBoardTagMutation,
  useDeleteBoardTagMutation,
  useAddBoardTaskMutation,
  useUpdateBoardTaskMutation,
  useUpdateBoardTaskAttachmentMutation,
  useDeleteBoardTaskMutation,
  useDeleteUserMutation,
  useDeleteAllUsersMutation,
  useCheckUsernameMutation,
  useCheckEmailMutation,
  useCheckEmployeeIDMutation,
  useGetAllPermissionsQuery,
  useCreateGrievanceMutation,
  useGetAllGrievancesQuery,
  useDeleteGrievanceByIdMutation,
  useUpdateGrievanceMutation,
  useGetGrievanceByIdQuery,
  useUpdateAttachmentMutation,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useAddProjectBoardTagMutation,
  useUpdateProjectBoardTagMutation,
  useDeleteProjectBoardTagMutation,
  useAddProjectBoardTaskMutation,
  useUpdateProjectBoardTaskMutation,
  useUpdateProjectBoardTaskAttachmentMutation,
  useDeleteProjectBoardTaskMutation,
  useGetProjectByIdQuery,
  useDeleteProjectMutation,
  useGetAllProjectsQuery,
} = apiService;
