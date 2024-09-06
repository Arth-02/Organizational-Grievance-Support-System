import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { Loader, Lock, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUserLoginMutation } from "@/services/api.service";
import { saveToLocalStorage } from "@/utils";
import { toast } from "react-hot-toast";

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [login, { isLoading }] = useUserLoginMutation();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const { username, password } = data;
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);
      const loginData = isEmail
        ? { email: username, password }
        : { username, password };

      const response = await login(loginData).unwrap();
      console.log(response);
      if (response.success) {
        toast.success(response.message);
        saveToLocalStorage("user", response);
        navigate("/");
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="w-screen h-screen flex justify-center items-center p-1 md:p-3">
      <div className="w-full max-w-[950px] flex justify-center items-center bg-secondary/20 text-foreground p-5 px-5 md:px-10 rounded-xl">
        <img
          src="images/login-vector.png"
          alt="logo"
          className="h-[500px] hidden lg:block"
        />
        <div className="form-wrapper shadow-2xl px-5 md:px-8 max-w-[400px] w-full py-6 bg-background rounded-xl">
          <h1 className="text-center text-4xl font-bold mt-4 mb-8">Welcome!</h1>
          <form
            className="w-full md:min-w-[300px]"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="mb-6">
              <label
                htmlFor="username"
                className="block text-gray-700 font-semibold text-base mb-2"
              >
                Username / Email
              </label>
              <div className="relative">
                <input
                  disabled={isLoading}
                  type="text"
                  id="username"
                  className={`peer w-full pl-7 bg-transparent border-b-2 text-gray-700 focus:outline-none ${
                    errors.username
                      ? "border-red-500 text-red-500"
                      : "border-gray-300 focus:border-primary focus:text-primary"
                  }`}
                  placeholder="Username or Email"
                  {...register("username", {
                    required: "Username or Email is required",
                  })}
                />
                <User
                  className={`absolute left-0 top-[2px] h-5 w-5 ${
                    errors.username
                      ? "text-red-500"
                      : "text-gray-400 peer-focus:text-primary"
                  }`}
                />
              </div>
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.username.message}
                </p>
              )}
            </div>
            <div className="mb-8">
              <label
                htmlFor="password"
                className="block text-gray-700 font-semibold text-base mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  disabled={isLoading}
                  type="password"
                  id="password"
                  className={`peer w-full pl-7 bg-transparent border-b-2 focus:outline-none ${
                    errors.password
                      ? "border-red-500 text-red-500"
                      : "border-gray-300 focus:border-primary focus:text-primary"
                  }`}
                  placeholder="Password"
                  {...register("password", {
                    required: "Password is required",
                  })}
                />
                <Lock
                  className={`absolute left-0 top-[2px] h-5 w-5 ${
                    errors.password
                      ? "text-red-500"
                      : "text-gray-400 peer-focus:text-primary"
                  }`}
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full">
              {isLoading ? (
                <span>
                  <Loader />
                </span>
              ) : (
                "Login"
              )}
            </Button>
          </form>
          <div className="text-center my-4 flex justify-center items-center gap-3">
            <span className="border border-b w-1/3 h-0 block border-gray-400 translate-y-[2px]"></span>
            <span className="text-gray-600">or</span>
            <span className="border border-b w-1/3 h-0 block border-gray-400 translate-y-[2px]"></span>
          </div>
          <div className="text-center flex justify-center">
            <Link
              to={"/login"}
              className="font-bold text-xs text-primary hover:underline"
            >
              Register Organization
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
