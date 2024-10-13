import { createSlice } from "@reduxjs/toolkit";
import { apiService } from "../services/api.service";
import { getFromLocalStorage, saveToLocalStorage } from "@/utils";

const initialState = {
  user: null,
  token: getFromLocalStorage('token') || null,
  organization: getFromLocalStorage('organizationId') || null,
  role: getFromLocalStorage('roleId') || null,
  department: getFromLocalStorage('departmentId') || null,
};
  
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserDetails: (state, action) => {
      state.user = action.payload.data;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      apiService.endpoints.userLogin.matchFulfilled,
      (state, action) => {
        state.user = {
          email: action.payload.email,
          id: action.payload.id,
          username: action.payload.username,
        };
        state.token = action.payload.token;
        state.organization = action.payload.organization_id;
        state.role = action.payload.role;
        state.department = action.payload.department;

        saveToLocalStorage("token", state.token);
        saveToLocalStorage("roleId", state.role._id);
        if (state.role.name !== "DEV") {
          saveToLocalStorage("organizationId", state.organization._id);
        }
        saveToLocalStorage("organizationId", state.organization._id);
        saveToLocalStorage("departmentId", state.department._id);
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
