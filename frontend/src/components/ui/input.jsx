import * as React from "react"

import { cn } from "@/lib/utils"
import { Eye, EyeOff } from "lucide-react";

const Input = React.forwardRef(({ className, type, error, ...props }, ref) => {
  return (
    <>
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm transition-colors duration-200",
          "placeholder:text-muted-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "focus:outline-none",
          error
            ? "border-red-500 focus:border-red-500"
            : "border-gray-300 focus:border-primary",
          className
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-red-500">{error.message}</p>
      )}
    </>
  );
});
Input.displayName = "Input";

const CustomInput = React.forwardRef(({ label, error, type, ...props }, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  return (
    <div className="space-y-1 relative">
      <label htmlFor={props.id} className="block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <Input
          ref={ref}
          error={error}
          type={showPassword && type === "password" ? "text" : type}
          className={"bg-secondary/15"}
          {...props}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute top-2 right-2 flex items-center text-sm leading-5"
          >
            {showPassword ? (
              <EyeOff className="text-gray-400" size={20} />
            ) : (
              <Eye className="text-gray-400" size={20} />
            )}
          </button>
        )}
      </div>
    </div>
  );
});
CustomInput.displayName = "CustomInput";

export { Input, CustomInput };