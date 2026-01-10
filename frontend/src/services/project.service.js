import { baseApi } from './baseApi.service';

export const projectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createProject: builder.mutation({
      query: (body) => ({
        url: "projects/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Projects"],
    }),
    getAllProjects: builder.query({
      query: (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        return {
          url: `projects/all${params ? `?${params}` : ''}`,
          method: "GET",
        };
      },
      providesTags: ["Projects"],
    }),
    getProjectById: builder.query({
      query: (id) => ({
        url: `projects/details/${id}`,
        method: "GET",
      }),
      providesTags: ["singleProject"],
    }),
    updateProject: builder.mutation({
      query: ({ id, data }) => ({
        url: `projects/update/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Projects", "singleProject"],
    }),
    deleteProject: builder.mutation({
      query: (id) => ({
        url: `projects/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Projects"],
    }),
    addProjectMembers: builder.mutation({
      query: ({ id, data }) => ({
        url: `projects/${id}/members`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["singleProject", "ProjectMembers"],
    }),
    removeProjectMembers: builder.mutation({
      query: ({ id, data }) => ({
        url: `projects/${id}/members`,
        method: "DELETE",
        body: data,
      }),
      invalidatesTags: ["singleProject", "ProjectMembers"],
    }),
    getProjectMembers: builder.query({
      query: (id) => ({
        url: `projects/${id}/members`,
        method: "GET",
      }),
      providesTags: ["ProjectMembers"],
    }),
  }),
});

export const {
  useCreateProjectMutation,
  useGetAllProjectsQuery,
  useGetProjectByIdQuery,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useAddProjectMembersMutation,
  useRemoveProjectMembersMutation,
  useGetProjectMembersQuery,
} = projectApi;
