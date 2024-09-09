import * as React from "react"

import { cn } from "@/lib/utils"

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

const CustomInput = React.forwardRef(({ label, error, ...props }, ref) => (
  <div className="space-y-1">
    <label htmlFor={props.id} className="block text-sm font-medium">
      {label}
    </label>
    <Input ref={ref} error={error} className={"bg-secondary/15"} {...props} />
  </div>
));
CustomInput.displayName = 'CustomInput';

export { Input, CustomInput }
