import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const DatePicker = React.forwardRef(({ 
  error,
  label,
  value,
  onChange,
  placeholder = "Pick a date",
  buttonClassName,
  calendarClassName,
  dateFormat = "PPP",
  disabledDays = [],
  ...props 
}, ref) => {
  const [date, setDate] = React.useState(value)

  React.useEffect(() => {
    setDate(value)
  }, [value])

  const handleDateSelect = (newDate) => {
    setDate(newDate)
    onChange?.(newDate)
  }

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium">
          {label}
        </label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              error && "border-red-500 focus:border-red-500",
              buttonClassName
            )}
            {...props}
          >
            <CalendarIcon className="w-5 h-5 mr-2" />
            {date ? format(date, dateFormat) : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("w-auto p-0", calendarClassName)}>
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            disabled={disabledDays}
          />
        </PopoverContent>
      </Popover>
      {error && (
        <p className="mt-1 text-xs text-red-500">{error.message}</p>
      )}
    </div>
  )
})

DatePicker.displayName = "DatePicker"

// Example usage of basic DatePicker
const BasicDatePicker = React.forwardRef(({ label, error, ...props }, ref) => {
  return (
    <DatePicker
      ref={ref}
      label={label}
      error={error}
      buttonClassName="bg-secondary/15 dark:bg-black"
      {...props}
    />
  )
})

BasicDatePicker.displayName = "BasicDatePicker"

export { DatePicker, BasicDatePicker }
