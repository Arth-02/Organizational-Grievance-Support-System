import { createSlice } from "@reduxjs/toolkit";
import { apiService } from "../services/api.service";
import { getFromLocalStorage, saveToLocalStorage } from "@/utils";

const initialState = {
  user: null,
  token: getFromLocalStorage('token') || null,
  organization: getFromLocalStorage('organizationId') || null,
  role: getFromLocalStorage('roleId') || null,
  department: getFromLocalStorage('departmentId') || null,
  permissions: [],
};
  
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserDetails: (state, action) => {
      state.user = action.payload.data;
      const rolePermissions = state.user.role.permissions.map((p) => p.slug);
      state.permissions = [...new Set([...rolePermissions, ...state.user.special_permissions])];
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.organization = null;
      state.role = null;
      state.department = null;
      
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('organizationId');
      localStorage.removeItem('roleId');
      localStorage.removeItem('departmentId');
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
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

          // Save values to localStorage
          saveToLocalStorage("token", state.token);
          saveToLocalStorage("roleId", state.role._id);
          saveToLocalStorage("departmentId", state.department._id);
          if (state.role.name !== "DEV") {
            saveToLocalStorage("organizationId", state.organization._id);
          }
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

export const { setUserDetails, logout } = userSlice.actions;

export default userSlice.reducer;
