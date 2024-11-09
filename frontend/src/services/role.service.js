import { baseApi } from './baseApi.service';

export const roleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createRole: builder.mutation({
      query: (body) => ({
        url: "roles/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Roles"],
    }),
    getRoleById: builder.query({
      query: (id) => ({
        url: `roles/details/${id}`,
        method: "GET",
      }),
      providesTags: ["Roles"],
    }),
    getAllRoleName: builder.query({
      query: () => ({
        url: "roles/names",
        method: "GET",
      }),
      providesTags: ["Roles"],
    }),
    getAllRoles: builder.query({
      query: (filters) => {
        const params = new URLSearchParams(filters).toString();
        return {
          url: `roles/all?${params}`,
          method: "GET",
        };
      },
      providesTags: ["Roles"],
    }),
    updateRole: builder.mutation({
      query: ({ id, data }) => ({
        url: `roles/update/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Roles"],
    }),
    deleteRole: builder.mutation({
      query: (id) => ({
        url: `roles/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Roles"],
    }),
  }),
});

export const {
  useCreateRoleMutation,
  useGetRoleByIdQuery,
  useGetAllRoleNameQuery,
  useGetAllRolesQuery,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = roleApi;
