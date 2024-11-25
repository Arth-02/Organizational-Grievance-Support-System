import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useParams, useNavigate } from "react-router-dom";
import { CustomInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import AddUpdatePageLayout from "@/components/layout/AddUpdatePageLayout";
import {
  useCreateProjectMutation,
  useGetProjectByIdQuery,
  useUpdateProjectMutation,
} from "@/services/project.service";
import { CustomTextarea } from "@/components/ui/textarea";
import MultipleSelector from "@/components/ui/MultiSelect";
import { DatePicker } from "@/components/ui/DatePicker";
import { useGetAllUserNamesQuery } from "@/services/user.service";
import { Loader2 } from "lucide-react";
import { CommandItem } from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const schema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .trim(),
  start_date: z.date({ required_error: "Start date is required" }),
  end_date: z.date().nullable(),
  manager: z.array(z.any()).min(1, "At least one manager is required"),
  members: z.array(z.any()).min(1, "At least one member is required"),
});

const AddUpdateProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const { data: project, isLoading: isProjectLoading } = useGetProjectByIdQuery(
    id,
    { skip: !id }
  );
  const { data: allUsers } = useGetAllUserNamesQuery();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    setValue
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      start_date: new Date(),
      end_date: null,
      manager: [],
      members: [],
    },
  });

  const onSubmit = async (data) => {
    console.log(data);
    try {
      if (id) {
        delete data.id;
        const { manager, members } = data;
        data.manager = manager.map((m) => m.value);
        data.members = members.map((m) => m.value);
        const response = await updateProject({ id, data }).unwrap();
        toast.success(response.message);
      } else {
        const { manager, members } = data;
        data.manager = manager.map((m) => m.value);
        data.members = members.map((m) => m.value);
        const response = await createProject(data).unwrap();
        toast.success(response.message);
      }
      navigate("/projects");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  };

  const renderDropDownOptionsWithAvatar = (option, handleSelect) => (
    <CommandItem
      key={option.value}
      value={option.value}
      onSelect={() => handleSelect(option)}
      className="cursor-pointer"
    >
      <Avatar>
        <AvatarImage src={option.avatar} alt={option.label} />
        <AvatarFallback>{option.label[0]}</AvatarFallback>
      </Avatar>
      <div className="ml-2">
        <p className="text-sm font-medium">{option.label}</p>
        <p className="text-sm text-gray-500">{option.description}</p>
      </div>
    </CommandItem>
  );

  useEffect(() => {
    if (project?.data) {
      Object.keys(project.data).forEach((key) => {
        if (key === "start_date" || key === "end_date") {
          setValue(key, new Date(project.data[key]));
        } else if (key === "manager" || key === "members") {
          setValue(key, formatUsersData(project.data[key]));
        } else {
          setValue(key, project.data[key]);
        }
      });
    }
  }, [project, setValue]);

  const formatUsersData = (users) => {
    return users?.map((user) => ({
      value: user._id,
      label: user.username,
      description: user.email,
      avatar: user.avatar,
    }));
  };

  if (isProjectLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  return (
    <AddUpdatePageLayout title={id ? "Update Project" : "Add Project"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomInput
            label="Name"
            {...register("name")}
            error={errors.name?.message}
          />
          <CustomTextarea
            label="Description"
            {...register("description")}
            error={errors.description?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="start_date"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Start Date"
                value={field.value}
                onChange={field.onChange}
                error={errors.start_date}
              />
            )}
          />
          <Controller
            name="end_date"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="End Date"
                value={field.value}
                onChange={field.onChange}
                error={errors.end_date}
                disabledDays={{ before: watch('start_date') }}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <Controller
              name="manager"
              control={control}
              render={({ field }) => (
                <MultipleSelector
                  label="Select Manager"
                  options={formatUsersData(allUsers?.data) || []}
                  placeholder="Select managers"
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                  renderOption={renderDropDownOptionsWithAvatar}
                  error={errors.manager?.message}
                />
              )}
            />
            {errors.manager && (
              <p className="text-red-500 text-sm">{errors.manager.message}</p>
            )}
          </div>
          <div>
            <Controller
              name="members"
              control={control}
              render={({ field }) => (
                <MultipleSelector
                  label="Select Members"
                  options={formatUsersData(allUsers?.data) || []}
                  placeholder="Select members"
                  value={field.value}
                  onChange={field.onChange}
                  renderOption={renderDropDownOptionsWithAvatar}
                  error={errors.members?.message}
                />
              )}
            />
            {errors.members && (
              <p className="text-red-500 text-sm">{errors.members.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/projects")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isCreating || isUpdating}>
            {id ? "Update" : "Add"} Project
            {(isCreating || isUpdating) && (
              <Loader2 className="ml-2 animate-spin" size={20} />
            )}
          </Button>
        </div>
      </form>
    </AddUpdatePageLayout>
  );
};

export default AddUpdateProject;
