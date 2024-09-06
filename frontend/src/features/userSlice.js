import { createSlice } from "@reduxjs/toolkit";
import { apiService } from "../services/api.service";

const initialState = {
  user: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserDetails: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      apiService.endpoints.userLogin.matchFulfilled,
      (state, action) => {
        state.user = action.payload.data;
      }
    )
    .addMatcher(
      apiService.endpoints.createSuperAdmin.matchFulfilled,
      (state, action) => {
        state.user = action.payload.data;
      }
    );
  },
});

export const { setUserDetails } = userSlice.actions;

export default userSlice.reducer;
