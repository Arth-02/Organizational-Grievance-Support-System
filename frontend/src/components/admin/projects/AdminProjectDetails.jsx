import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  useGetAdminProjectByIdQuery,
  useUpdateAdminProjectStatusMutation,
  useDeleteAdminProjectMutation,
} from "@/services/admin.service";
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
  ArrowLeft,
  Building2,
  Calendar,
  FolderKanban,
  ListTodo,
  Trash2,
  Users,
  User,
  CheckCircle2,
  Circle,
  Check,
  X,
  Clock,
} from "lucide-react";
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

const AdminProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useGetAdminProjectByIdQuery(id);
  const [updateStatus, { isLoading: isUpdating }] = useUpdateAdminProjectStatusMutation();
  const [deleteProject, { isLoading: isDeleting }] = useDeleteAdminProjectMutation();

  const project = data?.data;

  const handleStatusToggle = async () => {
    const newStatus = project.status !== "active";
    try {
      await updateStatus({ id: project._id, is_active: newStatus }).unwrap();
      toast.success(`Project ${newStatus ? "activated" : "archived"} successfully`);
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

  const getStatusBadge = (status) => {
    const variants = {
      active: "bg-green-500/10 text-green-600 border-green-500/20",
      planned: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      on_hold: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      completed: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      archived: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    };
    return (
      <Badge variant="outline" className={variants[status] || variants.active}>
        {status?.replace("_", " ")}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      highest: "bg-red-500/10 text-red-600 border-red-500/20",
      high: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      low: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      lowest: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    };
    return (
      <Badge variant="outline" className={variants[priority] || ""}>
        {priority}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-6">
          <Skeleton className="h-16 w-16 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
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
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderKanban className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{project.name}</h1>
                {getStatusBadge(project.status)}
              </div>
              <p className="text-muted-foreground">{project.key}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleStatusToggle}
            disabled={isUpdating}
          >
            {project.status === "active" ? (
              <>
                <X className="h-4 w-4 mr-2" />
                {isUpdating ? "Archiving..." : "Archive"}
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
                  Are you sure you want to delete &quot;{project.name}&quot;? This action
                  cannot be undone.
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-border bg-card rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <ListTodo className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{project.stats?.totalTasks || 0}</p>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
            </div>
          </div>
        </div>
        <div className="border border-border bg-card rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{project.stats?.memberCount || 0}</p>
              <p className="text-sm text-muted-foreground">Members</p>
            </div>
          </div>
        </div>
        <div className="border border-border bg-card rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <User className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{project.stats?.managerCount || 0}</p>
              <p className="text-sm text-muted-foreground">Managers</p>
            </div>
          </div>
        </div>
        <div className="border border-border bg-card rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Building2 className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-medium truncate">
                {project.organization_id?.name || "N/A"}
              </p>
              <p className="text-sm text-muted-foreground">Organization</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Info */}
        <div className="border border-border bg-card rounded-lg p-5">
          <h3 className="font-semibold mb-4">Project Information</h3>
          <div className="divide-y">
            <InfoRow
              icon={FolderKanban}
              label="Type"
              value={project.project_type?.replace("_", " ")}
            />
            {project.description && (
              <div className="py-3">
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{project.description}</p>
              </div>
            )}
            <InfoRow
              icon={Calendar}
              label="Start Date"
              value={project.start_date ? format(new Date(project.start_date), "PPP") : "Not set"}
            />
            {project.end_date && (
              <InfoRow
                icon={Calendar}
                label="End Date"
                value={format(new Date(project.end_date), "PPP")}
              />
            )}
            <InfoRow
              icon={User}
              label="Created By"
              value={
                project.created_by
                  ? `${project.created_by.firstname} ${project.created_by.lastname}`
                  : "N/A"
              }
            />
            <InfoRow
              icon={Clock}
              label="Created At"
              value={project.created_at ? format(new Date(project.created_at), "PPP 'at' p") : "-"}
            />
          </div>
        </div>

        {/* Task Sections */}
        <div className="border border-border bg-card rounded-lg p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4">
            Task Sections ({project.sections?.length || 0})
          </h3>
          {project.sections?.length > 0 ? (
            <div className="space-y-4">
              {project.sections.map((section) => (
                <div key={section.key} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{section.label}</Badge>
                      <span className="text-sm text-muted-foreground">
                        ({section.taskCount} tasks)
                      </span>
                    </div>
                  </div>
                  {project.tasksGrouped?.[section.key]?.length > 0 ? (
                    <div className="space-y-2">
                      {project.tasksGrouped[section.key].map((task) => (
                        <div
                          key={task._id}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                        >
                          <div className="flex items-center gap-3">
                            {task.status === "done" ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div>
                              <p className="text-sm font-medium">{task.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {task.issue_key}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getPriorityBadge(task.priority)}
                            {task.assignee && (
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={task.assignee.avatar} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {task.assignee.firstname?.[0]}
                                  {task.assignee.lastname?.[0]}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </div>
                      ))}
                      {section.taskCount > 10 && (
                        <p className="text-xs text-muted-foreground text-center pt-2">
                          +{section.taskCount - 10} more tasks
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No tasks in this section</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No task sections configured
            </p>
          )}
        </div>
      </div>

      {/* Team Members */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Managers */}
        <div className="border border-border bg-card rounded-lg p-5">
          <h3 className="font-semibold mb-4">Managers ({project.manager?.length || 0})</h3>
          {project.manager?.length > 0 ? (
            <div className="space-y-3">
              {project.manager.map((manager) => (
                <div key={manager._id} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={manager.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {manager.firstname?.[0]}
                      {manager.lastname?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {manager.firstname} {manager.lastname}
                    </p>
                    <p className="text-sm text-muted-foreground">{manager.email}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No managers assigned</p>
          )}
        </div>

        {/* Members */}
        <div className="border border-border bg-card rounded-lg p-5">
          <h3 className="font-semibold mb-4">Members ({project.members?.length || 0})</h3>
          {project.members?.length > 0 ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {project.members.map((member) => (
                <div key={member._id} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {member.firstname?.[0]}
                      {member.lastname?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {member.firstname} {member.lastname}
                    </p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No members assigned</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProjectDetails;
