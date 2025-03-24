import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/70",
        outline:
          "border border-input/50 bg-background hover:bg-accent hover:text-accent-foreground dark:hover:bg-muted/70",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        ghost: "hover:bg-accent hover:text-gray-800 dark:text-gray-200 dark:hover:bg-muted/70 focus-visible:ring-0 focus-visible:ring-offset-0",
        link: "text-primary underline-offset-4 hover:underline",
        "outline-destructive": "border border-destructive text-destructive hover:bg-destructive/10",
      },
      size: {
        default: "h-10 px-4 py-2",
        xs: "h-8 rounded-md px-[6px]",
        sm: "h-9 rounded-md px-[10px]",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      type="button"
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants }
