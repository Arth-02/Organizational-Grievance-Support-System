import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Briefcase,
  Calendar,
  Clock,
  Check,
  X,
  Trash2,
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
  useGetAdminUserByIdQuery,
  useUpdateAdminUserStatusMutation,
  useDeleteAdminUserMutation,
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

const AdminUserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useGetAdminUserByIdQuery(id);
  const [updateStatus, { isLoading: isUpdating }] = useUpdateAdminUserStatusMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteAdminUserMutation();

  const user = data?.data;

  const handleToggleStatus = async () => {
    try {
      await updateStatus({ id, is_active: !user.is_active }).unwrap();
      toast.success(user.is_active ? "User deactivated" : "User activated");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(id).unwrap();
      toast.success("User deleted successfully");
      navigate("/admin/users");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete user");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">User not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/users")}>
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/users")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar} alt={user.username} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {user.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">
                  {user.firstname} {user.lastname}
                </h1>
                <Badge
                  variant="outline"
                  className={
                    user.is_active
                      ? "bg-green-500/10 text-green-600 border-green-500/20"
                      : "bg-red-500/10 text-red-600 border-red-500/20"
                  }
                >
                  {user.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-muted-foreground">@{user.username}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleToggleStatus}
            disabled={isUpdating}
          >
            {user.is_active ? (
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
                <AlertDialogTitle>Delete User</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this user? This action cannot be undone.
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

      {/* User Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="border border-border bg-card rounded-lg p-5">
          <h3 className="font-semibold mb-4">Personal Information</h3>
          <div className="divide-y">
            <InfoRow icon={User} label="Full Name" value={`${user.firstname} ${user.lastname}`} />
            <InfoRow icon={User} label="Username" value={user.username} />
            <InfoRow icon={Mail} label="Email" value={user.email} />
            <InfoRow icon={Phone} label="Phone" value={user.phone} />
          </div>
        </div>

        {/* Organization Info */}
        <div className="border border-border bg-card rounded-lg p-5">
          <h3 className="font-semibold mb-4">Organization Details</h3>
          <div className="divide-y">
            <InfoRow
              icon={Building2}
              label="Organization"
              value={user.organization_id?.name}
            />
            <InfoRow icon={Shield} label="Role" value={user.role?.name} />
            <InfoRow icon={Briefcase} label="Department" value={user.department?.name} />
          </div>
        </div>

        {/* Permissions */}
        {user.role?.permissions && user.role.permissions.length > 0 && (
          <div className="border border-border bg-card rounded-lg p-5 lg:col-span-2">
            <h3 className="font-semibold mb-4">Permissions</h3>
            <div className="flex flex-wrap gap-2">
              {user.role.permissions.map((permission) => (
                <Badge key={permission} variant="secondary">
                  {permission}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="border border-border bg-card rounded-lg p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4">Activity</h3>
          <div className="flex gap-8 flex-wrap">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {user.created_at ? format(new Date(user.created_at), "PPP 'at' p") : "-"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Last Login</p>
                <p className="font-medium">
                  {user.last_login ? format(new Date(user.last_login), "PPP 'at' p") : "Never"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {user.updated_at ? format(new Date(user.updated_at), "PPP 'at' p") : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetails;
