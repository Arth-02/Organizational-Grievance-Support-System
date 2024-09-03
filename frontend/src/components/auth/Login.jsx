import { useState } from "react";
import { Button } from "../ui/button";
import { Lock, User } from "lucide-react";
import { Link } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    let tempErrors = {};
    if (!username) tempErrors.username = "Username is required";
    if (!password) tempErrors.password = "Password is required";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log("Form submitted", { username, password });
    }
  };
  return (
    <>
      <div className="w-screen h-screen flex justify-center items-center p-1 md:p-3">
        <div className="w-full max-w-[950px] flex justify-center items-center bg-secondary/20 text-foreground p-5 px-5 md:px-10 rounded-xl">
          <img
            src="images/login-vector.png"
            alt="logo"
            className="h-[500px] hidden lg:block"
          />
          <div className="form-wrapper shadow-2xl px-5 md:px-8 max-w-[400px] w-full py-6 bg-background rounded-xl">
            <h1 className="text-center text-4xl font-bold mt-4 mb-8">
              Welcome!
            </h1>
            <form className="w-full md:min-w-[300px]" onSubmit={handleSubmit}>
              <div className="mb-6">
                <label
                  htmlFor="username"
                  className="block text-gray-700 font-semibold text-base mb-2"
                >
                  Username/email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="username"
                    className={`peer w-full pl-7 bg-transparent border-b-2 text-gray-700 focus:outline-none ${
                      errors.username
                        ? "border-red-500 text-red-500"
                        : "border-gray-300 focus:border-primary focus:text-primary"
                    }`}
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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
                  <p className="text-red-500 text-xs mt-1">{errors.username}</p>
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
                    type="password"
                    id="password"
                    className={`peer w-full pl-7 bg-transparent border-b-2 focus:outline-none ${
                        errors.password
                          ? "border-red-500 text-red-500"
                          : "border-gray-300 focus:border-primary focus:text-primary"
                      }`}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock className={`absolute left-0 top-[2px] h-5 w-5 ${
                      errors.password
                        ? "text-red-500"
                        : "text-gray-400 peer-focus:text-primary"
                    }`} />
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
            <div className="text-center my-4 flex justify-center items-center gap-3">
              <span className="border border-b w-1/3 h-0 bolck border-gray-400 translate-y-[2px]"></span>
              <span className="text-gray-600">or</span>
              <span className="border border-b w-1/3 h-0 bolck border-gray-400 translate-y-[2px]"></span>
            </div>
            <div className="text-center flex justify-center">
              <Link
                to={'/login'}
                className="font-bold text-xs text-primary hover:underline"
              >
                Register Organization
              </Link>  
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
