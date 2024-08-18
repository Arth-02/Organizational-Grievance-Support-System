import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setUserDetails } from "../features/userSlice";


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
        // setUserDetails(response.data.data);
        return response.data;
      },
    }),
  }),
});

export const { useUserLoginMutation } = userApi;
