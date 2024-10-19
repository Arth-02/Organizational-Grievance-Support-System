import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import { Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUserLoginMutation } from "@/services/api.service";
import { toast } from "react-hot-toast";
import { loginSchema } from "@/validators/users";

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const [login, { isLoading }] = useUserLoginMutation();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = React.useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  const onSubmit = async (data) => {
    try {
      const { username, password } = data;
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);
      const loginData = isEmail
        ? { email: username, password }
        : { username, password };

      const response = await login(loginData).unwrap();
      if (response) {
        toast.success("Login successful!");
        if (response.role.name) {

          navigate("/");
        } else {
          toast.error("You are not authorized to access the page!");
          navigate("/login");
        }
      } else {
        toast.error("Something went wrong! Please try again later.");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
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
                  className={`peer w-full pl-7 pb-[2px] bg-transparent border-b-2 text-gray-700 focus:outline-none ${
                    errors.username
                      ? "border-red-500 text-red-500"
                      : "border-gray-300 focus:border-primary focus:text-primary"
                  }`}
                  placeholder="Username or Email"
                  {...register("username")}
                />
                <User
                  size={19}
                  className={`absolute left-0 top-[4px] ${
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
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className={`peer w-full pb-[2px] pl-7 bg-transparent border-b-2 focus:outline-none ${
                    errors.password
                      ? "border-red-500 text-red-500"
                      : "border-gray-300 focus:border-primary focus:text-primary"
                  }`}
                  placeholder="Password"
                  {...register("password")}
                />
                <Lock
                  size={19}
                  className={`absolute left-0 top-[4px] ${
                    errors.password
                      ? "text-red-500"
                      : "text-gray-400 peer-focus:text-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-1 top-[4px] text-gray-400 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
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
                  <Loader2 className="animate-spin" />
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
              to={"/register"}
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
