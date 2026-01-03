import { useEffect, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CustomInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";
import { useCreateRoleMutation, useGetRoleByIdQuery, useUpdateRoleMutation } from "@/services/role.service";
import { useGetAllPermissionsQuery } from "@/services/user.service";

const schema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").trim(),
  permissions: z.array(z.string()),
  is_active: z.boolean(),
});

const RoleDialog = ({ open, onOpenChange, editId, onSuccess }) => {
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const { data: permissions } = useGetAllPermissionsQuery();
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

  const permissionOptions = useMemo(() => {
    return permissions?.data?.map((permission) => ({
      value: permission.slug,
      label: permission.name,
    }));
  }, [permissions]);

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
    }
  }, [open, editId, reset]);

  // Populate form when editing
  useEffect(() => {
    if (role?.data && open) {
      Object.keys(role.data).forEach((key) => {
        setValue(key, role.data[key]);
      });
      setSelectedPermissions(role.data.permissions || []);
    }
  }, [role, setValue, open]);

  // Sync selected permissions with form
  useEffect(() => {
    setValue("permissions", selectedPermissions);
  }, [selectedPermissions, setValue]);

  const handleToggle = (value) => {
    setSelectedPermissions((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const handleToggleAll = () => {
    if (selectedPermissions.length === permissionOptions?.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(permissionOptions?.map((item) => item.value));
    }
  };

  const selectedLabels = permissionOptions
    ?.filter((option) => selectedPermissions.includes(option.value))
    .map((option) => option.label) || [];

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <CustomInput label="Name" {...register("name")} error={errors.name} />

            <div>
              <label
                htmlFor="permissions"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Permissions
              </label>
              <Select>
                <SelectTrigger className="w-full h-auto min-h-10">
                  <div className="flex flex-wrap gap-2">
                    {selectedLabels.length > 0 ? (
                      selectedLabels.map((label) => (
                        <div
                          key={label}
                          className="bg-primary text-primary-foreground hover:bg-primary/90 px-2 py-1 rounded flex items-center space-x-1 text-xs"
                        >
                          <span>{label}</span>
                        </div>
                      ))
                    ) : (
                      <SelectValue placeholder="Select permissions" />
                    )}
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <div className="flex items-center space-x-2 p-2">
                    <Controller
                      control={control}
                      name="permissions"
                      render={({ field }) => (
                        <Checkbox
                          checked={field.value.length === permissionOptions?.length}
                          onCheckedChange={() => handleToggleAll()}
                        />
                      )}
                    />
                    <label className="text-sm">
                      {selectedPermissions.length === permissionOptions?.length ? "Unselect All" : "Select All"}
                    </label>
                  </div>
                  {permissionOptions?.map((item) => (
                    <div className="flex items-center space-x-2 p-2" key={item.value}>
                      <Controller
                        control={control}
                        name="permissions"
                        render={({ field }) => (
                          <Checkbox
                            checked={field.value.includes(item.value)}
                            onCheckedChange={() => handleToggle(item.value)}
                          />
                        )}
                      />
                      <label className="text-sm">{item.label}</label>
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
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
              <label htmlFor="is_active">Is Active</label>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
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
