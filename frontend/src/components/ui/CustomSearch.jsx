import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { X } from "lucide-react";
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
      className={`relative flex items-center justify-around h-9 rounded-md border dark:border-input/50 bg-background py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all duration-300 ease-in-out ${
        selectedOption ? "px-3 pr-1 w-[350px]" : " px-1 w-[250px]"
      }`}
    >
      {selectedOption ? (
        <div className="flex items-center gap-2 w-full">
          <span className="text-sm font-medium text-nowrap">
            {selectedOption.label} :{" "}
          </span>
          <Input
            placeholder="Search"
            value={searchTerm}
            onChange={handleSearchChange}
            autoFocus
            className={`border-none bg-transparent focus:outline-none min-w-48 px-1 py-0`}
          />
          {searchOptions?.length > 1 && (
            <X
              size={20}
              className="w-9 h-7 cursor-pointer p-1 hover:bg-secondary/30 rounded-md transition-all duration-300"
              onClick={handleClearSearch}
            />
          )}
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full focus:outline-none border-none bg-transparent">
            <Input
              placeholder="Search"
              value={searchTerm}
              onChange={handleSearchChange}
              className="border-none bg-transparent focus:outline-none w-full h-full"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="text-nowrap min-w-64">
            {searchOptions?.map((option) => (
              <DropdownMenuItem
                key={option.value}
                className={"cursor-pointer"}
                onSelect={() => handleOptionSelect(option)}
              >
                <div className="flex items-center hover:bg-secondary/15 px-1 py-1 rounded-md">
                  {option.icon}
                  <span className="text-sm font-medium ml-2">
                    {option.label}
                  </span>
                  <span className="text-sm font-medium ml-1">:</span>
                  <span className="text-xs ml-2">{option.example}</span>
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
