import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  Building2,
  Calendar,
  User,
  FileText,
  Briefcase,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Paperclip,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetAdminGrievanceByIdQuery,
  useUpdateAdminGrievanceStatusMutation,
  useDeleteAdminGrievanceMutation,
} from "@/services/admin.service";
import toast from "react-hot-toast";

const getStatusConfig = (status) => {
  const configs = {
    submitted: { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Clock, label: "Submitted" },
    "in-progress": { color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Loader2, label: "In Progress" },
    resolved: { color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle, label: "Resolved" },
    dismissed: { color: "bg-red-500/10 text-red-600 border-red-500/20", icon: XCircle, label: "Dismissed" },
  };
  return configs[status] || configs.submitted;
};

const getPriorityConfig = (priority) => {
  const configs = {
    high: { color: "bg-red-500/10 text-red-600 border-red-500/20", label: "High Priority" },
    medium: { color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", label: "Medium Priority" },
    low: { color: "bg-green-500/10 text-green-600 border-green-500/20", label: "Low Priority" },
  };
  return configs[priority] || { color: "bg-gray-500/10 text-gray-600", label: priority };
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3">
    <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  </div>
);

const AdminGrievanceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useGetAdminGrievanceByIdQuery(id);
  const [updateStatus, { isLoading: isUpdating }] = useUpdateAdminGrievanceStatusMutation();
  const [deleteGrievance, { isLoading: isDeleting }] = useDeleteAdminGrievanceMutation();

  const grievance = data?.data;

  const handleStatusChange = async (newStatus) => {
    try {
      await updateStatus({ id, status: newStatus }).unwrap();
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGrievance(id).unwrap();
      toast.success("Grievance deleted successfully");
      navigate("/admin/grievances");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete grievance");
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

  if (error || !grievance) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Grievance not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/grievances")}>
          Back to Grievances
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(grievance.status);
  const priorityConfig = getPriorityConfig(grievance.priority);
  const attachments = grievance.attachments || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/grievances")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-muted-foreground" />
              <h1 className="text-2xl font-bold">{grievance.title}</h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={statusConfig.color}>
                {statusConfig.label}
              </Badge>
              <Badge variant="outline" className={priorityConfig.color}>
                {priorityConfig.label}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Select
            value={grievance.status}
            onValueChange={handleStatusChange}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Change Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Grievance</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this grievance? This action cannot be undone.
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

      {/* Grievance Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="border rounded-lg p-5">
          <h3 className="font-semibold mb-4">Grievance Information</h3>
          <div className="divide-y">
            <InfoRow icon={FileText} label="Title" value={grievance.title} />
            <InfoRow
              icon={Building2}
              label="Organization"
              value={grievance.organization_id?.name}
            />
            <InfoRow
              icon={Briefcase}
              label="Department"
              value={grievance.department_id?.name}
            />
          </div>
        </div>

        {/* Reporter Info */}
        <div className="border rounded-lg p-5">
          <h3 className="font-semibold mb-4">Reported By</h3>
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={grievance.reported_by?.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {grievance.reported_by?.username?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {grievance.reported_by?.firstname} {grievance.reported_by?.lastname}
              </p>
              <p className="text-sm text-muted-foreground">{grievance.reported_by?.email}</p>
            </div>
          </div>
          <div className="divide-y">
            <InfoRow icon={User} label="Username" value={grievance.reported_by?.username} />
            {grievance.reported_by?.phone && (
              <InfoRow icon={User} label="Phone" value={grievance.reported_by?.phone} />
            )}
          </div>
        </div>

        {/* Description */}
        <div className="border rounded-lg p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4">Description</h3>
          {grievance.description ? (
            <div 
              className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: grievance.description }}
            />
          ) : (
            <p className="text-muted-foreground">No description provided</p>
          )}
        </div>

        {/* Assigned To */}
        {grievance.assigned_to && (
          <div className="border rounded-lg p-5">
            <h3 className="font-semibold mb-4">Assigned To</h3>
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={grievance.assigned_to?.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {grievance.assigned_to?.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {grievance.assigned_to?.firstname} {grievance.assigned_to?.lastname}
                </p>
                <p className="text-sm text-muted-foreground">{grievance.assigned_to?.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="border rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Attachments</h3>
              <Badge variant="secondary">{attachments.length}</Badge>
            </div>
            <div className="space-y-2">
              {attachments.map((attachment, index) => (
                <div
                  key={attachment._id || index}
                  className="flex items-center gap-2 p-2 rounded bg-muted/50"
                >
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate">
                    {attachment.filename || attachment.name || `Attachment ${index + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className={`border rounded-lg p-5 ${!grievance.assigned_to && attachments.length === 0 ? "lg:col-span-2" : ""}`}>
          <h3 className="font-semibold mb-4">Timeline</h3>
          <div className="divide-y">
            <InfoRow
              icon={Calendar}
              label="Date Reported"
              value={
                grievance.date_reported
                  ? format(new Date(grievance.date_reported), "PPP 'at' p")
                  : "-"
              }
            />
            <InfoRow
              icon={Calendar}
              label="Last Updated"
              value={
                grievance.updated_at
                  ? format(new Date(grievance.updated_at), "PPP 'at' p")
                  : "-"
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminGrievanceDetails;
