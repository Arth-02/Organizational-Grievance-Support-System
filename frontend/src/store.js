import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import userSlice from "./features/userSlice";
import roleSlice from "./features/roleSlice";
import departmentSlice from "./features/departmentSlice";
import organizationSlice from "./features/organizationSlice";
import grievanceSlice from "./features/grievanceSlice";
import { baseApi } from "./services/baseApi.service";

export const store = configureStore({
  reducer: {
    user: userSlice,
    role: roleSlice,
    department: departmentSlice,
    grievance: grievanceSlice,
    organization: organizationSlice,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(baseApi.middleware),
});

setupListeners(store.dispatch);
