import { useState, useCallback, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useParams, useNavigate } from "react-router-dom";
import { CustomInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, BadgeCheck, BadgeAlert, User, Mail, Briefcase, Shield, ShieldCheck, ShieldX, Sparkles, Check, X, ChevronsUpDown, Lock } from "lucide-react";
import { CustomTooltip } from "@/components/ui/tooltip";
import useDebounce from "@/hooks/useDebounce";
import { toast } from "react-hot-toast";
import AddUpdatePageLayout from "@/components/layout/AddUpdatePageLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import UpgradePrompt from "@/components/ui/UpgradePrompt";
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
import {
  useCheckEmailMutation,
  useCheckUsernameMutation,
  useCreateUserMutation,
  useGetAllPermissionsQuery,
  useGetUserDetailsQuery,
  useUpdateUserMutation,
} from "@/services/user.service";
import { useGetAllRoleNameQuery, useGetRoleByIdQuery } from "@/services/role.service";
import { useGetAllDepartmentNameQuery } from "@/services/department.service";

const schema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),
    confirmpassword: z.string().optional(),
    role: z.string().nonempty("Role is required"),
    firstname: z.string().nonempty("First name is required"),
    lastname: z.string().nonempty("Last name is required"),
    department: z.string().nonempty("Department is required"),
    employee_id: z.string().nonempty("Employee ID is required"),
    phone_number: z.string().optional(),
    special_permissions: z.array(z.string()).optional(),
    is_active: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.password || data.confirmpassword) {
        return data.password === data.confirmpassword;
      }
      return true;
    },
    {
      message: "Passwords don't match",
      path: ["confirmpassword"],
    }
  );

// Section component for visual grouping
const FormSection = ({ icon: Icon, title, children }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 pb-2 border-b border-border">
      <Icon size={18} className="text-primary" />
      <h3 className="font-medium text-foreground">{title}</h3>
    </div>
    {children}
  </div>
);

// Helper function to extract category from permission
const getCategoryFromPermission = (permission) => {
  const name = typeof permission === 'string' ? permission : permission.name || permission.label;
  const parts = name.split(" ");
  if (parts.length <= 1) return "General";
  const category = parts.slice(1).join(" ");
  if (category.toLowerCase().startsWith("grievance")) {
    return "Grievance";
  }
  return category;
};

const AddUpdateEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [roleId, setRoleId] = useState("");
  const { data: user, isLoading: isUserLoading } = useGetUserDetailsQuery(id, {
    skip: !id,
  });
  const { data: roles } = useGetAllRoleNameQuery();
  const { data: departments } = useGetAllDepartmentNameQuery();
  const [checkUsername, { isLoading: checkingUsername }] = useCheckUsernameMutation();
  const [checkEmail, { isLoading: checkingEmail }] = useCheckEmailMutation();
  const { data: permissions } = useGetAllPermissionsQuery();
  const {
    data: roleData,
    refetch,
    isFetching,
    isSuccess,
  } = useGetRoleByIdQuery(roleId, {
    skip: !roleId,
  });

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(undefined);
  const [isEmailAvailable, setIsEmailAvailable] = useState(undefined);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  // Upgrade prompt state for subscription limit reached
  const [upgradePromptOpen, setUpgradePromptOpen] = useState(false);
  const [upgradePromptData, setUpgradePromptData] = useState({
    currentUsage: 0,
    limit: 0,
    currentPlan: "Starter",
  });

  const handleFetchRole = (newId) => {
    setRoleId(newId);
    setPermissionOptions(
      permissions?.data?.map((permission) => ({
        value: permission.slug,
        label: permission.name,
      }))
    );
    if (newId && !isFetching && isSuccess) {
      refetch();
    }
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setError,
    clearErrors,
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmpassword: "",
      role: "",
      firstname: "",
      lastname: "",
      department: "",
      employee_id: "",
      phone_number: "",
      special_permissions: [],
      is_active: true,
    },
  });

  const [permissionOptions, setPermissionOptions] = useState([]);

  useEffect(() => {
    setPermissionOptions(
      permissions?.data?.map((permission) => ({
        value: permission.slug,
        label: permission.name,
      }))
    );
  }, [permissions]);

  // Group permissions by category
  const groupedPermissionOptions = useMemo(() => {
    if (!permissionOptions) return {};
    const groups = {};
    permissionOptions.forEach((permission) => {
      const category = getCategoryFromPermission(permission.label);
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
          a.label.localeCompare(b.label)
        );
      });
    return sortedGroups;
  }, [permissionOptions]);

  // Group role permissions by category (for read-only display)
  const groupedRolePermissions = useMemo(() => {
    if (!roleData?.data?.permissions || !permissions?.data) return {};

    const rolePerms = permissions.data
      .filter((p) => roleData.data.permissions.includes(p.slug))
      .map((p) => ({ value: p.slug, label: p.name }));

    const groups = {};
    rolePerms.forEach((permission) => {
      const category = getCategoryFromPermission(permission.label);
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
          a.label.localeCompare(b.label)
        );
      });
    return sortedGroups;
  }, [roleData, permissions]);

  // Group selected special permissions by category
  const groupedSelectedPermissions = useMemo(() => {
    if (!permissions?.data) return {};
    const groups = {};
    selectedPermissions.forEach((slug) => {
      const perm = permissions.data.find(p => p.slug === slug);
      if (perm) {
        const category = getCategoryFromPermission(perm.name);
        if (!groups[category]) groups[category] = [];
        groups[category].push({ value: perm.slug, label: perm.name });
      }
    });

    const sortedGroups = {};
    Object.keys(groups)
      .sort()
      .forEach((key) => {
        sortedGroups[key] = groups[key].sort((a, b) =>
          a.label.localeCompare(b.label)
        );
      });
    return sortedGroups;
  }, [selectedPermissions, permissions]);

  useEffect(() => {
    if (user) {
      reset(user.data);
      setUsername(user.data.username);
      setEmail(user.data.email);
      setRoleId(user.data.role);
      // Set availability to true for existing values in edit mode
      setIsUsernameAvailable(true);
      setIsEmailAvailable(true);
    }
  }, [user, reset]);

  useEffect(() => {
    if (roleData?.data && permissionOptions?.length > 0) {
      const filteredOptions = permissionOptions.filter(
        (permission) =>
          !roleData.data.permissions.some(
            (rolePermission) => rolePermission === permission.value
          )
      );
      setPermissionOptions(filteredOptions);
      setSelectedPermissions((prev) =>
        prev.filter(
          (permission) =>
            !roleData.data.permissions.some(
              (rolePermission) => rolePermission === permission
            )
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleData]);

  const checkIfUsernameExists = useCallback(
    async (username) => {
      if (!username || (id && user?.data?.username === username)) return;
      if (username.length < 3) {
        setIsUsernameAvailable(false);
        setError("username", {
          type: "manual",
          message: "Username must be at least 3 characters long",
        });
        return;
      }
      try {
        const response = await checkUsername({ username }).unwrap();
        setIsUsernameAvailable(!response.data.exists);
        if (response.data.exists) {
          setError("username", {
            type: "manual",
            message: "Username is already taken",
          });
        } else {
          clearErrors("username");
        }
      } catch (error) {
        console.error(error);
        setIsUsernameAvailable(false);
        setError("username", {
          type: "manual",
          message: "Error checking username availability",
        });
      }
    },
    [checkUsername, setError, clearErrors, id, user]
  );

  const checkIfEmailExists = useCallback(
    async (email) => {
      if (!email || (id && user?.data?.email === email)) return;
      try {
        const response = await checkEmail({ email }).unwrap();
        setIsEmailAvailable(!response.data.exists);
        if (response.data.exists) {
          setError("email", {
            type: "manual",
            message: "Email is already in use",
          });
        } else {
          clearErrors("email");
        }
      } catch (error) {
        console.error(error);
        setIsEmailAvailable(false);
        setError("email", {
          type: "manual",
          message: "Error checking email availability",
        });
      }
    },
    [checkEmail, setError, clearErrors, id, user]
  );

  useDebounce(email, 700, checkIfEmailExists);
  useDebounce(username, 700, checkIfUsernameExists);

  const onSubmit = async (data) => {
    try {
      if (id) {
        delete data.id;
        delete data.email;
        const response = await updateUser({ id, data }).unwrap();
        toast.success(response.message);
      } else {
        delete data.confirmpassword;
        const response = await createUser(data).unwrap();
        toast.success(response.message);
      }
      navigate("/employees");
    } catch (error) {
      // Check if this is a subscription limit error (403)
      if (error?.status === 403 && error?.data?.code === "USER_LIMIT_REACHED") {
        setUpgradePromptData({
          currentUsage: error.data.currentUsage || 0,
          limit: error.data.limit || 0,
          currentPlan: error.data.currentPlan || "Starter",
        });
        setUpgradePromptOpen(true);
      } else {
        toast.error(error?.data?.message || "Something went wrong");
      }
    }
  };

  useEffect(() => {
    if (user) {
      Object.keys(user.data).forEach((key) => {
        setValue(key, user.data[key]);
      });
      if (user.data.special_permissions) {
        setSelectedPermissions(user.data.special_permissions);
      }
      setUsername(user.data.username);
      setEmail(user.data.email);
      setRoleId(user.data.role);
    }
  }, [user, setValue]);

  useEffect(() => {
    setValue("special_permissions", selectedPermissions);
  }, [selectedPermissions, setValue]);

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const handleToggle = (value) => {
    setSelectedPermissions((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const handleSelectAll = () => {
    setSelectedPermissions(permissionOptions?.map((item) => item.value) || []);
  };

  const handleRemoveAll = () => {
    setSelectedPermissions([]);
  };

  const handleSelectCategory = (category) => {
    const permsToAdd = groupedPermissionOptions[category]?.map(p => p.value) || [];
    const newSelected = [...new Set([...selectedPermissions, ...permsToAdd])];
    setSelectedPermissions(newSelected);
  };

  const handleClearCategory = (category) => {
    const permsToRemove = groupedSelectedPermissions[category]?.map(p => p.value) || [];
    const newSelected = selectedPermissions.filter(slug => !permsToRemove.includes(slug));
    setSelectedPermissions(newSelected);
  };

  return (
    <AddUpdatePageLayout title={id ? "Update Employee" : "Add Employee"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-12 max-w-4xl">
        {/* Personal Information */}
        <FormSection icon={User} title="Personal Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomInput
              label="First Name"
              placeholder="Enter first name"
              {...register("firstname")}
              error={errors.firstname}
            />
            <CustomInput
              label="Last Name"
              placeholder="Enter last name"
              {...register("lastname")}
              error={errors.lastname}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomInput
              label="Employee ID"
              placeholder="Enter employee ID"
              {...register("employee_id")}
              error={errors.employee_id}
            />
            <CustomInput
              label="Phone Number"
              placeholder="Enter phone number"
              {...register("phone_number")}
              error={errors.phone_number}
            />
          </div>
        </FormSection>

        {/* Account Information */}
        <FormSection icon={Mail} title="Account Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <CustomInput
                label="Username"
                placeholder="Enter username"
                {...register("username", {
                  onChange: (e) => setUsername(e.target.value),
                })}
                error={errors.username}
              />
              {username && (
                <div className="absolute right-3 top-9">
                  {isUsernameAvailable === undefined || checkingUsername ? (
                    <Loader2 size={18} className="animate-spin text-primary" />
                  ) : isUsernameAvailable ? (
                    <CustomTooltip content="Username is available">
                      <BadgeCheck className="text-green-500" size={18} />
                    </CustomTooltip>
                  ) : (
                    <CustomTooltip
                      content={errors.username?.message || "Username is not available"}
                    >
                      <BadgeAlert className="text-red-500" size={18} />
                    </CustomTooltip>
                  )}
                </div>
              )}
            </div>
            {!id && (
              <div className="relative">
                <CustomInput
                  label="Email"
                  placeholder="Enter email address"
                  {...register("email", {
                    onChange: (e) => setEmail(e.target.value),
                  })}
                  error={errors.email}
                />
                {email && (
                  <div className="absolute right-3 top-9">
                    {isEmailAvailable === undefined || checkingEmail ? (
                      <Loader2 size={18} className="animate-spin text-primary" />
                    ) : isEmailAvailable ? (
                      <CustomTooltip content="Email is available">
                        <BadgeCheck className="text-green-500" size={18} />
                      </CustomTooltip>
                    ) : (
                      <CustomTooltip
                        content={errors.email?.message || "Email is not available"}
                      >
                        <BadgeAlert className="text-red-500" size={18} />
                      </CustomTooltip>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {!id && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomInput
                label="Password"
                type="password"
                placeholder="Enter password"
                {...register("password")}
                error={errors.password}
              />
              <CustomInput
                label="Confirm Password"
                type="password"
                placeholder="Confirm password"
                {...register("confirmpassword")}
                error={errors.confirmpassword}
              />
            </div>
          )}
        </FormSection>

        {/* Role & Department */}
        <FormSection icon={Briefcase} title="Role & Department">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomSelect
              label="Role"
              name="role"
              rules={{
                required: "Role is required",
                onChange: (e) => handleFetchRole(e.target.value),
              }}
              control={control}
              options={roles?.data?.map((role) => ({
                label: role.name,
                value: role._id,
              }))}
              placeholder="Select a role"
              error={errors.role}
            />
            <CustomSelect
              label="Department"
              name="department"
              rules={{ required: "Department is required" }}
              control={control}
              options={departments?.data?.map((dept) => ({
                label: dept.name,
                value: dept._id,
              }))}
              placeholder="Select a department"
              error={errors.department}
            />
          </div>
        </FormSection>

        {/* Permissions - only show when role is selected */}
        {roleId && (
          <FormSection icon={Shield} title="Permissions">
            <div className="space-y-6">
              {/* Role Permissions (Read-only) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Shield className="h-4 w-4 text-muted-foreground/70" />
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Inherited from Role <span className="text-xs ml-1 bg-muted px-1.5 py-0.5 rounded-full border border-border/50">{roleData?.data?.permissions?.length || 0}</span>
                  </h4>
                </div>
                <ScrollArea className="h-[150px] rounded-lg border border-dashed bg-muted/30 p-3">
                  {Object.keys(groupedRolePermissions).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
                      <Shield className="h-8 w-8 mb-2 opacity-30" />
                      <p className="text-sm">No permissions inherited from role</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
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
                                key={p.value}
                                variant="outline"
                                className="text-xs py-1 px-2.5 bg-background/50 hover:bg-background cursor-default border-muted-foreground/20 text-muted-foreground gap-1.5 transition-colors"
                              >
                                <Lock className="h-3 w-3 opacity-50" />
                                {p.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Special Permissions (Editable) */}
              <div className="space-y-3">
                {/* Stats bar */}
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-gradient-to-r from-secondary/50 to-secondary/30 dark:from-secondary/30 dark:to-secondary/10 border border-secondary/50 dark:border-secondary/20">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      Special: {selectedPermissions.length} of {permissionOptions?.length || 0} available
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedPermissions.length < (permissionOptions?.length || 0) && permissionOptions?.length > 0 && (
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
                    {selectedPermissions.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveAll}
                        className="h-7 px-2 text-xs hover:bg-destructive/10 text-destructive"
                      >
                        <ShieldX className="h-3 w-3 mr-1" />
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
                        Add special permissions...
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search permissions..." />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty>No permission found.</CommandEmpty>
                        {Object.entries(groupedPermissionOptions).map(
                          ([category, perms]) => {
                            const filteredPerms = perms.filter(p => !selectedPermissions.includes(p.value));
                            if (filteredPerms.length === 0) return null;

                            return (
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
                                {filteredPerms.map((permission) => (
                                  <CommandItem
                                    key={permission.value}
                                    value={permission.value}
                                    onSelect={(value) => {
                                      handleToggle(value);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedPermissions.includes(permission.value)
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {permission.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            );
                          }
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Selected permissions grouped by category */}
                <ScrollArea className="h-[200px] rounded-lg border p-3">
                  {selectedPermissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[170px] text-muted-foreground">
                      <Shield className="h-10 w-10 mb-2 opacity-30" />
                      <p className="text-sm font-medium">No special permissions selected</p>
                      <p className="text-xs mt-1">
                        {permissionOptions?.length > 0
                          ? "Use the dropdown above to add permissions"
                          : "All permissions are included in the selected role"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {Object.entries(groupedSelectedPermissions).map(([category, perms]) => (
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
                                <ShieldX className="h-3 w-3" />
                                Clear
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {perms.map((permission) => (
                                <Badge
                                  key={permission.value}
                                  variant="secondary"
                                  className="group px-3 py-1.5 pr-2 bg-secondary/50 dark:bg-secondary/30 hover:bg-secondary/70 dark:hover:bg-secondary/50 cursor-default transition-all duration-200"
                                >
                                  <span className="text-xs font-medium mr-1.5">
                                    {permission.label}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleToggle(permission.value)}
                                    className="p-0.5 rounded-full hover:bg-destructive/20 transition-colors"
                                  >
                                    <X className="h-3 w-3 text-muted-foreground hover:text-destructive transition-colors" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </FormSection>
        )}
        {/* Status */}
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
              Enable to allow this employee to access the system
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/employees")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isCreating || isUpdating}>
            {(isCreating || isUpdating) && (
              <Loader2 className="mr-2 animate-spin" size={16} />
            )}
            {id ? "Update" : "Create"} Employee
          </Button>
        </div>
      </form>
      
      {/* Upgrade Prompt for User Limit Reached */}
      <UpgradePrompt
        open={upgradePromptOpen}
        onOpenChange={setUpgradePromptOpen}
        resourceType="users"
        currentUsage={upgradePromptData.currentUsage}
        limit={upgradePromptData.limit}
        currentPlan={upgradePromptData.currentPlan}
        recommendedPlan="Professional"
      />
    </AddUpdatePageLayout>
  );
};

export default AddUpdateEmployee;
