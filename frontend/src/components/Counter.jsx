import React, { useEffect, useState } from "react";
import { useUserLoginMutation } from "../services/user.service";
import { useDispatch } from "react-redux";

export function Counter() {
  const [user, setUser] = useState(null);
  const usedispatch = useDispatch();
  const form = {
    email: "justicejunction1111@gmail.com",
    password: "1234567",
  };

  // console.log('Form:', form)

  const [login, { isLoading, isError, isSuccess }] = useUserLoginMutation();

  const handleSubmit = async () => {
    try {
      const result = await login(form);
      setUser(result.data);
      usedispatch(setUserDetails("user",result.data));
    } catch (error) {
      console.log("Error:", error);
    }
  };

  useEffect(() => {
    handleSubmit();
  }, []);
  console.log("User:", user);

  return (
    <div>
      <h1>hey</h1>
    </div>
  );
}
