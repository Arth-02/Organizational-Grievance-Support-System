import { baseApi } from './baseApi.service';

export const grievanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createGrievance: builder.mutation({
      query: (body) => ({
        url: "grievances/create",
        method: "POST",
        body,
      }),
    }),
    getAllGrievances: builder.query({
      query: (filters) => {
        const params = new URLSearchParams(filters).toString();
        return {
          url: `grievances/all?${params}`,
          method: "GET",
        };
      },
      providesTags: ["Grievances"],
    }),
    updateGrievance: builder.mutation({
      query: ({ id, data }) => ({
        url: `grievances/update/${id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    updateGrievanceAssignee: builder.mutation({
      query: ({ id, data }) => ({
        url: `grievances/updateassignee/${id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    updateGrievanceStatus: builder.mutation({
      query: ({ id, data }) => ({
        url: `grievances/updatestatus/${id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    deleteGrievanceById: builder.mutation({
      query: (id) => ({
        url: `grievances/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Grievances"],
    }),
    getGrievanceById: builder.query({
      query: (id) => ({
        url: `grievances/details/${id}`,
        method: "GET",
      }),
      providesTags: ["singleGrievance"],
    }),
    updateAttachment: builder.mutation({
      query: ({ id, data }) => ({
        url: `grievances/update/attachment/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["singleGrievance", "Grievances"],
    }),
  }),
});

export const {
  useCreateGrievanceMutation,
  useGetAllGrievancesQuery,
  useUpdateGrievanceMutation,
  useUpdateGrievanceAssigneeMutation,
  useUpdateGrievanceStatusMutation,
  useDeleteGrievanceByIdMutation,
  useGetGrievanceByIdQuery,
  useUpdateAttachmentMutation,
} = grievanceApi;
