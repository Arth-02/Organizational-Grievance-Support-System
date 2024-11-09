import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useParams, useNavigate } from "react-router-dom";
import { CustomInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import AddUpdatePageLayout from "@/components/layout/AddUpdatePageLayout";
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

const AddUpdateDepartment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [createDepartment, { isLoading: isCreating }] =
    useCreateDepartmentMutation();
  const [updateDepartment, { isLoading: isUpdating }] =
    useUpdateDepartmentMutation();
  const { data: department, isLoading: isDepartmentLoading } =
    useGetDepartmentByIdQuery(id, {
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
      description: "",
      is_active: true,
    },
  });

  const onSubmit = async (data) => {
    try {
      if (id) {
        delete data.id;
        const response = await updateDepartment({ id, data }).unwrap();
        toast.success(response.message);
      } else {
        const response = await createDepartment(data).unwrap();
        toast.success(response.message);
      }
      navigate("/departments");
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  useEffect(() => {
    if (department?.data) {
      Object.keys(department.data).forEach((key) => {
        setValue(key, department.data[key]);
      });
    }
  }, [department, setValue]);

  if (isDepartmentLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AddUpdatePageLayout title={id ? "Update Department" : "Add Department"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <CustomInput
            label="Name "
            {...register("name")}
            error={errors.name}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <CustomInput
            label="Description "
            {...register("description")}
            error={errors.description}
          />
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
            onClick={() => navigate("/departments")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isCreating || isUpdating}>
            {id ? "Update" : "Add"} Department
            {(isCreating || isUpdating) && (
              <Loader2 className="ml-2 animate-spin" size={20} />
            )}
          </Button>
        </div>
      </form>
    </AddUpdatePageLayout>
  );
};

export default AddUpdateDepartment;
