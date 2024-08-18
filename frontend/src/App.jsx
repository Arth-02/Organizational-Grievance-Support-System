import { useState } from "react";
import { Counter } from "./components/Counter";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import Page from "./components/Page";

const port = import.meta.env.VITE_BASE_URL;

function App() {
  return (
    <>
      <BrowserRouter>
      <div>
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
