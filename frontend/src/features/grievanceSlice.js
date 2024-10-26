import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  filter: null,
};

const grievanceSlice = createSlice({
  name: "grievance",
  initialState,
  reducers: {
    setGrievanceFilter: (state, action) => {
      state.filter = action.payload;
    },
    resetGrievanceFilter: (state) => {
      state.filter = null;
    },
  },
});

export const { setGrievanceFilter, resetGrievanceFilter } =
  grievanceSlice.actions;

export default grievanceSlice.reducer;
