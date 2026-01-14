import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import userSlice from "./features/userSlice";
import roleSlice from "./features/roleSlice";
import departmentSlice from "./features/departmentSlice";
import organizationSlice from "./features/organizationSlice";
import grievanceSlice from "./features/grievanceSlice";
import projectSlice from "./features/projectSlice";
import subscriptionSlice from "./features/subscriptionSlice";
import paymentSlice from "./features/paymentSlice";
import invoiceSlice from "./features/invoiceSlice";
import { baseApi } from "./services/baseApi.service";

export const store = configureStore({
  reducer: {
    user: userSlice,
    role: roleSlice,
    department: departmentSlice,
    grievance: grievanceSlice,
    organization: organizationSlice,
    project: projectSlice,
    subscription: subscriptionSlice,
    payment: paymentSlice,
    invoice: invoiceSlice,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(baseApi.middleware),
});

setupListeners(store.dispatch);
