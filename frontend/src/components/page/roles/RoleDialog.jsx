import { useEffect, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CustomInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Shield,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { cn } from "@/lib/utils";
import { useCreateRoleMutation, useGetRoleByIdQuery, useUpdateRoleMutation } from "@/services/role.service";
import { useGetAllPermissionsQuery } from "@/services/user.service";

const schema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").trim(),
  permissions: z.array(z.string()),
  is_active: z.boolean(),
});

// Helper function to extract category from permission name
const getCategoryFromPermission = (permission) => {
  const parts = permission.name.split(" ");
  if (parts.length <= 1) return "General";
  const category = parts.slice(1).join(" ");
  if (category.toLowerCase().startsWith("grievance")) {
    return "Grievance";
  }
  return category;
};

const RoleDialog = ({ open, onOpenChange, editId, onSuccess }) => {
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [optionPermissions, setOptionPermissions] = useState([]);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const { data: permissions, isLoading: isPermissionsLoading } = useGetAllPermissionsQuery();
  const { data: role, isLoading: isRoleLoading } = useGetRoleByIdQuery(editId, {
    skip: !editId,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      permissions: [],
      is_active: true,
    },
  });

  // Group selected permissions by category
  const groupedSelectedPermissions = useMemo(() => {
    const groups = {};
    selectedPermissions.forEach((permission) => {
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
  }, [selectedPermissions]);

  // Group available permissions for dropdown
  const groupedOptionPermissions = useMemo(() => {
    const groups = {};
    optionPermissions.forEach((permission) => {
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
  }, [optionPermissions]);

  const onSubmit = async (data) => {
    try {
      if (editId) {
        if (role?.data?.is_active === data.is_active) {
          delete data.is_active;
        }
        if (role?.data?.name === data.name) {
          delete data.name;
        }
        delete data.id;
        const response = await updateRole({ id: editId, data }).unwrap();
        toast.success(response.message);
      } else {
        const response = await createRole(data).unwrap();
        toast.success(response.message);
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open && !editId) {
      reset({
        name: "",
        permissions: [],
        is_active: true,
      });
      setSelectedPermissions([]);
      if (permissions?.data) {
        setOptionPermissions(permissions.data);
      }
    }
  }, [open, editId, reset, permissions]);

  // Populate form when editing
  useEffect(() => {
    if (role?.data && open && permissions?.data) {
      setValue("name", role.data.name);
      setValue("is_active", role.data.is_active);
      
      const rolePermSlugs = role.data.permissions || [];
      const selectedPerms = permissions.data.filter((p) =>
        rolePermSlugs.includes(p.slug)
      );
      setSelectedPermissions(selectedPerms);
      setOptionPermissions(
        permissions.data.filter((p) => !rolePermSlugs.includes(p.slug))
      );
    }
  }, [role, setValue, open, permissions]);

  // Sync selected permissions with form
  useEffect(() => {
    setValue("permissions", selectedPermissions.map((p) => p.slug));
  }, [selectedPermissions, setValue]);

  const handleAddPermission = (selectedValue) => {
    const selectedPermission = permissions.data.find(
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

  const handleRemovePermission = (permission) => {
    setSelectedPermissions(
      selectedPermissions.filter((p) => p.slug !== permission.slug)
    );
    setOptionPermissions([...optionPermissions, permission]);
  };

  const handleSelectAll = () => {
    setSelectedPermissions([...(permissions?.data || [])]);
    setOptionPermissions([]);
  };

  const handleRemoveAll = () => {
    setSelectedPermissions([]);
    setOptionPermissions([...(permissions?.data || [])]);
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

  const handleClose = () => {
    onOpenChange(false);
  };

  const totalPermissions = permissions?.data?.length || 0;
  const selectedCount = selectedPermissions.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {editId ? "Update Role" : "Add Role"}
          </DialogTitle>
          <DialogDescription>
            {editId ? "Update the role details below." : "Fill in the details to create a new role."}
          </DialogDescription>
        </DialogHeader>

        {isRoleLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <CustomInput label="Name" {...register("name")} error={errors.name} />

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Permissions
              </label>

              {/* Stats bar */}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-gradient-to-r from-secondary/50 to-secondary/30 dark:from-secondary/30 dark:to-secondary/10 border border-secondary/50 dark:border-secondary/20">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {selectedCount} of {totalPermissions} Selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedCount < totalPermissions && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      className="h-7 px-2 text-xs hover:bg-primary/10 text-primary"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Select All
                    </Button>
                  )}
                  {selectedCount > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAll}
                      className="h-7 px-2 text-xs hover:bg-destructive/10 text-destructive"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>
              </div>

              {/* Add permission dropdown */}
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={popoverOpen}
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

              {/* Selected permissions grouped by category */}
              <ScrollArea className="h-[200px] rounded-lg border p-3">
                {isPermissionsLoading && (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-sm">Loading permissions...</span>
                    </div>
                  </div>
                )}

                {!isPermissionsLoading && selectedCount === 0 && (
                  <div className="flex flex-col items-center justify-center h-[170px] text-muted-foreground">
                    <Shield className="h-10 w-10 mb-2 opacity-30" />
                    <p className="text-sm font-medium">No permissions selected</p>
                    <p className="text-xs mt-1">
                      Use the dropdown above to add permissions
                    </p>
                  </div>
                )}

                {!isPermissionsLoading && selectedCount > 0 && (
                  <div className="space-y-4">
                      {Object.entries(groupedSelectedPermissions).map(
                        ([category, perms]) => (
                          <div key={category} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {category}
                              </h4>
                              <span className="text-xs text-muted-foreground">
                                {perms.length}
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

            <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted/30">
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="is_active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <div>
                <label htmlFor="is_active" className="font-medium cursor-pointer">
                  Active Status
                </label>
                <p className="text-sm text-muted-foreground">
                  Enable to allow this role to be assigned to users
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {editId ? "Update" : "Add"} Role
                {(isCreating || isUpdating) && (
                  <Loader2 className="ml-2 animate-spin" size={20} />
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RoleDialog;


