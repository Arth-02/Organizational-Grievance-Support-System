import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RoutableModal } from "@/components/ui/RoutedModal";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/DatePicker";
import MultipleSelector from "@/components/ui/MultiSelect";
import {
  X,
  Loader2,
  FolderKanban,
  Calendar,
  Users,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import {
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useGetProjectByIdQuery,
} from "@/services/project.service";
import { useGetAllUserNamesQuery } from "@/services/user.service";
import { createProjectSchema, updateProjectSchema } from "@/validators/project";
import { cn } from "@/lib/utils";

const PROJECT_TYPE_OPTIONS = [
  { value: "software", label: "Software" },
  { value: "business", label: "Business" },
  { value: "service_desk", label: "Service Desk" },
];

const PROJECT_STATUS_OPTIONS = [
  { value: "planned", label: "Planned", color: "text-slate-500" },
  { value: "active", label: "Active", color: "text-emerald-500" },
  { value: "on_hold", label: "On Hold", color: "text-amber-500" },
  { value: "completed", label: "Completed", color: "text-blue-500" },
  { value: "archived", label: "Archived", color: "text-gray-500" },
];

// Form Section component for visual grouping
const FormSection = ({ icon: Icon, title, children }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 pb-2 border-b border-border">
      <Icon size={18} className="text-primary" />
      <h3 className="font-medium text-foreground">{title}</h3>
    </div>
    {children}
  </div>
);

export default function ProjectForm({ projectId, onSuccess }) {
  const navigate = useNavigate();
  const isEditMode = !!projectId;

  // API hooks
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const { data: projectData, isLoading: isLoadingProject } = useGetProjectByIdQuery(
    projectId,
    { skip: !projectId }
  );
  const { data: usersData } = useGetAllUserNamesQuery();

  // Select open states for preventing modal close
  const [isTypeSelectOpen, setIsTypeSelectOpen] = useState(false);
  const [isStatusSelectOpen, setIsStatusSelectOpen] = useState(false);

  // Transform users data for MultiSelect
  const userOptions = useMemo(() => {
    if (!usersData?.data) return [];
    return usersData.data.map((user) => ({
      value: user._id,
      label: user.username || user.email,
    }));
  }, [usersData]);

  // Form setup
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(isEditMode ? updateProjectSchema : createProjectSchema),
    defaultValues: {
      name: "",
      key: "",
      description: "",
      project_type: "software",
      status: "active",
      start_date: null,
      end_date: null,
      members: [],
      manager: [],
    },
  });

  // Watch start_date for end_date validation
  const startDate = watch("start_date");

  // Populate form when editing
  useEffect(() => {
    if (projectData?.data && isEditMode) {
      const project = projectData.data;
      reset({
        name: project.name || "",
        key: project.key || "",
        description: project.description || "",
        project_type: project.project_type || "software",
        status: project.status || "active",
        start_date: project.start_date ? new Date(project.start_date) : null,
        end_date: project.end_date ? new Date(project.end_date) : null,
        members: project.members?.map((m) => m._id || m) || [],
        manager: project.manager?.map((m) => m._id || m) || [],
      });
    }
  }, [projectData, isEditMode, reset]);

  const handleClose = () => {
    if (!isTypeSelectOpen && !isStatusSelectOpen) {
      navigate("/projects");
    }
  };

  const onSubmit = async (data) => {
    try {
      // Prepare data for API
      const submitData = {
        ...data,
        start_date: data.start_date ? data.start_date.toISOString() : null,
        end_date: data.end_date ? data.end_date.toISOString() : null,
      };

      if (isEditMode) {
        // Remove key from update (can't change project key)
        delete submitData.key;
        const response = await updateProject({
          id: projectId,
          data: submitData,
        }).unwrap();
        toast.success(response.message || "Project updated successfully");
      } else {
        const response = await createProject(submitData).unwrap();
        toast.success(response.message || "Project created successfully");
        
        // Navigate to the new project board
        if (response.data?._id) {
          navigate(`/projects/${response.data._id}`);
          return;
        }
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/projects");
      }
    } catch (error) {
      console.error("Failed to save project:", error);
      toast.error(error.data?.message || "Failed to save project");
    }
  };

  const isLoading = isCreating || isUpdating;

  if (isLoadingProject && isEditMode) {
    return (
      <RoutableModal backTo="/projects" width="max-w-2xl" shouldRemoveCloseIcon={true}>
        <div className="bg-card rounded-xl p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </RoutableModal>
    );
  }

  return (
    <RoutableModal
      backTo="/projects"
      width="max-w-2xl"
      shouldRemoveCloseIcon={true}
      onPointerDownOutside={(e) => {
        if (isTypeSelectOpen || isStatusSelectOpen) {
          e.preventDefault();
        }
      }}
    >
      <div className="bg-card rounded-xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-border/50">
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="p-4 pb-2 flex items-center justify-between">
            <span className="text-xl font-semibold text-card-foreground">
              {isEditMode ? "Edit Project" : "New Project"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogTitle>
          <DialogDescription className="hidden"></DialogDescription>
        </DialogHeader>

        <Separator className="w-[95%] mx-auto bg-border/50" />

        {/* Form Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">
            {/* Basic Information */}
            <FormSection icon={FolderKanban} title="Basic Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project Name */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Project Name
                  </label>
                  <Input
                    {...register("name")}
                    className="bg-background/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all h-10"
                    placeholder="Enter project name"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-destructive"></span>
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Project Key */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Project Key
                  </label>
                  <Input
                    {...register("key")}
                    className={cn(
                      "bg-background/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all h-10 uppercase",
                      isEditMode && "opacity-60 cursor-not-allowed"
                    )}
                    placeholder="e.g., PROJ"
                    disabled={isEditMode}
                    maxLength={10}
                  />
                  {errors.key && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-destructive"></span>
                      {errors.key.message}
                    </p>
                  )}
                  {!isEditMode && (
                    <p className="text-xs text-muted-foreground">
                      2-10 uppercase letters/numbers. Used for task IDs (e.g., PROJ-101)
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                  Description
                  <span className="text-[10px] font-normal normal-case text-muted-foreground/70">
                    (Optional)
                  </span>
                </label>
                <Textarea
                  {...register("description")}
                  className="bg-background/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all min-h-[80px] resize-none"
                  placeholder="Describe your project..."
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-destructive"></span>
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Project Type and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project Type */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Project Type
                  </label>
                  <Controller
                    name="project_type"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        open={isTypeSelectOpen}
                        onOpenChange={setIsTypeSelectOpen}
                      >
                        <SelectTrigger className="w-full bg-background/50 hover:bg-muted border-border h-10 focus:ring-2 focus:ring-primary/20">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {PROJECT_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.project_type && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-destructive"></span>
                      {errors.project_type.message}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Status
                  </label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        open={isStatusSelectOpen}
                        onOpenChange={setIsStatusSelectOpen}
                      >
                        <SelectTrigger className="w-full bg-background/50 hover:bg-muted border-border h-10 focus:ring-2 focus:ring-primary/20">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {PROJECT_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <span className={cn("flex items-center gap-2", option.color)}>
                                <span className="w-2 h-2 rounded-full bg-current"></span>
                                {option.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.status && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-destructive"></span>
                      {errors.status.message}
                    </p>
                  )}
                </div>
              </div>
            </FormSection>

            {/* Timeline */}
            <FormSection icon={Calendar} title="Timeline">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Date */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                    Start Date
                    <span className="text-[10px] font-normal normal-case text-muted-foreground/70">
                      (Optional)
                    </span>
                  </label>
                  <Controller
                    name="start_date"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select start date"
                        buttonClassName="w-full bg-background/50 hover:bg-muted border-border h-10"
                      />
                    )}
                  />
                  {errors.start_date && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-destructive"></span>
                      {errors.start_date.message}
                    </p>
                  )}
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                    End Date
                    <span className="text-[10px] font-normal normal-case text-muted-foreground/70">
                      (Optional)
                    </span>
                  </label>
                  <Controller
                    name="end_date"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select end date"
                        buttonClassName="w-full bg-background/50 hover:bg-muted border-border h-10"
                        disabledDays={startDate ? { before: startDate } : undefined}
                      />
                    )}
                  />
                  {errors.end_date && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-destructive"></span>
                      {errors.end_date.message}
                    </p>
                  )}
                </div>
              </div>
            </FormSection>

            {/* Team Members (only for create mode) */}
            {!isEditMode && (
              <FormSection icon={Users} title="Team Members">
                <div className="space-y-4">
                  {/* Managers */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                      Project Managers
                      <span className="text-[10px] font-normal normal-case text-muted-foreground/70">
                        (Optional)
                      </span>
                    </label>
                    <Controller
                      name="manager"
                      control={control}
                      render={({ field }) => (
                        <MultipleSelector
                          value={userOptions.filter((opt) =>
                            field.value?.includes(opt.value)
                          )}
                          onChange={(selected) =>
                            field.onChange(selected.map((s) => s.value))
                          }
                          defaultOptions={userOptions}
                          placeholder="Select managers..."
                          emptyIndicator={
                            <p className="text-center text-sm text-muted-foreground">
                              No users found
                            </p>
                          }
                          className="bg-background/50"
                        />
                      )}
                    />
                  </div>

                  {/* Members */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                      Team Members
                      <span className="text-[10px] font-normal normal-case text-muted-foreground/70">
                        (Optional)
                      </span>
                    </label>
                    <Controller
                      name="members"
                      control={control}
                      render={({ field }) => (
                        <MultipleSelector
                          value={userOptions.filter((opt) =>
                            field.value?.includes(opt.value)
                          )}
                          onChange={(selected) =>
                            field.onChange(selected.map((s) => s.value))
                          }
                          defaultOptions={userOptions}
                          placeholder="Select team members..."
                          emptyIndicator={
                            <p className="text-center text-sm text-muted-foreground">
                              No users found
                            </p>
                          }
                          className="bg-background/50"
                        />
                      )}
                    />
                  </div>
                </div>
              </FormSection>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 bg-muted/30">
            <div className="flex justify-end items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-border/50 hover:bg-muted transition-colors"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all gap-2 px-6"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditMode ? "Update Project" : "Create Project"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </RoutableModal>
  );
}
