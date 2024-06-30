import { toast } from "react-toastify";
import api from "./api";

export const login = async (email, password) => {
  try {
    const response = await api.post("/users/login/", {
      email,
      password,
    });
    if (response.status === 200) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem(
        "isAdmin",
        response.data.role === "admin" ? "true" : "false"
      );
      toast.success("Login successful");
      return true;
    } else {
        console.log(response)
      const errorMessage = response.data.message || "An error occurred. Please try again.";
      toast.error(errorMessage);
    }
  } catch (error) {
    throw error;
  }
};
