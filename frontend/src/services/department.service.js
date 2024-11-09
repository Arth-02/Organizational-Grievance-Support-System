// departmentApi.js
import { baseApi } from './baseApi';

export const departmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createDepartment: builder.mutation({
      query: (body) => ({
        url: "departments/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Departments"],
    }),
    getDepartmentById: builder.query({
      query: (id) => ({
        url: `departments/details/${id}`,
        method: "GET",
      }),
      providesTags: ["Departments"],
    }),
    getAllDepartmentName: builder.query({
      query: () => ({
        url: "departments/names",
        method: "GET",
      }),
      providesTags: ["Departments"],
    }),
    getAllDepartments: builder.query({
      query: (filters) => {
        const params = new URLSearchParams(filters).toString();
        return {
          url: `departments/all?${params}`,
          method: "GET",
        };
      },
      providesTags: ["Departments"],
    }),
    updateDepartment: builder.mutation({
      query: ({ id, data }) => ({
        url: `departments/update/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Departments"],
    }),
    deleteDepartment: builder.mutation({
      query: (id) => ({
        url: `departments/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Departments"],
    }),
  }),
});

export const {
  useCreateDepartmentMutation,
  useGetDepartmentByIdQuery,
  useGetAllDepartmentNameQuery,
  useGetAllDepartmentsQuery,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentApi;
