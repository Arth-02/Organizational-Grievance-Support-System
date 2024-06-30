import React from "react";
import { Navigate } from "react-router-dom";

const isAdmin = () => {
  // This is a placeholder. In a real app, you'd check against your auth system
  return localStorage.getItem("isAdmin") === "true";
};

const PrivateRoute = ({ element }) => {
  return isAdmin() ? element : <Navigate to="/login" replace />;
};

export default PrivateRoute;