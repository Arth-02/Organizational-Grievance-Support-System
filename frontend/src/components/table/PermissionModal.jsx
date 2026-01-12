import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  ChevronsUpDown,
  Shield,
  ShieldCheck,
  Sparkles,
  X,
  Lock,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
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
import { useGetAllPermissionsQuery } from "@/services/user.service";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const PermissionsModal = ({
  isOpen,
  onClose,
  initialPermissions = [],
  removePermissions = [],
  rolePermissions = [],
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

  // Helper function to extract category from permission name
  const getCategoryFromPermission = (permission) => {
    const parts = permission.name.split(" ");
    if (parts.length <= 1) return "General";

    const category = parts.slice(1).join(" ");
    // Normalize categories - group "Grievance Assignee" under "Grievance"
    if (category.toLowerCase().startsWith("grievance")) {
      return "Grievance";
    }
    return category;
  };

  // Group permissions by category (extracted from permission name)
  const groupedSelectedPermissions = useMemo(() => {
    const groups = {};
    selectedPermissions.forEach((permission) => {
      const category = getCategoryFromPermission(permission);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(permission);
    });

    // Sort categories alphabetically
    const sortedGroups = {};
    Object.keys(groups)
      .sort()
      .forEach((key) => {
        sortedGroups[key] = groups[key].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      });

    return sortedGroups;
  }, [selectedPermissions]);

  // Group available permissions for the dropdown
  const groupedOptionPermissions = useMemo(() => {
    const groups = {};
    optionPermissions.forEach((permission) => {
      const category = getCategoryFromPermission(permission);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(permission);
    });

    // Sort categories alphabetically
    const sortedGroups = {};
    Object.keys(groups)
      .sort()
      .forEach((key) => {
        sortedGroups[key] = groups[key].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      });

    return sortedGroups;
  }, [optionPermissions]);

  // Group role permissions by category (for read-only display)
  const groupedRolePermissions = useMemo(() => {
    const groups = {};
    rolePermissions.forEach((permission) => {
      const category = getCategoryFromPermission(permission);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(permission);
    });

    const sortedGroups = {};
    Object.keys(groups)
      .sort()
      .forEach((key) => {
        sortedGroups[key] = groups[key].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      });

    return sortedGroups;
  }, [rolePermissions]);

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
    const selectAllPermissions = allPermissions.data.filter(
      (p) =>
        !selectedPermissions.some((sp) => sp.slug === p.slug) &&
        !removePermissions.some((rp) => rp.slug === p.slug)
    );
    setSelectedPermissions([...selectedPermissions, ...selectAllPermissions]);
    setOptionPermissions([]);
  };

  const handleAllRemovePermission = () => {
    setSelectedPermissions([]);
    setOptionPermissions(
      allPermissions.data.filter(
        (p) => !removePermissions.some((rp) => rp.slug === p.slug)
      )
    );
  };

  const handleSelectCategory = (category) => {
    const permsToAdd = groupedOptionPermissions[category] || [];
    const newSelected = [...selectedPermissions, ...permsToAdd];
    const newOptions = optionPermissions.filter(p => !permsToAdd.some(add => add.slug === p.slug));

    setSelectedPermissions(newSelected);
    setOptionPermissions(newOptions);
  };

  const handleClearCategory = (category) => {
    const permsToRemove = groupedSelectedPermissions[category] || [];
    const newSelected = selectedPermissions.filter(p => !permsToRemove.some(rem => rem.slug === p.slug));
    const newOptions = [...optionPermissions, ...permsToRemove];

    setSelectedPermissions(newSelected);
    setOptionPermissions(newOptions);
  };

  if (isError) {
    return <div>Error loading permissions</div>;
  }

  const totalPermissions = (allPermissions?.data?.length || 0) - rolePermissions.length;
  const selectedCount = selectedPermissions.length;

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      title="Manage Permissions"
      description="Add, remove, or modify permissions for this role"
      confirmText="Save Changes"
      onConfirm={handleSave}
      className="sm:max-w-[600px]"
    >
      <div className="space-y-4 pr-6">
        {/* Stats bar */}
        <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-gradient-to-r from-secondary/50 to-secondary/30 dark:from-secondary/30 dark:to-secondary/10 border border-secondary/50 dark:border-secondary/20">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {selectedCount} of {totalPermissions} Selected
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedCount < totalPermissions && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAllSelectPermission}
                className="h-7 px-2 text-xs hover:bg-primary/10 text-primary"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Select All
              </Button>
            )}
            {selectedCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAllRemovePermission}
                className="h-7 px-2 text-xs hover:bg-destructive/10 text-destructive"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Add permission dropdown */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-10 bg-muted/30 border border-border hover:border-muted-foreground/50 hover:bg-muted/40 transition-all"
            >
              <span className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4" />
                Add permissions...
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search permissions..." />
              <CommandList className="max-h-[300px]">
                <CommandEmpty>No permission found.</CommandEmpty>
                {Object.entries(groupedOptionPermissions).map(
                  ([category, perms]) => (
                    <CommandGroup
                      key={category}
                      heading={
                        <div className="flex items-center justify-between">
                          <span>{category}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSelectCategory(category);
                            }}
                            className="cursor-pointer text-[12px] flex items-center gap-1"
                          >
                            <Sparkles className="h-3 w-3" />
                            Select All
                          </Button>
                        </div>
                      }
                    >
                      {perms.map((permission) => (
                        <CommandItem
                          key={permission.slug}
                          value={permission.slug}
                          onSelect={handleAddPermission}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedPermissions.some(
                                (p) => p.slug === permission.slug
                              )
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {permission.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Role Permissions (Read-only) - Only shown when there are role permissions */}
        {rolePermissions.length > 0 && (
          <div className="space-y-3 !mt-6">
            <div className="flex items-center gap-2 px-1">
              <Shield className="h-4 w-4 text-muted-foreground/70" />
              <h4 className="text-sm font-medium text-muted-foreground">
                Inherited from Role <span className="text-xs ml-1 bg-muted px-1.5 py-0.5 rounded-full border border-border/50">{rolePermissions.length}</span>
              </h4>
            </div>
            <ScrollArea className="h-[120px] rounded-lg border border-dashed bg-muted/30 py-3">
              <div className="space-y-3 px-4">
                {Object.entries(groupedRolePermissions).map(([category, perms]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                        {category}
                      </h5>
                      <div className="flex-1 h-px bg-border/50 dashed" />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {perms.map((p) => (
                        <Badge
                          key={p.slug}
                          variant="outline"
                          className="text-xs py-1 px-2.5 bg-background/50 hover:bg-background cursor-default border-muted-foreground/20 text-muted-foreground gap-1.5 transition-colors"
                        >
                          <Lock className="h-3 w-3 opacity-50" />
                          {p.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Special/Selected permissions grouped by category */}
        <ScrollArea className={`${rolePermissions.length > 0 ? 'h-[220px]' : 'h-[320px]'} -mr-5 pr-6 pl-1 !mt-4`}>
          {isLoading && (
            <div className="flex items-center justify-center h-[320px]">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm">Loading permissions...</span>
              </div>
            </div>
          )}

          {!isLoading && selectedCount === 0 && (
            <div className={`flex flex-col items-center justify-center text-muted-foreground ${rolePermissions.length > 0 ? 'h-[220px]' : 'h-[320px]'}`}>
              <Shield className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm font-medium">No permissions selected</p>
              <p className="text-xs mt-1">
                Use the dropdown above to add permissions
              </p>
            </div>
          )}

          {!isLoading && selectedCount > 0 && (
            <div className="space-y-4 !mt-4">
              {Object.entries(groupedSelectedPermissions).map(
                ([category, perms]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {category}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        ({perms.length})
                      </span>
                      <div className="flex-1 h-px bg-border" />
                      <button
                        type="button"
                        onClick={() => handleClearCategory(category)}
                        className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-destructive/10"
                      >
                        <X className="h-3 w-3" />
                        Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {perms.map((permission) => (
                        <Badge
                          key={permission.slug}
                          variant="secondary"
                          className="group px-3 py-1.5 pr-2 bg-secondary/50 dark:bg-secondary/30 hover:bg-secondary/70 dark:hover:bg-secondary/50 cursor-default transition-all duration-200"
                        >
                          <span className="text-xs font-medium mr-1.5">
                            {permission.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemovePermission(permission)}
                            className="p-0.5 rounded-full hover:bg-destructive/20 transition-colors"
                          >
                            <X className="h-3 w-3 text-muted-foreground hover:text-destructive transition-colors" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </Modal>
  );
};

export default PermissionsModal;
