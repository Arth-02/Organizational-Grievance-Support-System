import { configureStore } from "@reduxjs/toolkit";
import { apiService } from "./services/api.service";
import { setupListeners } from "@reduxjs/toolkit/query";
import userSlice from "./features/userSlice";
import organizationSlice from "./features/organizationSlice";

export const store = configureStore({
  reducer: {
    user: userSlice,
    organization: organizationSlice,
    [apiService.reducerPath]: apiService.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiService.middleware),
});

setupListeners(store.dispatch);
