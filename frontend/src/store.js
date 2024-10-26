import { configureStore } from "@reduxjs/toolkit";
import { apiService } from "./services/api.service";
import { setupListeners } from "@reduxjs/toolkit/query";
import userSlice from "./features/userSlice";
import roleSlice from "./features/roleSlice";
import departmentSlice from "./features/departmentSlice";
import organizationSlice from "./features/organizationSlice";
import grievanceSlice from "./features/grievanceSlice";

export const store = configureStore({
  reducer: {
    user: userSlice,
    role: roleSlice,
    department: departmentSlice,
    grievance: grievanceSlice,
    organization: organizationSlice,
    [apiService.reducerPath]: apiService.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiService.middleware),
});

setupListeners(store.dispatch);
