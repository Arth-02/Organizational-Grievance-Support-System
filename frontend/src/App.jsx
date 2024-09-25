import { Counter } from "./components/Counter";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { io } from "socket.io-client";
import Login from "./components/auth/Login";
import RegisterOrg from "./components/auth/RegisterOrg";
import SuperAdmin from "./components/auth/SuperAdmin";
import Layout from "./components/layout/Layout";
import Employees from "./components/page/employees/Employees";
import Departments from "./components/page/departments/Departments";
import Roles from "./components/page/roles/Roles";
const socket = io("http://localhost:9001");

socket.on("connect", () => {
  console.log("hey, ", socket.id);
});

socket.on("receive_notification", (msg) => {
  console.log(msg);
});

// const port = import.meta.env.VITE_BASE_URL;

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterOrg />} />
          <Route path="/organization/super-admin/create" element={<SuperAdmin />} />

          <Route path="/" element={<Layout />} >
            <Route path="/dashboard" element={<Counter />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/roles" element={<Roles />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
