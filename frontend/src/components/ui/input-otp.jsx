import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"

import { cn } from "@/lib/utils"

const InputOTP = React.forwardRef(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn("flex items-center gap-2 has-[:disabled]:opacity-50", containerClassName)}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props} />
))
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-md border bg-secondary/15 text-sm transition-all",
        isActive && "z-10 ring-2 ring-primary",
        className
      )}
      {...props}>
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-primary duration-1000" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const CustomOTPInput = React.forwardRef(({ label, error, maxLength = 6, ...props }, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium">
          {label}
        </label>
      )}
      <InputOTP
        maxLength={maxLength}
        ref={ref}
        {...props}
      >
        <InputOTPGroup className="gap-2">
          {[...Array(maxLength)].map((_, index) => (
            <InputOTPSlot key={index} index={index} />
          ))}
        </InputOTPGroup>
      </InputOTP>
      {error && (
        <p className="mt-1 text-xs text-red-500">{error.message}</p>
      )}
    </div>
  )
})

CustomOTPInput.displayName = "CustomOTPInput"

export { InputOTP, InputOTPGroup, InputOTPSlot, CustomOTPInput }