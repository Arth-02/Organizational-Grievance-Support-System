import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useParams, useNavigate } from "react-router-dom";
import { CustomInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import AddUpdatePageLayout from "@/components/layout/AddUpdatePageLayout";
import RichTextEditor from "./TextEditor";
import { useCreateGrievanceMutation, useGetGrievanceByIdQuery, useUpdateGrievanceMutation } from "@/services/grievance.service";
import { useGetAllDepartmentNameQuery } from "@/services/department.service";

const schema = z.object({
  title: z.string().nonempty("Title is required"),
  description: z.string().nonempty("Description is required"),
  department_id: z.string().nonempty("Department is required"),
  priority: z.string().nonempty("Priority is required"),
  status: z.string(),
  is_active: z.boolean(),
  assigned_to: z.string().optional(),
  rank: z.string().nonempty("Rank is required"),
});

const priorityOptions = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

const statusOptions = [
  { label: "Submitted", value: "submitted" },
  { label: "In Progress", value: "in-progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Dismissed", value: "dismissed" },
];

const AddUpdateGrievance = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [createGrievance, { isLoading: isCreating }] = useCreateGrievanceMutation();
  const [updateGrievance, { isLoading: isUpdating }] = useUpdateGrievanceMutation();

  const { data: grievance, isLoading: isGrievanceLoading } =
    useGetGrievanceByIdQuery(id, {
      skip: !id,
    });
  const { data: departments } = useGetAllDepartmentNameQuery();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      department_id: "",
      priority: "low",
      status: "submitted",
      reported_by: "",
      assigned_to: "",
    },
  });

  useEffect(() => {
    if (grievance) {
      reset(grievance.data);
    }
  }, [grievance, reset]);

  const onSubmit = async (data) => {
    try {
      if (id) {
        const response = await updateGrievance({ id, data }).unwrap();
        toast.success(response.message);
      } else {
        const response = await createGrievance(data).unwrap();
        toast.success(response.message);
      }
      navigate("/grievances");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  };

  if (isGrievanceLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AddUpdatePageLayout title={id ? "Update Grievance" : "Add Grievance"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <CustomInput
          label="Title"
          placeholder="Enter title"
          {...register("title")}
          error={errors.title}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Description
          </label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <div>
                <RichTextEditor
                  initialContent={field.value}
                  onSave={(content) => field.onChange(content)}
                  className="min-h-[200px]"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.description.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <CustomSelect
            label="Department"
            name="department_id"
            control={control}
            options={departments?.data?.map((dept) => ({
              label: dept.name,
              value: dept._id,
            }))}
            placeholder="Select a department"
            error={errors.department_id}
          />
          <CustomSelect
            label="Priority"
            name="priority"
            control={control}
            options={priorityOptions}
            placeholder="Select priority"
            error={errors.priority}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <CustomSelect
            label="Reported By"
            name="reported_by"
            control={control}
            placeholder="Select reporter"
            error={errors.reported_by}
          />
          <CustomSelect
            label="Assigned To"
            name="assigned_to"
            control={control}
            placeholder="Select assignee"
            error={errors.assigned_to}
          />
        </div>

        {id && (
          <CustomSelect
            label="Status"
            name="status"
            control={control}
            options={statusOptions}
            placeholder="Select status"
            error={errors.status}
          />
        )}

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/grievances")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isCreating || isUpdating}>
            {id ? "Update" : "Add"} Grievance
            {(isCreating || isUpdating) && (
              <Loader2 className="ml-2 animate-spin" size={20} />
            )}
          </Button>
        </div>
      </form>
    </AddUpdatePageLayout>
  );
};

export default AddUpdateGrievance;