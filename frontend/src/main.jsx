// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { store } from "./store.js";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";  
import { TooltipProvider } from "./components/ui/tooltip.jsx";

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <Provider store={store}>
    <TooltipProvider>
    <App />
    <Toaster position="top-right" />
    </TooltipProvider>
  </Provider>
  // </StrictMode>,
);
