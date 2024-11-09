import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getFromLocalStorage } from "@/utils";

const baseUrl = import.meta.env.VITE_BASE_URL;

export const baseApi = createApi({
  reducerPath: "apiService",
  baseQuery: fetchBaseQuery({ 
    baseUrl,
    prepareHeaders: (headers) => {
      const token = getFromLocalStorage("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    }
  }),
  endpoints: () => ({}),
});
