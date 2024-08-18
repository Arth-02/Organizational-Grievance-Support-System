import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseUrl = import.meta.env.VITE_BASE_URL;

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({ baseUrl: baseUrl + "users" }),
  endpoints: (builder) => ({
    userLogin: builder.mutation({
      query: (body) => ({
        url: "login",
        method: "POST",
        body,
      }),
      transformErrorResponse: (response) => {
        return response;
      },
      transformResponse: (response) => {
        return response.data;
      },
    }),
    getProfile: builder.query({
      query:(body)=>({
        headers:{
          Authorization:`Bearer ${body.token}`
        },
        url:"profile",
        method:"GET",
      }),
      transformErrorResponse: (response) => {
        return response;
      },
      transformResponse: (response) => {
        return response.data;
      },
    }),
    getUserDetails: builder.query({
      query:(body)=>({
        headers:{
          Authorization:`Bearer ${body.token}`
        },
        url:`/details/${body.userId}`,
        method:"GET",
      }),
      transformErrorResponse: (response) => {
        return response;
      },
      transformResponse: (response) => {
        return response.data;
      },
    })

  }),
});

export const { useUserLoginMutation,useGetProfileQuery,useGetUserDetailsQuery } = userApi;
