import { useEffect } from "react";
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
  useCreateDepartmentMutation,
  useGetDepartmentByIdQuery,
  useUpdateDepartmentMutation,
} from "@/services/department.service";

const schema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").trim(),
  description: z
    .string()
    .min(3, "Description must be at least 3 characters")
    .trim(),
  is_active: z.boolean(),
});

const DepartmentDialog = ({ open, onOpenChange, editId, onSuccess }) => {
  const [createDepartment, { isLoading: isCreating }] =
    useCreateDepartmentMutation();
  const [updateDepartment, { isLoading: isUpdating }] =
    useUpdateDepartmentMutation();
  const { data: department, isLoading: isDepartmentLoading } =
    useGetDepartmentByIdQuery(editId, {
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
      description: "",
      is_active: true,
    },
  });

  const onSubmit = async (data) => {
    try {
      if (editId) {
        delete data.id;
        const response = await updateDepartment({ id: editId, data }).unwrap();
        toast.success(response.message);
      } else {
        const response = await createDepartment(data).unwrap();
        toast.success(response.message);
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  // Reset form when dialog opens/closes or editId changes
  useEffect(() => {
    if (open && !editId) {
      reset({
        name: "",
        description: "",
        is_active: true,
      });
    }
  }, [open, editId, reset]);

  // Populate form when editing
  useEffect(() => {
    if (department?.data && open) {
      Object.keys(department.data).forEach((key) => {
        setValue(key, department.data[key]);
      });
    }
  }, [department, setValue, open]);

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editId ? "Update Department" : "Add Department"}
          </DialogTitle>
          <DialogDescription>
            {editId ? "Update the department details below." : "Fill in the details to create a new department."}
          </DialogDescription>
        </DialogHeader>

        {isDepartmentLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <CustomInput
              label="Name"
              {...register("name")}
              error={errors.name}
            />

            <CustomInput
              label="Description"
              {...register("description")}
              error={errors.description}
            />

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
                {editId ? "Update" : "Add"} Department
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

export default DepartmentDialog;
