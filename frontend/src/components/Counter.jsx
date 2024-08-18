import React, { useEffect, useState } from "react";
import { useUserLoginMutation } from "../services/user.service";
import { saveToLocalStorage } from "../utils";

export function Counter() {
  const [user, setUser] = useState(null);
  const form = {
    email: "test@test.com",
    password: "1234567",
  };

  // console.log('Form:', form)

  const [login, { isLoading, isError, isSuccess }] = useUserLoginMutation();

  const handleSubmit = async () => {
    try {
      const result = await login(form);
      setUser(result.data);
      saveToLocalStorage("user", result.data);
      // usedispatch(setUserDetails(result.data));
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
