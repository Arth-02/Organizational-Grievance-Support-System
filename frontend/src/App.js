import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Login from "./Components/Login";
import Dashboard from "./Components/Dashboard";
import axios from "axios";
import PrivateRoute from "./Components/PrivateRoute";
import Layout from "./layout/Layout";
import Reports from "./pages/Reports";

axios.defaults.baseURL = process.env.REACT_APP_API_URL;

function App() {
  return (
    <>
      <ToastContainer autoClose={1000} hideProgressBar={true} />
      <Router>
        <Routes>
          <Route element={<Layout />}>
    
            <Route path="/" element={<PrivateRoute> <Dashboard /> </PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute> <Dashboard /> </PrivateRoute>} />
            <Route path="/reports" element={<PrivateRoute> <Reports /> </PrivateRoute>} />

          </Route>
          <Route path="/login" element={<Login />} />

        </Routes>
      </Router>
    </>
  );
}

export default App;
