import { baseApi } from "./baseApi.service";

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
    getAllUserNames: builder.query({
      query: () => ({
        url: "users/usersname",
        method: "GET",
      }),
    }),
    changePassword: builder.mutation({
      query: (body) => ({
        url: "users/profile/change-password",
        method: "PATCH",
        body,
      }),
    }),
    changeEmail: builder.mutation({
      query: (body) => ({
        url: "users/profile/change-email",
        method: "PATCH",
        body,
      }),
    }),
    getProfile: builder.query({
      query: () => ({
        url: "users/profile",
        method: "GET",
      }),
      providesTags: ["Profile"],
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
  useGetAllUserNamesQuery,
  // Profile operations
  useChangePasswordMutation,
  useChangeEmailMutation,
  useGetProfileQuery,
} = userApi;

