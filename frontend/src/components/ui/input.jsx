import * as React from "react"

import { cn } from "@/lib/utils"
import { Eye, EyeOff } from "lucide-react";

const Input = React.forwardRef(({ className, type, error, ...props }, ref) => {
  return (
    <>
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border bg-transparent px-3 py-2 text-sm transition-colors duration-200",
          "placeholder:text-muted-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "focus:outline-none focus:ring-2 focus:ring-primary/20",
          error
            ? "border-red-500 focus:border-red-500"
            : "border-border hover:border-muted-foreground/50 focus:border-primary",
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
    <div className="space-y-1.5 relative">
      <label htmlFor={props.id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <Input
          ref={ref}
          error={error}
          type={showPassword && type === "password" ? "text" : type}
          className="bg-muted/30"
          {...props}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute top-2.5 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        )}
      </div>
    </div>
  );
});
CustomInput.displayName = "CustomInput";

export { Input, CustomInput };