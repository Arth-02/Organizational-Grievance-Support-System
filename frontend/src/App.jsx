import { Counter } from "./components/Counter";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Page from "./components/Page";
import { io } from "socket.io-client";
import Login from "./components/auth/Login";
const socket = io("http://localhost:9001");

socket.on("connect", () => {
  console.log("hey, ", socket.id); // x8WIv7-mJelg7on_ALbx
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
          <Route path="/page" element={<Page />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
