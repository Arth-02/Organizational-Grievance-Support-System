import { configureStore } from "@reduxjs/toolkit";
import { userApi } from "./services/user.service";
import { setupListeners } from "@reduxjs/toolkit/query";
import userSlice from "./features/userSlice";

export const store = configureStore({
  reducer: {
    user: userSlice,
    [userApi.reducerPath]: userApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(userApi.middleware),
});

setupListeners(store.dispatch);
