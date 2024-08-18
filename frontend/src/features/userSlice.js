import { createSlice } from "@reduxjs/toolkit";
import { userApi } from "../services/user.service";

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
      userApi.endpoints.userLogin.matchFulfilled,
      (state, action) => {
        state.user = action.payload;
      }
    );
  },
});

export const { setUserDetails } = userSlice.actions;

export default userSlice.reducer;
