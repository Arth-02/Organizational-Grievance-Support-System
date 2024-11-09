// projectApi.js
import { baseApi } from './baseApi';

export const projectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createProject: builder.mutation({
      query: (body) => ({
        url: "projects/create",
        method: "POST",
        body,
      }),
    }),
    updateProject: builder.mutation({
      query: ({ id, data }) => ({
        url: `projects/update/${id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    getProjectById: builder.query({
      query: (id) => ({
        url: `projects/details/${id}`,
        method: "GET",
      }),
    }),
    deleteProject: builder.mutation({
      query: (id) => ({
        url: `projects/delete/${id}`,
        method: "DELETE",
      }),
    }),
    getAllProjects: builder.query({
      query: (filters) => {
        const params = new URLSearchParams(filters).toString();
        return {
          url: `projects/all?${params}`,
          method: "GET",
        };
      },
    }),
    addProjectBoardTag: builder.mutation({
      query: ({ id, data }) => ({
        url: `projects/add-board-tag/${id}`,
        method: "POST",
        body: data,
      }),
    }),
    updateProjectBoardTag: builder.mutation({
      query: ({ id, data }) => ({
        url: `projects/update-board-tag/${id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    deleteProjectBoardTag: builder.mutation({
      query: ({ id, data }) => ({
        url: `projects/delete-board-tag/${id}`,
        method: "DELETE",
        body: data,
      }),
    }),
    addProjectBoardTask: builder.mutation({
      query: ({ id, data }) => ({
        url: `projects/add-board-task/${id}`,
        method: "POST",
        body: data,
      }),
    }),
    updateProjectBoardTask: builder.mutation({
      query: ({ project_id, task_id, data }) => ({
        url: `projects/update-board-task/${project_id}/task/${task_id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    updateProjectBoardTaskAttachment: builder.mutation({
      query: ({ project_id, task_id, data }) => ({
        url: `projects/update-board-task-attachment/${project_id}/task/${task_id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    deleteProjectBoardTask: builder.mutation({
      query: ({ project_id, task_id }) => ({
        url: `projects/delete-board-task/${project_id}/task/${task_id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useGetProjectByIdQuery,
  useDeleteProjectMutation,
  useGetAllProjectsQuery,
  useAddProjectBoardTagMutation,
  useUpdateProjectBoardTagMutation,
  useDeleteProjectBoardTagMutation,
  useAddProjectBoardTaskMutation,
  useUpdateProjectBoardTaskMutation,
  useUpdateProjectBoardTaskAttachmentMutation,
  useDeleteProjectBoardTaskMutation,
} = projectApi;
