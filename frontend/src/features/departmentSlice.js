import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  filter: null,
};

const departmentSlice = createSlice({
  name: "department",
  initialState,
  reducers: {
    setDepartmentFilter: (state, action) => {
      state.filter = action.payload;
    },
    resetDepartmentFilter: (state) => {
      state.filter = null;
    },
  },
});

export const { setDepartmentFilter, resetDepartmentFilter } =
  departmentSlice.actions;

export default departmentSlice.reducer;
