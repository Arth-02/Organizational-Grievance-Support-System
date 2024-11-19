// import * as React from "react"
// import { Check, ChevronDown, X } from "lucide-react"
// import { cn } from "@/lib/utils"
// import { useController } from "react-hook-form"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Badge } from "@/components/ui/badge"
// import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// const MultiSelect = React.forwardRef(({ 
//   label, 
//   options = [], 
//   control, 
//   name, 
//   rules,
//   placeholder = "Select options...",
//   className,
//   maxSelections,
// }, ref) => {
//   const [open, setOpen] = React.useState(false)

//   const {
//     field: { onChange, value = [] },
//     fieldState: { error }
//   } = useController({
//     name,
//     control,
//     rules,
//   })

//   const selectedValues = Array.isArray(value) ? value : []

//   const handleSelect = (itemValue) => {
//     const isSelected = selectedValues.includes(itemValue)
//     let newSelected

//     if (isSelected) {
//       newSelected = selectedValues.filter(id => id !== itemValue)
//     } else {
//       if (maxSelections && selectedValues.length >= maxSelections) {
//         return
//       }
//       newSelected = [...selectedValues, itemValue]
//     }

//     onChange(newSelected)
//   }

//   const handleRemove = (itemValue, e) => {
//     e.preventDefault()
//     e.stopPropagation()
//     const newSelected = selectedValues.filter(id => id !== itemValue)
//     onChange(newSelected)
//   }

//   const selectedOptions = options.filter(option => 
//     selectedValues.includes(option.value)
//   )

//   return (
//     <div className="space-y-1">
//       {label && (
//         <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
//           {label}
//         </label>
//       )}
      
//       <Popover open={open} onOpenChange={setOpen}>
//         <PopoverTrigger asChild>
//           <div
//             role="combobox"
//             ref={ref}
//             aria-expanded={open}
//             className={cn(
//               "flex min-h-10 w-full items-center justify-between rounded-md border border-input/50 bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none hover:bg-muted dark:hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50",
//               error ? "border-destructive" : "",
//               className
//             )}
//           >
//             <div className="flex flex-wrap gap-1">
//               {selectedOptions.map((option) => (
//                 <Badge
//                   key={option.value}
//                   variant="secondary"
//                   className="rounded-sm px-1 py-0 text-xs"
//                 >
//                   <div className="flex items-center gap-1 py-1">
//                     {option.avatar ? (
//                       <div className="flex items-center gap-1">
//                         <Avatar className="h-4 w-4">
//                           <AvatarImage src={option.avatar} alt={option.label} />
//                           <AvatarFallback>{option.label.slice(0, 2).toUpperCase()}</AvatarFallback>
//                         </Avatar>
//                         <span>{option.label}</span>
//                       </div>
//                     ) : (
//                       <span>{option.label}</span>
//                     )}
//                     <button
//                       className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
//                       onMouseDown={(e) => e.preventDefault()}
//                       onClick={(e) => handleRemove(option.value, e)}
//                     >
//                       <X className="h-3 w-3" />
//                     </button>
//                   </div>
//                 </Badge>
//               ))}
//               {selectedValues.length === 0 && (
//                 <span className="text-muted-foreground">{placeholder}</span>
//               )}
//             </div>
//             <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
//           </div>
//         </PopoverTrigger>
//         <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
//           <Command className="max-h-[300px] overflow-auto">
//             <CommandList>

