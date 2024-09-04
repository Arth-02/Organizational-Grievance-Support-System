import React, { useEffect, useState } from "react";
import { useUserLoginMutation } from "../services/api.service";
import { saveToLocalStorage } from "../utils";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

export function Counter() {
  

  return (
    <div>
      <h1>hey</h1>
      <Button variant="outline" >Test</Button>
      <Link to="/page">Page</Link>
      <Link to="/login">Login</Link>
    </div>
  );
}
