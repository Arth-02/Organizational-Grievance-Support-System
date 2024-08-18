import { configureStore } from "@reduxjs/toolkit";
import { apiService } from "./services/api.service";
import { setupListeners } from "@reduxjs/toolkit/query";
import userSlice from "./features/userSlice";

export const store = configureStore({
  reducer: {
    user: userSlice,
    [apiService.reducerPath]: apiService.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiService.middleware),
});

setupListeners(store.dispatch);
