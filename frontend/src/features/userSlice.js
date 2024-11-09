import { createSlice } from "@reduxjs/toolkit";
import { getFromLocalStorage, saveToLocalStorage } from "@/utils";
import { baseApi } from "@/services/baseApi.service";

const initialState = {
  user: null,
  filter: null,
  token: getFromLocalStorage("token") || null,
  organization: null,
  role: null,
  department: null,
  permissions: [],
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserFilter: (state, action) => {
      state.filter = action.payload;
    },
    resetUserFilter: (state) => {
      state.filter = null;
    },
    setUserDetails: (state, action) => {
      state.user = action.payload.data;
      state.token = action.payload.data.token;
      state.role = action.payload.data.role;
      state.department = action.payload.data.department;
      if (state.role.name !== "DEV") {
        state.organization = action.payload.data.organization_id;
      }
      const rolePermissions = state.user.role.permissions.map((p) => p.slug);
      state.permissions = [
        ...new Set([...rolePermissions, ...state.user.special_permissions]),
      ];
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.organization = null;
      state.role = null;
      state.department = null;

      // Clear localStorage
      localStorage.removeItem("token");
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        baseApi.endpoints.userLogin.matchFulfilled,
        (state, action) => {
          state.user = action.payload;
          state.token = action.payload.token;
          state.role = action.payload.role;
          state.department = action.payload.department;
          if (state.role.name !== "DEV") {
            state.organization = action.payload.organization_id;
          }
          state.permissions = [
            ...new Set([
              ...state.user.role.permissions,
              ...state.user.special_permissions,
            ]),
          ];
          // Save values to localStorage
          saveToLocalStorage("token", state.token);
        }
      )
      .addMatcher(
        baseApi.endpoints.createSuperAdmin.matchFulfilled,
        (state, action) => {
          state.user = action.payload.data;
        }
      );
  },
});

export const { setUserDetails, logout,setUserFilter,resetUserFilter } = userSlice.actions;

export default userSlice.reducer;
