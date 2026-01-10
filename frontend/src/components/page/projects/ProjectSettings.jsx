import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSelector } from "react-redux";
import {
  Settings,
  Users,
  UserCog,
  Trash2,
  ArrowLeft,
  Loader2,
  Calendar,
  FolderKanban,
  AlertTriangle,
  Save,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/DatePicker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";
import {
  useGetProjectByIdQuery,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useAddProjectMembersMutation,
  useRemoveProjectMembersMutation,
} from "@/services/project.service";
import { useGetAllUserNamesQuery } from "@/services/user.service";
import { updateProjectSchema } from "@/validators/project";
import { cn } from "@/lib/utils";
import MemberSelector from "./MemberSelector";

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

const ProjectSettings = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("details");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTypeSelectOpen, setIsTypeSelectOpen] = useState(false);
  const [isStatusSelectOpen, setIsStatusSelectOpen] = useState(false);

  // User permissions
  const userPermissions = useSelector((state) => state.user.permissions);
  const canUpdate = userPermissions.includes("UPDATE_PROJECT");
  const canDelete = userPermissions.includes("DELETE_PROJECT");

  // API hooks
  const { data: projectData, isLoading: isLoadingProject, refetch } = useGetProjectByIdQuery(projectId);
  const { data: usersData } = useGetAllUserNamesQuery();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();
  const [addProjectMembers, { isLoading: isAddingMembers }] = useAddProjectMembersMutation();
  const [removeProjectMembers, { isLoading: isRemovingMembers }] = useRemoveProjectMembersMutation();

  const project = projectData?.data;

  // Transform users data for member selector
  const allUsers = useMemo(() => {
    if (!usersData?.data) return [];
    return usersData.data.map((user) => ({
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
      email: user.email,
    }));
  }, [usersData]);

  // Form setup
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      project_type: "software",
      status: "active",
      start_date: null,
      end_date: null,
    },
  });

  const startDate = watch("start_date");

  // Populate form when project data loads
  useEffect(() => {
    if (project) {
      reset({
        name: project.name || "",
        description: project.description || "",
        project_type: project.project_type || "software",
        status: project.status || "active",
        start_date: project.start_date ? new Date(project.start_date) : null,
        end_date: project.end_date ? new Date(project.end_date) : null,
      });
    }
  }, [project, reset]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      const submitData = {
        ...data,
        start_date: data.start_date ? data.start_date.toISOString() : null,
        end_date: data.end_date ? data.end_date.toISOString() : null,
      };

      const response = await updateProject({
        id: projectId,
        data: submitData,
      }).unwrap();

      toast.success(response.message || "Project updated successfully");
      reset(data); // Reset form state to mark as not dirty
    } catch (error) {
      console.error("Failed to update project:", error);
      toast.error(error.data?.message || "Failed to update project");
    }
  };

  // Handle adding members
  const handleAddMembers = async (userIds) => {
    try {
      const response = await addProjectMembers({
        id: projectId,
        data: { members: userIds },
      }).unwrap();
      toast.success(response.message || "Members added successfully");
      refetch();
    } catch (error) {
      console.error("Failed to add members:", error);
      toast.error(error.data?.message || "Failed to add members");
    }
  };

  // Handle removing a member
  const handleRemoveMember = async (userId) => {
    try {
      const response = await removeProjectMembers({
        id: projectId,
        data: { members: [userId] },
      }).unwrap();
      toast.success(response.message || "Member removed successfully");
      refetch();
    } catch (error) {
      console.error("Failed to remove member:", error);
      toast.error(error.data?.message || "Failed to remove member");
    }
  };

  // Handle adding managers
  const handleAddManagers = async (userIds) => {
    try {
      const response = await addProjectMembers({
        id: projectId,
        data: { manager: userIds },
      }).unwrap();
      toast.success(response.message || "Managers added successfully");
      refetch();
    } catch (error) {
      console.error("Failed to add managers:", error);
      toast.error(error.data?.message || "Failed to add managers");
    }
  };

  // Handle removing a manager
  const handleRemoveManager = async (userId) => {
    try {
      const response = await removeProjectMembers({
        id: projectId,
        data: { manager: [userId] },
      }).unwrap();
      toast.success(response.message || "Manager removed successfully");
      refetch();
    } catch (error) {
      console.error("Failed to remove manager:", error);
      toast.error(error.data?.message || "Failed to remove manager");
    }
  };

  // Handle project deletion
  const handleDeleteProject = async () => {
    setIsDeleting(true);
    try {
      const response = await deleteProject(projectId).unwrap();
      toast.success(response.message || "Project deleted successfully");
      navigate("/projects");
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error(error.data?.message || "Failed to delete project");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Loading state
  if (isLoadingProject) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex-1 py-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (!project) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <p className="text-destructive">Project not found</p>
        <Button variant="link" onClick={() => navigate("/projects")}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/projects/${projectId}`)}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Project Settings
            </h1>
            <p className="text-sm text-muted-foreground">
              {project.name} ({project.key})
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-y-auto py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="details" className="gap-2">
              <FolderKanban className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="managers" className="gap-2">
              <UserCog className="h-4 w-4" />
              Managers
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
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
                      disabled={!canUpdate}
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

                  {/* Project Key (read-only) */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                      Project Key
                    </label>
                    <Input
                      value={project.key}
                      disabled
                      className="bg-muted/50 border-border h-10 uppercase opacity-60 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      Project key cannot be changed
                    </p>
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
                    disabled={!canUpdate}
                    className="bg-background/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all min-h-[80px] resize-none"
                    placeholder="Describe your project..."
                    rows={3}
                  />
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
                          disabled={!canUpdate}
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
                          disabled={!canUpdate}
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
                          disabled={!canUpdate}
                        />
                      )}
                    />
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
                          disabled={!canUpdate}
                        />
                      )}
                    />
                  </div>
                </div>
              </FormSection>

              {/* Save Button */}
              {canUpdate && (
                <div className="flex justify-end pt-4 border-t border-border">
                  <Button
                    type="submit"
                    disabled={isUpdating || !isDirty}
                    className="gap-2"
                  >
                    {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              )}

              {/* Danger Zone */}
              {canDelete && (
                <div className="pt-6">
                  <Separator className="mb-6" />
                  <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                    <h3 className="text-sm font-semibold text-destructive flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      Danger Zone
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Once you delete a project, there is no going back. Please be certain.
                    </p>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Project
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="max-w-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Team Members</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage who has access to this project
                  </p>
                </div>
              </div>
              
              <MemberSelector
                users={allUsers}
                selectedUsers={project.members || []}
                onAdd={handleAddMembers}
                onRemove={handleRemoveMember}
                label="Project Members"
                placeholder="Search users to add..."
                disabled={!canUpdate || isAddingMembers || isRemovingMembers}
                emptyMessage="No users available to add"
              />
            </div>
          </TabsContent>

          {/* Managers Tab */}
          <TabsContent value="managers" className="max-w-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Project Managers</h3>
                  <p className="text-sm text-muted-foreground">
                    Managers have full control over project settings and tasks
                  </p>
                </div>
              </div>
              
              <MemberSelector
                users={allUsers}
                selectedUsers={project.manager || []}
                onAdd={handleAddManagers}
                onRemove={handleRemoveManager}
                label="Project Managers"
                placeholder="Search users to add as manager..."
                disabled={!canUpdate || isAddingMembers || isRemovingMembers}
                emptyMessage="No users available to add"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border border-border dark:border-secondary shadow-xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-lg font-semibold text-card-foreground">
                Delete Project
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete &quot;
              <span className="font-medium text-foreground">{project.name}</span>
              &quot;? This will permanently delete all tasks, boards, and data associated with this project. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="border-border hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectSettings;
