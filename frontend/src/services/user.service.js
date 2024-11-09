import { baseApi } from './baseApi.service';

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserDetails: builder.query({
      query: (id) => ({
        url: `users/details/${id}`,
        method: "GET",
      }),
    }),
    getAllUsers: builder.query({
      query: (filters) => {
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
          url: `users/all?${params}`,
          method: "GET",
        };
      },
      providesTags: ["Users"],
    }),
    createUser: builder.mutation({
      query: (body) => ({
        url: "users/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Users"],
    }),
    updateUser: builder.mutation({
      query: ({ id, data }) => ({
        url: `users/update/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Users"],
    }),
    updateUserSelf: builder.mutation({
      query: (body) => ({
        url: "users/profile/update",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Users"],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `users/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),
    deleteAllUsers: builder.mutation({
      query: (body) => ({
        url: "users/delete",
        method: "DELETE",
        body,
      }),
      invalidatesTags: ["Users"],
    }),
    checkUsername: builder.mutation({
      query: (body) => ({
        url: "users/checkusername",
        method: "POST",
        body,
      }),
    }),
    checkEmail: builder.mutation({
      query: (body) => ({
        url: "users/checkemail",
        method: "POST",
        body,
      }),
    }),
    checkEmployeeID: builder.mutation({
      query: (body) => ({
        url: "users/checkemployeeid",
        method: "POST",
        body,
      }),
    }),
    getAllPermissions: builder.query({
      query: () => ({
        url: "users/permissions",
        method: "GET",
      }),
    }),
    // Board operations
    addBoard: builder.mutation({
      query: (body) => ({
        url: "users/add-board",
        method: "POST",
        body,
      }),
    }),
    deleteBoard: builder.mutation({
      query: (id) => ({
        url: `users/delete-board/${id}`,
        method: "DELETE",
      }),
    }),
    addBoardTag: builder.mutation({
      query: ({ id, data }) => ({
        url: `users/add-board-tag/${id}`,
        method: "POST",
        body: data,
      }),
    }),
    updateBoardTag: builder.mutation({
      query: ({ id, data }) => ({
        url: `users/update-board-tag/${id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    deleteBoardTag: builder.mutation({
      query: ({ id, data }) => ({
        url: `users/delete-board-tag/${id}`,
        method: "DELETE",
        body: data,
      }),
    }),
    addBoardTask: builder.mutation({
      query: ({ id, data }) => ({
        url: `users/add-board-task/${id}`,
        method: "POST",
        body: data,
      }),
    }),
    updateBoardTask: builder.mutation({
      query: ({ board_id, task_id, data }) => ({
        url: `users/update-board-task/${board_id}/task/${task_id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    updateBoardTaskAttachment: builder.mutation({
      query: ({ board_id, task_id, data }) => ({
        url: `users/update-board-task-attachment/${board_id}/task/${task_id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    deleteBoardTask: builder.mutation({
      query: ({ board_id, task_id }) => ({
        url: `users/delete-board-task/${board_id}/task/${task_id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetUserDetailsQuery,
  useGetAllUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateUserSelfMutation,
  useDeleteUserMutation,
  useDeleteAllUsersMutation,
  useCheckUsernameMutation,
  useCheckEmailMutation,
  useCheckEmployeeIDMutation,
  useGetAllPermissionsQuery,
  // Board operation hooks
  useAddBoardMutation,
  useDeleteBoardMutation,
  useAddBoardTagMutation,
  useUpdateBoardTagMutation,
  useDeleteBoardTagMutation,
  useAddBoardTaskMutation,
  useUpdateBoardTaskMutation,
  useUpdateBoardTaskAttachmentMutation,
  useDeleteBoardTaskMutation,
} = userApi;