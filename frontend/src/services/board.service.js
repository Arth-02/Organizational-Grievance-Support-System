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
      // Use optimistic update instead of invalidating to prevent refetch cascade
      async onQueryStarted({ id, data }, { dispatch, queryFulfilled, getState }) {
        // Find the project ID for this board to update the correct cache
        const state = getState();
        const boardsQueries = state.api.queries;
        
        // Find which project query has this board
        let projectId = null;
        for (const key of Object.keys(boardsQueries)) {
          if (key.startsWith('getBoardsByProject')) {
            const queryData = boardsQueries[key]?.data?.data;
            if (queryData?.some(b => b._id === id)) {
              // Extract projectId from the query key
              const match = key.match(/getBoardsByProject\("([^"]+)"\)/);
              if (match) {
                projectId = match[1];
                break;
              }
            }
          }
        }

        if (!projectId) return;

        // Optimistically update the cache
        const patchResult = dispatch(
          boardApi.util.updateQueryData('getBoardsByProject', projectId, (draft) => {
            const boardIndex = draft.data?.findIndex(b => b._id === id);
            if (boardIndex !== -1 && draft.data) {
              // Merge the update data into the existing board
              Object.assign(draft.data[boardIndex], data);
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          // Revert the optimistic update on error
          patchResult.undo();
        }
      },
    }),
  }),
});

export const {
  useGetBoardsByProjectQuery,
  useGetBoardByIdQuery,
  useUpdateBoardMutation,
} = boardApi;
