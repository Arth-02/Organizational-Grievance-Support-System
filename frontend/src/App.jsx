import { Counter } from "./components/Counter";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Page from "./components/Page";
import { io } from "socket.io-client";
import Login from "./components/auth/Login";
import RegisterOrg from "./components/auth/RegisterOrg";
import SuperAdmin from "./components/auth/SuperAdmin";
import Home from "./components/page/Home";
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
          <Route path="/" element={<Counter />} />
          <Route path="/home" element={<Home />} />
          <Route path="/page" element={<Page />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterOrg />} />
          <Route path="/organization/super-admin/create" element={<SuperAdmin />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
