import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  Building2,
  Calendar,
  User,
  FileText,
  Check,
  X,
  Trash2,
  LayoutList,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useGetAdminProjectByIdQuery,
  useUpdateAdminProjectStatusMutation,
  useDeleteAdminProjectMutation,
} from "@/services/admin.service";
import toast from "react-hot-toast";

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3">
    <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  </div>
);

const UserCard = ({ user, role }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg border">
    <Avatar className="h-10 w-10">
      <AvatarImage src={user?.avatar} alt={user?.username} />
      <AvatarFallback className="bg-primary/10 text-primary">
        {user?.username?.[0]?.toUpperCase() || "?"}
      </AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <p className="font-medium truncate">
        {user?.firstname} {user?.lastname}
      </p>
      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
    </div>
    {role && (
      <Badge variant="secondary" className="text-xs">
        {role}
      </Badge>
    )}
  </div>
);

const getSectionColor = (name) => {
  const colors = {
    todo: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    "in-progress": "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    done: "bg-green-500/10 text-green-600 border-green-500/20",
  };
  return colors[name?.toLowerCase()] || "bg-gray-500/10 text-gray-600 border-gray-500/20";
};

const getPriorityColor = (priority) => {
  const colors = {
    high: "bg-red-500/10 text-red-600",
    medium: "bg-yellow-500/10 text-yellow-600",
    low: "bg-green-500/10 text-green-600",
  };
  return colors[priority] || "bg-gray-500/10 text-gray-600";
};

const TaskSectionCard = ({ section }) => (
  <div className="border rounded-lg p-4">
    <div className="flex items-center justify-between mb-3">
      <Badge variant="outline" className={getSectionColor(section.name)}>
        {section.name}
      </Badge>
      <span className="text-sm font-medium">{section.taskCount} tasks</span>
    </div>
    {section.tasks && section.tasks.length > 0 ? (
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {section.tasks.map((task) => (
          <div
            key={task._id}
            className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm"
          >
            {task.is_finished ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
            )}
            <span className={`flex-1 truncate ${task.is_finished ? "line-through text-muted-foreground" : ""}`}>
              {task.title}
            </span>
            {task.priority && (
              <Badge variant="secondary" className={`text-xs ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </Badge>
            )}
          </div>
        ))}
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">No tasks in this section</p>
    )}
  </div>
);

const AdminProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useGetAdminProjectByIdQuery(id);
  const [updateStatus, { isLoading: isUpdating }] = useUpdateAdminProjectStatusMutation();
  const [deleteProject, { isLoading: isDeleting }] = useDeleteAdminProjectMutation();

  const project = data?.data;

  const handleToggleStatus = async () => {
    try {
      await updateStatus({ id, is_active: !project.is_active }).unwrap();
      toast.success(project.is_active ? "Project deactivated" : "Project activated");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProject(id).unwrap();
      toast.success("Project deleted successfully");
      navigate("/admin/projects");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete project");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/projects")}>
          Back to Projects
        </Button>
      </div>
    );
  }

  const managers = project.manager || [];
  const members = project.members || [];
  const taskSections = project.taskSections || [];
  const totalTasks = project.totalTasks || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/projects")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge
                variant="outline"
                className={
                  project.is_active
                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                    : "bg-red-500/10 text-red-600 border-red-500/20"
                }
              >
                {project.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-muted-foreground">{project.organization_id?.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleToggleStatus}
            disabled={isUpdating}
          >
            {project.is_active ? (
              <>
                <X className="h-4 w-4 mr-2" />
                {isUpdating ? "Deactivating..." : "Deactivate"}
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {isUpdating ? "Activating..." : "Activate"}
              </>
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this project? This will deactivate the project.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Project Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="border rounded-lg p-5">
          <h3 className="font-semibold mb-4">Project Information</h3>
          <div className="divide-y">
            <InfoRow icon={FileText} label="Project Name" value={project.name} />
            <InfoRow
              icon={Building2}
              label="Organization"
              value={project.organization_id?.name}
            />
            <InfoRow
              icon={User}
              label="Created By"
              value={
                project.created_by
                  ? `${project.created_by.firstname} ${project.created_by.lastname}`
                  : "-"
              }
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="border rounded-lg p-5">
          <h3 className="font-semibold mb-4">Timeline</h3>
          <div className="divide-y">
            <InfoRow
              icon={Calendar}
              label="Start Date"
              value={
                project.start_date
                  ? format(new Date(project.start_date), "PPP")
                  : "-"
              }
            />
            <InfoRow
              icon={Calendar}
              label="End Date"
              value={
                project.end_date
                  ? format(new Date(project.end_date), "PPP")
                  : "Not set"
              }
            />
            <InfoRow
              icon={Calendar}
              label="Created"
              value={
                project.created_at
                  ? format(new Date(project.created_at), "PPP 'at' p")
                  : "-"
              }
            />
          </div>
        </div>

        {/* Description */}
        <div className="border rounded-lg p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4">Description</h3>
          <p className="text-muted-foreground">
            {project.description || "No description provided"}
          </p>
        </div>

        {/* Task Sections */}
        <div className="border rounded-lg p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <LayoutList className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Task Sections</h3>
            </div>
            <Badge variant="secondary">{totalTasks} total tasks</Badge>
          </div>
          {taskSections.length === 0 ? (
            <p className="text-muted-foreground text-sm">No task sections found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {taskSections.map((section) => (
                <TaskSectionCard key={section.name} section={section} />
              ))}
            </div>
          )}
        </div>

        {/* Managers */}
        <div className="border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Managers</h3>
            <Badge variant="secondary">{managers.length}</Badge>
          </div>
          {managers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No managers assigned</p>
          ) : (
            <div className="space-y-2">
              {managers.map((manager) => (
                <UserCard key={manager._id} user={manager} role="Manager" />
              ))}
            </div>
          )}
        </div>

        {/* Members */}
        <div className="border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Members</h3>
            <Badge variant="secondary">{members.length}</Badge>
          </div>
          {members.length === 0 ? (
            <p className="text-muted-foreground text-sm">No members assigned</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {members.map((member) => (
                <UserCard key={member._id} user={member} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProjectDetails;
