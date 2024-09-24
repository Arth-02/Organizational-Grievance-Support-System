import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef(({ className, error, ...props }, ref) => {
  return (
    <>
      <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
          "peer h-[18px] w-[18px] shrink-0 rounded-sm border bg-background transition-colors duration-200",
          "focus:outline-none data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:border-primary",
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
          <Check className="h-4 w-4" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {error && (
        <p className="mt-1 text-xs text-red-500">{error.message}</p>
      )}
    </>
  )
})
Checkbox.displayName = CheckboxPrimitive.Root.displayName

const CustomCheckbox = React.forwardRef(({ className, label, error, ...props }, ref) => (
  <div className="flex items-center space-x-2">
    <Checkbox ref={ref} error={error} className={cn("mt-1", className)} {...props} />
    <div className="grid gap-1.5 leading-none">
      <label
        htmlFor={props.id}
        className="text-sm select-none leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
      >
        {label}
      </label>
    </div>
  </div>
))
CustomCheckbox.displayName = 'CustomCheckbox'

export { Checkbox, CustomCheckbox }
