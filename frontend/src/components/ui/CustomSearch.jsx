import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, X } from "lucide-react";
import debounce from "lodash/debounce";

const AdvancedSearch = ({ onSearch, searchOptions }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);

  // Automatically select the only option if there is just one
  useEffect(() => {
    if (searchOptions?.length === 1) {
      setSelectedOption(searchOptions[0]);
    }
  }, [searchOptions]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((option, term) => {
      onSearch(option, term);
    }, 500),
    [onSearch]
  );

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setSearchTerm("");
  };

  const handleClearSearch = () => {
    onSearch(selectedOption?.value, "");
    setSelectedOption(null);
    setSearchTerm("");
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (selectedOption) {
      debouncedSearch(selectedOption.value, e.target.value);
    }
  };

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <div
      className={`relative flex items-center h-9 rounded-lg border border-border bg-transparent text-sm transition-all duration-200 ${
        selectedOption ? "px-3 pr-1 w-[350px]" : "px-1 w-[250px]"
      }`}
    >
      {selectedOption ? (
        <div className="flex items-center gap-2 w-full">
          <span className="text-sm font-medium text-nowrap text-muted-foreground">
            {selectedOption.label}:
          </span>
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            autoFocus
            className="border-none bg-transparent shadow-none focus-visible:ring-0 focus:ring-0 focus:border-none min-w-48 px-1 py-0 h-7"
          />
          {searchOptions?.length > 1 && (
            <button
              onClick={handleClearSearch}
              className="p-1 hover:bg-muted rounded-md transition-colors"
            >
              <X size={16} className="text-muted-foreground" />
            </button>
          )}
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full h-full focus:outline-none border-none bg-transparent flex items-center gap-2 px-2">
            <Search size={16} className="text-muted-foreground" />
            <span className="text-muted-foreground">Search...</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-64">
            {searchOptions?.map((option) => (
              <DropdownMenuItem
                key={option.value}
                className="cursor-pointer"
                onSelect={() => handleOptionSelect(option)}
              >
                <div className="flex items-center gap-2">
                  {option.icon}
                  <span className="font-medium">{option.label}</span>
                  <span className="text-muted-foreground">:</span>
                  <span className="text-xs text-muted-foreground">
                    {option.example}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default AdvancedSearch;
