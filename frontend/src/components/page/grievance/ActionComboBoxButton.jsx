import { useState } from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ActionComboBoxButton({
  buttonLabel,
  buttonIcon: Icon,
  options = [],
  onSelect,
  shouldShowUserAvatar = false,
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-black/5 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700/50"
          onClick={() => setOpen(!open)}
        >
          {Icon && <Icon className="h-4 w-4 mr-2" />}
          {buttonLabel}
        </Button>
      </PopoverTrigger>

      <PopoverContent asChild className="w-[300px] p-0">
        <Command className="bg-white hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-900">
          <CommandInput
            placeholder={`Search ${buttonLabel.toLowerCase()}...`}
          />
          <CommandList>
            <CommandEmpty>No items found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onSelect(option);
                    setOpen(false);
                  }}
                >
                  {shouldShowUserAvatar && (
                    <Avatar className="mr-2">
                      <AvatarImage src={option.image} alt={option.label} />
                      <AvatarFallback>{option.label.toUpperCase()[0]}</AvatarFallback>
                    </Avatar>
                  )}
                  <span>{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
