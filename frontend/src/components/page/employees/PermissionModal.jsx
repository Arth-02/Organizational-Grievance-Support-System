import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import Modal from "@/components/ui/Model";
import { useGetAllPermissionsQuery } from "@/services/api.service";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const PermissionsModal = ({
  isOpen,
  onClose,
  initialPermissions = [],
  onSave,
}) => {
  const {
    data: allPermissions,
    isLoading,
    isError,
  } = useGetAllPermissionsQuery();

  const [selectedPermissions, setSelectedPermissions] = useState(initialPermissions);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const handleAddPermission = (selectedValue) => {
    const selectedPermission = allPermissions.data.find(p => p.slug === selectedValue);
    if (selectedPermission && !selectedPermissions.some(p => p.slug === selectedPermission.slug)) {
      setSelectedPermissions([...selectedPermissions, selectedPermission]);
    }
    setValue("");
    setOpen(false);
  };

  const handleRemovePermission = (permission) => {
    setSelectedPermissions(selectedPermissions.filter((p) => p.slug !== permission.slug));
  };

  const handleSave = () => {
    onSave(selectedPermissions);
    onClose();
  };

  if (isError) {
    return <div>Error loading permissions</div>;
  }

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      title="Manage Permissions"
      description="Add, remove, or modify user permissions"
      confirmText="Save Changes"
      onConfirm={handleSave}
    >
      <div className="space-y-4">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              Select permission...
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent asChild className="w-[400px] p-0">
            <Command>
              <CommandInput placeholder="Search permissions..." />
              <CommandList>
              <CommandEmpty>No permission found.</CommandEmpty>
              <CommandGroup>
                {allPermissions?.data?.length > 0 && allPermissions.data.map((permission) => (
                  <CommandItem
                    key={permission.slug}
                    value={permission.slug}
                    onSelect={handleAddPermission}
                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === permission.slug ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {permission.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <div className="space-y-2">
          {isLoading && <div>Loading permissions...</div>}
          {selectedPermissions?.map((permission, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 bg-secondary/20 p-2 rounded-md"
            >
              <Checkbox id={`permission-${index}`} />
              <Label htmlFor={`permission-${index}`} className="flex-grow">
                {permission.name}
              </Label>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemovePermission(permission)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default PermissionsModal;