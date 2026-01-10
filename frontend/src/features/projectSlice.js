import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentProject: null,
  view: "board",
  filters: {
    assignee: null,
    priority: null,
    type: null,
    search: "",
    myFilter: "all",
  },
};

const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
    },
    setProjectView: (state, action) => {
      state.view = action.payload;
    },
    setProjectFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetProjectFilters: (state) => {
      state.filters = {
        assignee: null,
        priority: null,
        type: null,
        search: "",
        myFilter: "all",
      };
    },
  },
});

export const {
  setCurrentProject,
  setProjectView,
  setProjectFilters,
  resetProjectFilters,
} = projectSlice.actions;

export default projectSlice.reducer;
