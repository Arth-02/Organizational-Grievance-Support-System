import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, error, ...props }, ref) => {
  return (
    <>
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border bg-transparent px-3 py-2 text-sm transition-colors duration-200",
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
  )
})
Textarea.displayName = "Textarea"

const CustomTextarea = React.forwardRef(({ label, error, ...props }, ref) => (
  <div className="space-y-1.5">
    {label && (
      <label htmlFor={props.id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
    )}
    <Textarea ref={ref} error={error} className="bg-muted/30" {...props} />
  </div>
))
CustomTextarea.displayName = 'CustomTextarea'

export { Textarea, CustomTextarea }
