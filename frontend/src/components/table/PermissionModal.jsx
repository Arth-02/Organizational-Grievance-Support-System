import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useGetAllPermissionsQuery } from "@/services/api.service";
import { ChevronsUpDown } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

const PermissionsModal = ({
  isOpen,
  onClose,
  initialPermissions = [],
  removePermissions = [],
  onSave,
}) => {
  const {
    data: allPermissions,
    isLoading,
    isError,
  } = useGetAllPermissionsQuery();

  const [selectedPermissions, setSelectedPermissions] =
    useState(initialPermissions);
  const [optionPermissions, setOptionPermissions] = useState([]);
  const [open, setOpen] = useState(false);

  const handleAddPermission = (selectedValue) => {
    const selectedPermission = allPermissions.data.find(
      (p) => p.slug === selectedValue
    );
    if (
      selectedPermission &&
      !selectedPermissions.some((p) => p.slug === selectedPermission.slug)
    ) {
      setSelectedPermissions([...selectedPermissions, selectedPermission]);
      setOptionPermissions(
        optionPermissions.filter((p) => p.slug !== selectedPermission.slug)
      );
    }
    setOpen(false);
  };
  useEffect(() => {
    if (allPermissions?.data) {
      const filterPermissions = [
        ...new Set([...selectedPermissions, ...removePermissions]),
      ];
      setOptionPermissions(
        allPermissions.data.filter(
          (p) => !filterPermissions.some((sp) => sp.slug === p.slug)
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPermissions]);

  const handleRemovePermission = (permission) => {
    setSelectedPermissions(
      selectedPermissions.filter((p) => p.slug !== permission.slug)
    );
    setOptionPermissions([...optionPermissions, permission]);
  };

  const handleSave = () => {
    onSave(selectedPermissions);
    onClose();
  };

  const handleAllSelectPermission = () => {
    const seleteAllPermissions = allPermissions.data.filter(
      (p) =>
        !selectedPermissions.some((sp) => sp.slug === p.slug) &&
        !removePermissions.some((rp) => rp.slug === p.slug)
    );
    setSelectedPermissions(seleteAllPermissions);
    setOptionPermissions([]);
  };

  const handleAllRemovePermission = () => {
    setSelectedPermissions([]);
    setOptionPermissions(allPermissions.data);
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
      <div className="space-y-4 overflow-y-auto max-h-[400px] !pr-4">
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
                  {selectedPermissions?.length ===
                  allPermissions?.data?.length ? (
                    <CommandItem
                      key="none"
                      value="none"
                      onSelect={handleAllRemovePermission}
                    >
                      Remove All
                    </CommandItem>
                  ) : (
                    <>
                      <CommandItem
                        key="all"
                        value="all"
                        onSelect={handleAllSelectPermission}
                      >
                        Select All
                      </CommandItem>
                      <Separator className="my-1 bg-secondary dark:bg-secondary/50 w-[98%] mx-auto" />
                    </>
                  )}
                  {optionPermissions?.length > 0 &&
                    optionPermissions.map((permission) => (
                      <CommandItem
                        key={permission.slug}
                        value={permission.slug}
                        onSelect={handleAddPermission}
                      >
                        {permission.name}
                      </CommandItem>
                    ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <div className="grid grid-cols-2 gap-4">
          {isLoading && <div>Loading permissions...</div>}
          {selectedPermissions?.map((permission, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 bg-secondary/20 p-2 rounded-md"
            >
              <Label htmlFor={`permission-${index}`} className="flex-grow">
                {permission.name}
              </Label>
              <Button
                variant="ghost"
                size="xs"
                className="p-[2px] h-6 w-6"
                onClick={() => handleRemovePermission(permission)}
              >
                <X className="p-[2px]" size={24} />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default PermissionsModal;
