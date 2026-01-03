import { useState, useCallback, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useParams, useNavigate } from "react-router-dom";
import { CustomInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, BadgeCheck, BadgeAlert, User, Mail, Briefcase, Shield, Check, X } from "lucide-react";
import { CustomTooltip } from "@/components/ui/tooltip";
import useDebounce from "@/hooks/useDebounce";
import { toast } from "react-hot-toast";
import AddUpdatePageLayout from "@/components/layout/AddUpdatePageLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
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
      console.log(error);
      toast.error("Something went wrong");
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

  const allSelected = selectedPermissions.length === permissionOptions?.length;
  const noneSelected = selectedPermissions.length === 0;

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

        {/* Special Permissions - only show when role is selected */}
        {roleId && (
        <FormSection icon={Shield} title="Special Permissions">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Select additional permissions beyond the role permissions.
                {selectedPermissions.length > 0 && (
                  <span className="ml-2 text-foreground font-medium">
                    ({selectedPermissions.length} selected)
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleSelectAll}
                  disabled={allSelected || !permissionOptions?.length}
                >
                  <Check size={12} className="mr-1" />
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleRemoveAll}
                  disabled={noneSelected}
                >
                  <X size={12} className="mr-1" />
                  Remove All
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[180px] rounded-lg border border-border p-3">
              <div className="flex flex-wrap gap-2">
                {permissionOptions?.length > 0 ? (
                  permissionOptions.map((item) => {
                    const isSelected = selectedPermissions.includes(item.value);
                    return (
                      <Badge
                        key={item.value}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer py-1.5 px-3 dark:bg-muted text-sm transition-all ${
                          isSelected
                            ? "bg-primary dark:bg-primary hover:bg-primary/90"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => handleToggle(item.value)}
                      >
                        {isSelected && <Check size={12} className="mr-1.5" />}
                        {item.label}
                      </Badge>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {roleId ? "All permissions are included in the selected role." : "Select a role first to see available permissions."}
                  </p>
                )}
              </div>
            </ScrollArea>
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
    </AddUpdatePageLayout>
  );
};

export default AddUpdateEmployee;
