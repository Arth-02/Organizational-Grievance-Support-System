import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import { Lock, User, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { loginSchema } from "@/validators/users";
import { useUserLoginMutation } from "@/services/auth.service";
import AuthLayout from "./AuthLayout";
import AnimatedSection from "@/components/page/landing/components/AnimatedSection";

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
          navigate("/dashboard");
        } else {
          toast.error("You are not authorized to access the page!");
          navigate("/login");
        }
      } else {
        toast.error("Something went wrong! Please try again later.");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <AuthLayout
      illustration="/images/login-vector.png"
      illustrationAlt="Login illustration"
      showBackLink={true}
    >
      {/* Heading with design system typography */}
      <AnimatedSection animation="fade-up" delay={0}>
        <h1 className="text-center text-4xl font-bold text-foreground mb-2">
          Welcome!
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Sign in to your account to continue
        </p>
      </AnimatedSection>

      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Username/Email Field */}
        <AnimatedSection animation="fade-up" delay={100}>
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="block text-sm font-semibold text-foreground"
            >
              Username / Email
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <User
                  size={18}
                  className={
                    errors.username
                      ? "text-red-500"
                      : "text-muted-foreground"
                  }
                  aria-hidden="true"
                />
              </div>
              <input
                disabled={isLoading}
                type="text"
                id="username"
                className={`
                  w-full h-11 pl-10 pr-4 rounded-lg border bg-muted/30
                  text-foreground placeholder:text-muted-foreground
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                  disabled:cursor-not-allowed disabled:opacity-50
                  ${
                    errors.username
                      ? "border-red-500 focus:border-red-500"
                      : "border-border hover:border-muted-foreground/50 focus:border-primary"
                  }
                `}
                placeholder="Enter your username or email"
                aria-required="true"
                aria-invalid={errors.username ? "true" : "false"}
                aria-describedby="username-error"
                {...register("username")}
              />
            </div>
            <div
              id="username-error"
              className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              {errors.username && (
                <>
                  <AlertCircle size={14} aria-hidden="true" />
                  <span>{errors.username.message}</span>
                </>
              )}
            </div>
          </div>
        </AnimatedSection>

        {/* Password Field */}
        <AnimatedSection animation="fade-up" delay={200}>
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-foreground"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock
                  size={18}
                  className={
                    errors.password
                      ? "text-red-500"
                      : "text-muted-foreground"
                  }
                  aria-hidden="true"
                />
              </div>
              <input
                disabled={isLoading}
                type={showPassword ? "text" : "password"}
                id="password"
                className={`
                  w-full h-11 pl-10 pr-12 rounded-lg border bg-muted/30
                  text-foreground placeholder:text-muted-foreground
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                  disabled:cursor-not-allowed disabled:opacity-50
                  ${
                    errors.password
                      ? "border-red-500 focus:border-red-500"
                      : "border-border hover:border-muted-foreground/50 focus:border-primary"
                  }
                `}
                placeholder="Enter your password"
                aria-required="true"
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby="password-error"
                {...register("password")}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="
                  absolute right-3 top-1/2 -translate-y-1/2
                  p-1 rounded-md
                  text-muted-foreground hover:text-foreground
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                  transition-colors duration-200
                "
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff size={18} aria-hidden="true" />
                ) : (
                  <Eye size={18} aria-hidden="true" />
                )}
              </button>
            </div>
            <div
              id="password-error"
              className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              {errors.password && (
                <>
                  <AlertCircle size={14} aria-hidden="true" />
                  <span>{errors.password.message}</span>
                </>
              )}
            </div>
          </div>
        </AnimatedSection>

        {/* Submit Button */}
        <AnimatedSection animation="fade-up" delay={300}>
          <Button
            type="submit"
            className="w-full h-11"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Signing in...</span>
              </span>
            ) : (
              "Sign In"
            )}
          </Button>
        </AnimatedSection>
      </form>

      {/* Divider */}
      <AnimatedSection animation="fade-up" delay={400}>
        <div className="flex items-center gap-4 my-6">
          <span className="flex-1 h-px bg-border" aria-hidden="true" />
          <span className="text-sm text-muted-foreground">or</span>
          <span className="flex-1 h-px bg-border" aria-hidden="true" />
        </div>
      </AnimatedSection>

      {/* Register Link */}
      <AnimatedSection animation="fade-up" delay={500}>
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          >
            Register Organization
          </Link>
        </p>
      </AnimatedSection>
    </AuthLayout>
  );
};

export default Login;
