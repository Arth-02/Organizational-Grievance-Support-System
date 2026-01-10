import { baseApi } from './baseApi.service';

export const boardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBoardsByProject: builder.query({
      query: (projectId) => ({
        url: `boards/project/${projectId}`,
        method: "GET",
      }),
      providesTags: ["Boards"],
    }),
    getBoardById: builder.query({
      query: (id) => ({
        url: `boards/details/${id}`,
        method: "GET",
      }),
      providesTags: ["singleBoard"],
    }),
    updateBoard: builder.mutation({
      query: ({ id, data }) => ({
        url: `boards/update/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Boards", "singleBoard"],
    }),
  }),
});

export const {
  useGetBoardsByProjectQuery,
  useGetBoardByIdQuery,
  useUpdateBoardMutation,
} = boardApi;
