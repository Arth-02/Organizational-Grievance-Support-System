import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  filter: null,
};

const roleSlice = createSlice({
  name: "role",
  initialState,
  reducers: {
    setRoleFilter: (state, action) => {
      state.filter = action.payload;
    },
    resetRoleFilter: (state) => {
      state.filter = null;
    },
  },
});

export const { setRoleFilter, resetRoleFilter } = roleSlice.actions;

export default roleSlice.reducer;
