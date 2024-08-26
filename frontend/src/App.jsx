import { Counter } from "./components/Counter";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import Page from "./components/Page";
import { io } from "socket.io-client";
import { Button } from "./components/ui/button";
const socket = io("http://localhost:9001");

socket.on("connect", () => {
  console.log("hey, ", socket.id); // x8WIv7-mJelg7on_ALbx
});

socket.on("receive_notification", (msg) => {
  console.log(msg);
});

const port = import.meta.env.VITE_BASE_URL;

function App() {
  const sendnotification = () => {
    socket.emit("notification", "Hello");
  };
  return (
    <>
      <BrowserRouter>
        <div>
          <Button
            onClick={() => {
              sendnotification();
            }}
          >
            Click me
          </Button>
          <Link to="/">Home</Link>
          <Link to="/page">Page</Link>
        </div>
        <Routes>
          <Route path="/" element={<Counter />} />
          <Route path="/page" element={<Page />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
