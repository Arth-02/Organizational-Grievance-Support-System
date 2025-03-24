import { useState } from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ActionComboBoxButton({
  buttonLabel,
  buttonIcon: Icon,
  options = [],
  onSelect,
  shouldShowUserAvatar = false,
  multiSelect = false,
  selectedOptions: initialSelectedOptions = [], // Allow passing initial selected options
}) {
  const [open, setOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState(
    initialSelectedOptions
  );

  const handleSelect = (option) => {
    const isAlreadySelected = selectedOptions.some(
      (selected) => selected.value === option.value
    );

    let newSelectedOptions;
    if (isAlreadySelected) {
      // Remove if already selected
      newSelectedOptions = selectedOptions.filter(
        (selected) => selected.value !== option.value
      );
    } else {
      // Add if not selected
      if (multiSelect) {
        newSelectedOptions = [...selectedOptions, option];
      } else {
        newSelectedOptions = [option];
      }
    }

    setSelectedOptions(newSelectedOptions);

    if (!multiSelect) {
      // Close the dropdown if not in multi-select mode and send the selected option instead of the array
      setOpen(false);
      return onSelect(newSelectedOptions[0]);
    }
    onSelect(newSelectedOptions);
  };

  const removeSelectedOption = (optionToRemove) => {
    const newSelectedOptions = selectedOptions.filter(
      (option) => option.value !== optionToRemove.value
    );
    setSelectedOptions(newSelectedOptions);
    onSelect(newSelectedOptions);
  };

  const renderButtonContent = () => {
    if (!multiSelect) {
      return (
        <>
          {Icon && <Icon className="h-4 w-4 mr-2" />}
          {buttonLabel}
        </>
      );
    }

    // Multi-select mode button content
    if (selectedOptions.length === 0) {
      return (
        <>
          {Icon && <Icon className="h-4 w-4 mr-2" />}
          {buttonLabel}
        </>
      );
    }

    return (
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        <span>
          {buttonLabel} ({selectedOptions.length})
        </span>
      </div>
    );
  };

  // Filter out already selected options from the dropdown
  const availableOptions = options.filter(
    (option) =>
      !selectedOptions.some((selected) => selected.value === option.value)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-black/5 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700/50"
          onClick={() => setOpen(!open)}
        >
          {renderButtonContent()}
        </Button>
      </PopoverTrigger>

      <PopoverContent asChild className="w-[300px] p-0">
        <Command className="bg-white hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-900">
          <CommandInput
            placeholder={`Search ${buttonLabel.toLowerCase()}...`}
          />
          <CommandList>
            {/* Show selected items at the top */}
            {multiSelect && selectedOptions.length > 0 && (
              <>
                <CommandGroup heading="Selected" className="mb-2">
                  {selectedOptions.map((option) => (
                    <CommandItem
                      key={`selected-${option.value}`}
                      value={option.value}
                      onSelect={() => removeSelectedOption(option)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        {shouldShowUserAvatar && (
                          <Avatar className="mr-2">
                            <AvatarImage
                              src={option.image}
                              alt={option.label}
                            />
                            <AvatarFallback>
                              {option.label.toUpperCase()[0]}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex flex-col gap-[2px]">
                          <span className="font-medium">{option.label}</span>
                          {option.email && (
                            <span className="text-xs max-w-[190px] truncate text-gray-500 dark:text-slate-400">
                              {option.email}
                            </span>
                          )}
                        </div>
                      </div>
                      <X className="ml-auto h-4 w-4 text-red-500" />
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator className="w-[95%] bg-slate-600/90 m-auto" />
              </>
            )}

            {/* Available options to select */}
            <CommandEmpty>No items found.</CommandEmpty>
            <CommandGroup heading="Others">
              {availableOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center">
                    {shouldShowUserAvatar && (
                      <Avatar className="mr-2">
                        <AvatarImage src={option.image} alt={option.label} />
                        <AvatarFallback>
                          {option.label.toUpperCase()[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex flex-col gap-[2px]">
                      <span className="font-medium">{option.label}</span>
                      {option.email && (
                        <span className="text-xs max-w-[190px] truncate text-gray-500 dark:text-slate-400">
                          {option.email}
                        </span>
                      )}
                    </div>
                  </div>
                  {multiSelect && (
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedOptions.some(
                          (selected) => selected.value === option.value
                        )
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
