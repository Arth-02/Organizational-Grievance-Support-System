import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  filter: null,
  view: "board",
  myFilter: "all",
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
    setGrievanceView: (state, action) => {
      state.view = action.payload;
    },
    setGrievanceMyFilter: (state, action) => {
      state.myFilter = action.payload;
    },
  },
});

export const {
  setGrievanceFilter,
  resetGrievanceFilter,
  setGrievanceView,
  setGrievanceMyFilter,
} = grievanceSlice.actions;

export default grievanceSlice.reducer;