//             <CommandGroup>
//               {options.map((option) => {
//                 const isSelected = selectedValues.includes(option.value)
//                 return (
//                   <CommandItem
//                     key={option.value}
//                     onSelect={() => handleSelect(option.value)}
//                     className="flex items-center gap-2 cursor-pointer"
//                   >
//                     <div className="flex h-4 w-4 items-center justify-center">
//                       {isSelected ? <Check className="h-4 w-4" /> : null}
//                     </div>
//                     {option.avatar ? (
//                       <div className="flex items-center gap-2">
//                         <Avatar className="h-6 w-6">
//                           <AvatarImage src={option.avatar} alt={option.label} />
//                           <AvatarFallback>{option.label.slice(0, 2).toUpperCase()}</AvatarFallback>
//                         </Avatar>
//                         <div className="flex flex-col">
//                           <span>{option.label}</span>
//                           {option.description && (
//                             <span className="text-muted-foreground text-xs">
//                               {option.description}
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     ) : (
//                       <span>{option.label}</span>
//                     )}
//                   </CommandItem>
//                 )
//               })}
//             </CommandGroup>
//             </CommandList>
//           </Command>
//         </PopoverContent>
//       </Popover>

//       {error && (
//         <p className="text-sm font-medium text-destructive">{error.message}</p>
//       )}
//     </div>
//   )
// })

// MultiSelect.displayName = "MultiSelect"

// export default MultiSelect


import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { Command as CommandPrimitive, useCommandState } from 'cmdk';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

// Helper function for debounce
const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// Helper functions for options management
const transToGroupOption = (options, groupBy) => {
  if (options.length === 0) return {};
  if (!groupBy) return { '': options };

  const groupOption = {};
  options.forEach(option => {
    const key = option[groupBy] || '';
    if (!groupOption[key]) groupOption[key] = [];
    groupOption[key].push(option);
  });
  return groupOption;
};

const removePickedOption = (groupOption, picked) => {
  const cloneOption = JSON.parse(JSON.stringify(groupOption));
  for (const [key, value] of Object.entries(cloneOption)) {
    cloneOption[key] = value.filter(val => !picked.find(p => p.value === val.value));
  }
  return cloneOption;
};

const isOptionsExist = (groupOption, targetOption) => {
  for (const [, value] of Object.entries(groupOption)) {
    if (value.some(option => targetOption.find(p => p.value === option.value))) {
      return true;
    }
  }
  return false;
};

// Custom CommandEmpty component
const CommandEmpty = React.forwardRef(({ className, ...props }, ref) => {
  const render = useCommandState(state => state.filtered.count === 0);
  if (!render) return null;
  
  return (
    <div 
      ref={ref}
      className={cn('py-6 text-center text-sm', className)}
    //   cmdk-empty=""
      role="presentation"
      {...props}
    />
  );
});

CommandEmpty.displayName = 'CommandEmpty';

// Main MultipleSelector component
const MultipleSelector = React.forwardRef(({
  value,
  onChange,
  placeholder,
  defaultOptions = [],
  options: arrayOptions,
  delay,
  onSearch,
  onSearchSync,
  loadingIndicator,
  emptyIndicator,
  maxSelected = Number.MAX_SAFE_INTEGER,
  onMaxSelected,
  hidePlaceholderWhenSelected,
  disabled,
  groupBy,
  className,
  badgeClassName,
  selectFirstItem = true,
  creatable = false,
  triggerSearchOnFocus = false,
  commandProps,
  inputProps,
  hideClearAllButton = false,
  renderOption, // New prop for custom option rendering
}, ref) => {
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [open, setOpen] = React.useState(false);
  const [onScrollbar, setOnScrollbar] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selected, setSelected] = React.useState(value || []);
  const [options, setOptions] = React.useState(transToGroupOption(defaultOptions, groupBy));
  const [inputValue, setInputValue] = React.useState('');
  const debouncedSearchTerm = useDebounce(inputValue, delay);

  // Imperative handle
  React.useImperativeHandle(ref, () => ({
    selectedValue: [...selected],
    input: inputRef.current,
    focus: () => inputRef?.current?.focus(),
    reset: () => setSelected([])
  }), [selected]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setOpen(false);
        inputRef.current.blur();
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchend', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchend', handleClickOutside);
    };
  }, [open]);

  // Value sync effect
  useEffect(() => {
    if (value) setSelected(value);
  }, [value]);

  // Options sync effect
  useEffect(() => {
    if (!arrayOptions || onSearch) return;
    const newOption = transToGroupOption(arrayOptions || [], groupBy);
    if (JSON.stringify(newOption) !== JSON.stringify(options)) {
      setOptions(newOption);
    }
  }, [arrayOptions, groupBy, onSearch, options]);

  // Search effects
  useEffect(() => {
    const doSearchSync = () => {
      const res = onSearchSync?.(debouncedSearchTerm);
      setOptions(transToGroupOption(res || [], groupBy));
    };

    if (!onSearchSync || !open) return;
    if (triggerSearchOnFocus || debouncedSearchTerm) {
      doSearchSync();
    }
  }, [debouncedSearchTerm, groupBy, open, triggerSearchOnFocus, onSearchSync]);

  useEffect(() => {
    const doSearch = async () => {
      setIsLoading(true);
      const res = await onSearch?.(debouncedSearchTerm);
      setOptions(transToGroupOption(res || [], groupBy));
      setIsLoading(false);
    };

    if (!onSearch || !open) return;
    if (triggerSearchOnFocus || debouncedSearchTerm) {
      doSearch();
    }
  }, [debouncedSearchTerm, groupBy, open, triggerSearchOnFocus, onSearch]);

  const handleUnselect = useCallback((option) => {
    const newOptions = selected.filter(s => s.value !== option.value);
    setSelected(newOptions);
    onChange?.(newOptions);
  }, [onChange, selected]);

  const handleKeyDown = useCallback((e) => {
    const input = inputRef.current;
    if (input) {
      if ((e.key === 'Delete' || e.key === 'Backspace') && input.value === '' && selected.length > 0) {
        const lastSelectOption = selected[selected.length - 1];
        if (!lastSelectOption.fixed) {
          handleUnselect(selected[selected.length - 1]);
        }
      }
      if (e.key === 'Escape') {
        input.blur();
      }
    }
  }, [handleUnselect, selected]);

  const CreatableItem = () => {
    if (!creatable || 
        isOptionsExist(options, [{ value: inputValue, label: inputValue }]) || 
        selected.find(s => s.value === inputValue)) {
      return null;
    }

    const Item = (
      <CommandItem
        value={inputValue}
        className="cursor-pointer"
        onMouseDown={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onSelect={value => {
          if (selected.length >= maxSelected) {
            onMaxSelected?.(selected.length);
            return;
          }
          setInputValue('');
          const newOptions = [...selected, { value, label: value }];
          setSelected(newOptions);
          onChange?.(newOptions);
        }}
      >
        {`Create "${inputValue}"`}
      </CommandItem>
    );

    if ((!onSearch && inputValue.length > 0) || 
        (onSearch && debouncedSearchTerm.length > 0 && !isLoading)) {
      return Item;
    }

    return null;
  };

  const EmptyItem = useCallback(() => {
    if (!emptyIndicator) return null;

    if (onSearch && !creatable && Object.keys(options).length === 0) {
      return (
        <CommandItem value="-" disabled>
          {emptyIndicator}
        </CommandItem>
      );
    }

    return <CommandEmpty>{emptyIndicator}</CommandEmpty>;
  }, [creatable, emptyIndicator, onSearch, options]);

  const selectables = useMemo(() => 
    removePickedOption(options, selected),
    [options, selected]
  );

  const commandFilter = useCallback(() => {
    if (commandProps?.filter) return commandProps.filter;
    
    if (creatable) {
      return (value, search) => 
        value.toLowerCase().includes(search.toLowerCase()) ? 1 : -1;
    }
    
    return undefined;
  }, [creatable, commandProps?.filter]);

  const handleSelect = useCallback((option) => {
    if (selected.length >= maxSelected) {
      onMaxSelected?.(selected.length);
      return;
    }
    const newOptions = [...selected, option];
    setSelected(newOptions);
    onChange?.(newOptions);
  }, [maxSelected, onChange, onMaxSelected, selected]);

  const renderDefaultOption = useCallback(
    (option) => (
      <CommandItem
        key={option.value}
        value={option.value}
        onSelect={() => handleSelect(option)}
        className="cursor-pointer"
      >
        {option.label}
      </CommandItem>
    ),
    [handleSelect]
  );

  const wrappedRenderOption = (option) => {
    if (renderOption) {
      return renderOption(option, handleSelect);
    }
    return renderDefaultOption(option);
  };


  return (
    <Command
      ref={dropdownRef}
      {...commandProps}
      onKeyDown={e => {
        handleKeyDown(e);
        commandProps?.onKeyDown?.(e);
      }}
      className={cn('h-auto overflow-visible bg-transparent', commandProps?.className)}
      shouldFilter={commandProps?.shouldFilter !== undefined ? commandProps.shouldFilter : !onSearch}
      filter={commandFilter()}
    >
      <div
        className={cn(
          'min-h-10 rounded-md border border-input text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          {
            'px-3 py-2': selected.length !== 0,
            'cursor-text': !disabled && selected.length !== 0,
          },
          className
        )}
        onClick={() => {
          if (!disabled) inputRef?.current?.focus();
        }}
      >
        <div className="relative flex flex-wrap gap-1">
          {selected.map(option => (
            <Badge
              key={option.value}
              className={cn(
                'data-[disabled]:bg-muted-foreground data-[disabled]:text-muted data-[disabled]:hover:bg-muted-foreground',
                'data-[fixed]:bg-muted-foreground data-[fixed]:text-muted data-[fixed]:hover:bg-muted-foreground',
                badgeClassName
              )}
              data-fixed={option.fixed}
              data-disabled={disabled || undefined}
            >
              {option.label}
              <button
                className={cn(
                  'ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  (disabled || option.fixed) && 'hidden'
                )}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleUnselect(option);
                }}
                onMouseDown={e => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => handleUnselect(option)}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          ))}
          
          <CommandPrimitive.Input
            {...inputProps}
            ref={inputRef}
            value={inputValue}
            disabled={disabled}
            onValueChange={value => {
              setInputValue(value);
              inputProps?.onValueChange?.(value);
            }}
            onBlur={event => {
              if (!onScrollbar) setOpen(false);
              inputProps?.onBlur?.(event);
            }}
            onFocus={event => {
              setOpen(true);
              triggerSearchOnFocus && onSearch?.(debouncedSearchTerm);
              inputProps?.onFocus?.(event);
            }}
            placeholder={hidePlaceholderWhenSelected && selected.length !== 0 ? '' : placeholder}
            className={cn(
              'flex-1 bg-transparent outline-none placeholder:text-muted-foreground',
              {
                'w-full': hidePlaceholderWhenSelected,
                'px-3 py-2': selected.length === 0,
                'ml-1': selected.length !== 0,
              },
              inputProps?.className
            )}
          />
          
          <button
            type="button"
            onClick={() => {
              setSelected(selected.filter(s => s.fixed));
              onChange?.(selected.filter(s => s.fixed));
            }}
            className={cn(
              'absolute right-0 h-6 w-6 p-0',
              (hideClearAllButton ||
                disabled ||
                selected.length < 1 ||
                selected.filter(s => s.fixed).length === selected.length) &&
              'hidden'
            )}
          >
            <X />
          </button>
        </div>
      </div>
      
      <div className="relative">
        {open && (
          <CommandList
            className="absolute top-1 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in"
            onMouseLeave={() => setOnScrollbar(false)}
            onMouseEnter={() => setOnScrollbar(true)}
            onMouseUp={() => inputRef?.current?.focus()}
          >
            {isLoading ? (
              <>{loadingIndicator}</>
            ) : (
              <>
                <EmptyItem />
                <CreatableItem />
                {!selectFirstItem && <CommandItem value="-" className="hidden" />}
                {Object.entries(selectables).map(([key, dropdowns]) => (
                  <CommandGroup key={key} heading={key} className="h-full overflow-auto">
                    {dropdowns.map(option => (
                      wrappedRenderOption(option)
                    ))}
                  </CommandGroup>
                ))}
              </>
            )}
          </CommandList>
        )}
      </div>
    </Command>
  );
});

MultipleSelector.displayName = 'MultipleSelector';
export default MultipleSelector;