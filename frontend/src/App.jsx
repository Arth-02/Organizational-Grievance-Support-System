import { BrowserRouter, Route, Routes } from "react-router-dom";
import { io } from "socket.io-client";
import { Counter } from "./components/Counter";
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

const socket = io("http://localhost:9001");

socket.on("connect", () => {
  console.log("hey, ", socket.id);
});

socket.on("receive_notification", (msg) => {
  console.log(msg);
});

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterOrg />} />
          <Route path="/organization/super-admin/create" element={<SuperAdmin />} />

          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route path="/dashboard" element={<Counter />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/employees/add" element={<AddUpdateEmployee />} />
            <Route path="/employees/update/:id" element={<AddUpdateEmployee />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/departments/add" element={<AddUpdateDepartment />} />
            <Route path="/departments/update/:id" element={<AddUpdateDepartment />} />
            <Route path="/roles" element={<Roles />} />
            <Route path="/roles/add" element={<AddUpdateRole />} />
            <Route path="/roles/update/:id" element={<AddUpdateRole />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
