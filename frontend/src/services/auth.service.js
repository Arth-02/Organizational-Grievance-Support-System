import { baseApi } from './baseApi.service';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    userLogin: builder.mutation({
      query: (body) => ({
        url: "users/login",
        method: "POST",
        body,
      }),
      transformResponse: (response) => response.data,
      transformErrorResponse: (response) => response.data,
    }),
    otpGenerate: builder.mutation({
      query: (body) => ({
        url: "users/generate-otp",
        method: "POST",
        body,
      }),
    }),
    getProfile: builder.query({
      query: () => ({
        url: "users/profile",
        method: "GET",
      }),
    }),
  }),
});

export const {
  useUserLoginMutation,
  useOtpGenerateMutation,
  useGetProfileQuery,
} = authApi;
