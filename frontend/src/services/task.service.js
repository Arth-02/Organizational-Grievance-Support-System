import { baseApi } from './baseApi.service';

export const taskApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createTask: builder.mutation({
      query: (body) => ({
        url: "tasks/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Tasks"],
    }),
    getTasksByProject: builder.query({
      query: ({ projectId, filters = {} }) => {
        const params = new URLSearchParams(filters).toString();
        return {
          url: `tasks/project/${projectId}${params ? `?${params}` : ''}`,
          method: "GET",
        };
      },
      providesTags: ["Tasks"],
    }),
    getTaskById: builder.query({
      query: (id) => ({
        url: `tasks/details/${id}`,
        method: "GET",
      }),
      providesTags: ["singleTask"],
    }),
    updateTask: builder.mutation({
      query: ({ id, data }) => ({
        url: `tasks/update/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Tasks", "singleTask"],
    }),
    updateTaskStatus: builder.mutation({
      query: ({ id, data }) => ({
        url: `tasks/status/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Tasks", "singleTask"],
    }),
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `tasks/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tasks"],
    }),
    addComment: builder.mutation({
      query: ({ taskId, data }) => ({
        url: `tasks/${taskId}/comments`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["singleTask"],
    }),
    updateComment: builder.mutation({
      query: ({ taskId, commentId, data }) => ({
        url: `tasks/${taskId}/comments/${commentId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["singleTask"],
    }),
    deleteComment: builder.mutation({
      query: ({ taskId, commentId }) => ({
        url: `tasks/${taskId}/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["singleTask"],
    }),
    addAttachment: builder.mutation({
      query: ({ taskId, formData }) => ({
        url: `tasks/${taskId}/attachments`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["singleTask"],
    }),
    removeAttachment: builder.mutation({
      query: ({ taskId, attachmentId }) => ({
        url: `tasks/${taskId}/attachments/${attachmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["singleTask"],
    }),
  }),
});

export const {
  useCreateTaskMutation,
  useGetTasksByProjectQuery,
  useGetTaskByIdQuery,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
  useDeleteTaskMutation,
  useAddCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useAddAttachmentMutation,
  useRemoveAttachmentMutation,
} = taskApi;
