import { useEffect, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useParams, useNavigate } from "react-router-dom";
import { CustomInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import {
  useGetAllPermissionsQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useGetRoleByIdQuery,
} from "@/services/api.service";
import { toast } from "react-hot-toast";
import AddUpdatePageLayout from "@/components/layout/AddUpdatePageLayout";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";

// Define schema for form validation
const schema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").trim(),
  permissions: z.array(z.string()), // Permissions is an array of strings
  is_active: z.boolean(),
});

const AddUpdateRole = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const { data: permissions } = useGetAllPermissionsQuery();
  const { data: role } = useGetRoleByIdQuery(id, {
    skip: !id,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      permissions: [],
      is_active: true,
    },
  });

  // Memoize permission options
  const permissionOptions = useMemo(() => {
    return permissions?.data?.map((permission) => ({
      value: permission.slug,
      label: permission.name,
    }));
  }, [permissions]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      if (role.is_active === data.is_active) {
        delete data.is_active;
      }
      if (role.name === data.name) {
        delete data.name;
      }
      if (id) {
        delete data.id;
        const response = await updateRole({ id, data }).unwrap();
        toast.success(response.message);
      } else {
        const response = await createRole(data).unwrap();
        toast.success(response.message);
      }
      navigate("/roles");
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  useEffect(() => {
    if (role?.data) {
      Object.keys(role.data).forEach((key) => {
        setSelectedPermissions(role.data.permissions);
        setValue(key, role.data[key]);
      });
    }
  }, [role, setValue]);

  // Synchronize selected permissions with form data
  useEffect(() => {
    setValue("permissions", selectedPermissions);
  }, [selectedPermissions, setValue]);

  // Handle checkbox toggle for multiple select
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

  // Display all selected permissions in dropdown
  const selectedLabels = permissionOptions
    ?.filter((option) => selectedPermissions.includes(option.value))
    .map((option) => option.label) || ["Select permissions"];

  return (
    <AddUpdatePageLayout title={id ? "Update Role" : "Add Role"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <CustomInput label="Name" {...register("name")} error={errors.name} />
        </div>

        {/* Dropdown for Permissions */}
        <div className="">
          <Select>
            <SelectTrigger className="w-full h-auto">
              <div className="flex flex-wrap gap-2">
                {selectedLabels.length > 0 ? (
                  selectedLabels.map((label) => (
                    <div
                      key={label}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 px-2 py-1 rounded flex items-center space-x-1"
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
              <div className="flex items-center space-x-2">
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
                {selectedPermissions.length === permissionOptions?.length ? (
                  <label htmlFor="unselect_all">Unselect All</label>
                ) : (
                  <label htmlFor="select_all">Select All</label>
                )}
              </div>
              {permissionOptions?.map((item) => (
                <div className="flex items-center space-x-2" key={item.value}>
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
                  <label htmlFor={item.value}>{item.label}</label>
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

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/roles")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isCreating || isUpdating}>
            {id ? "Update" : "Add"} Role
            {(isCreating || isUpdating) && (
              <Loader2 className="ml-2 animate-spin" size={20} />
            )}
          </Button>
        </div>
      </form>
    </AddUpdatePageLayout>
  );
};

export default AddUpdateRole;
