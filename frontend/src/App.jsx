import { BrowserRouter, Route, Routes } from "react-router-dom";
import { io } from "socket.io-client";
import Login from "./components/auth/Login";
import RegisterOrg from "./components/auth/RegisterOrg";
import SuperAdmin from "./components/auth/SuperAdmin";
import Layout from "./components/layout/Layout";
import Employees from "./components/page/employees/Employees";
import Departments from "./components/page/departments/Departments";
import Roles from "./components/page/roles/Roles";
import AddUpdateEmployee from "./components/page/employees/AddUpdateEmployee";
import AddUpdateDepartment from "./components/page/departments/AddUpdateDepartment";
import AddUpdateRole from "./components/page/roles/AddUpdateRole";
import PrivateRoute from "./PrivateRoute";
import Unauthorized from "./Unauthorized";
import PermissionGuard from "./PermissionGuard";
import Grievances from "./components/page/grievance/Grievances";
import AddUpdateGrievance from "./components/page/grievance/AddUpdateGrievance";
import { useSelector } from "react-redux";
import { useEffect } from "react";

const socket = io("http://localhost:9001");

function App() {

  const user = useSelector((state) => state.user.user);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("hey, ", socket.id);
    });
    if(!user) return;

    socket.emit("register_user", user._id);
    console.log(`User ${user._id} registered`);

    // Listen for the 'receive_notification' event from the server
    socket.on("receive_notification", (msg) => {
      console.log("Notification received:", msg);
      // setNotifications((prev) => [...prev, msg]); // Append new notification to state
    });
  }, [user]);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterOrg />} />
          <Route
            path="/organization/super-admin/create"
            element={<SuperAdmin />}
          />

          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route path="/grievances" element={<Grievances />} />
            <Route path="/grievances/add" element={<AddUpdateGrievance />} />
            <Route
              path="/employees"
              element={
                <PermissionGuard requiredPermissions={["VIEW_USER"]}>
                  <Employees />
                </PermissionGuard>
              }
            />

            <Route
              path="/employees/add"
              element={
                <PermissionGuard requiredPermissions={["CREATE_USER"]}>
                  <AddUpdateEmployee />
                </PermissionGuard>
              }
            />
            <Route
              path="/employees/update/:id"
              element={
                <PermissionGuard requiredPermissions={["UPDATE_USER"]}>
                  <AddUpdateEmployee />
                </PermissionGuard>
              }
            />
            <Route
              path="/departments"
              element={
                <PermissionGuard requiredPermissions={["VIEW_DEPARTMENT"]}>
                  <Departments />
                </PermissionGuard>
              }
            />
            <Route
              path="/departments/add"
              element={
                <PermissionGuard requiredPermissions={["CREATE_DEPARTMENT"]}>
                  <AddUpdateDepartment />
                </PermissionGuard>
              }
            />
            <Route
              path="/departments/update/:id"
              element={
                <PermissionGuard requiredPermissions={["UPDATE_DEPARTMENT"]}>
                  <AddUpdateDepartment />
                </PermissionGuard>
              }
            />
            <Route
              path="/roles"
              element={
                <PermissionGuard requiredPermissions={["VIEW_ROLE"]}>
                  <Roles />
                </PermissionGuard>
              }
            />
            <Route
              path="/roles/add"
              element={
                <PermissionGuard requiredPermissions={["CREATE_ROLE"]}>
                  <AddUpdateRole />
                </PermissionGuard>
              }
            />
            <Route
              path="/roles/update/:id"
              element={
                <PermissionGuard requiredPermissions={["UPDATE_ROLE"]}>
                  <AddUpdateRole />
                </PermissionGuard>
              }
            />
          </Route>
          <Route path="*" element={<Unauthorized />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
