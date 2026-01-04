import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Shield,
  Users,
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
  useGetAdminRoleByIdQuery,
  useUpdateAdminRoleStatusMutation,
  useDeleteAdminRoleMutation,
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

const UserCard = ({ user }) => (
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
    <Badge
      variant="outline"
      className={
        user?.is_active
          ? "bg-green-500/10 text-green-600 border-green-500/20"
          : "bg-red-500/10 text-red-600 border-red-500/20"
      }
    >
      {user?.is_active ? "Active" : "Inactive"}
    </Badge>
  </div>
);

const AdminRoleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useGetAdminRoleByIdQuery(id);
  const [updateStatus, { isLoading: isUpdating }] = useUpdateAdminRoleStatusMutation();
  const [deleteRole, { isLoading: isDeleting }] = useDeleteAdminRoleMutation();

  const role = data?.data;

  const handleToggleStatus = async () => {
    try {
      await updateStatus({ id, is_active: !role.is_active }).unwrap();
      toast.success(role.is_active ? "Role deactivated" : "Role activated");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRole(id).unwrap();
      toast.success("Role deleted successfully");
      navigate("/admin/roles");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete role");
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

  if (error || !role) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Role not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/roles")}>
          Back to Roles
        </Button>
      </div>
    );
  }

  const users = role.users || [];
  const permissions = role.permissions || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/roles")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">{role.name}</h1>
              <Badge
                variant="outline"
                className={
                  role.is_active
                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                    : "bg-red-500/10 text-red-600 border-red-500/20"
                }
              >
                {role.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-muted-foreground">{role.organization_id?.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleToggleStatus}
            disabled={isUpdating}
          >
            {role.is_active ? (
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
              <Button variant="destructive" disabled={isDeleting || users.length > 0}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Role</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this role? This action cannot be undone.
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

      {/* Role Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="border rounded-lg p-5">
          <h3 className="font-semibold mb-4">Role Information</h3>
          <div className="divide-y">
            <InfoRow icon={Shield} label="Role Name" value={role.name} />
            <InfoRow
              icon={Building2}
              label="Organization"
              value={role.organization_id?.name}
            />
            <InfoRow
              icon={Users}
              label="Assigned Users"
              value={`${role.userCount || 0} users`}
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="border rounded-lg p-5">
          <h3 className="font-semibold mb-4">Timeline</h3>
          <div className="divide-y">
            <InfoRow
              icon={Calendar}
              label="Created"
              value={
                role.created_at
                  ? format(new Date(role.created_at), "PPP 'at' p")
                  : "-"
              }
            />
            <InfoRow
              icon={Calendar}
              label="Last Updated"
              value={
                role.updated_at
                  ? format(new Date(role.updated_at), "PPP 'at' p")
                  : "-"
              }
            />
          </div>
        </div>

        {/* Permissions */}
        <div className="border rounded-lg p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Permissions</h3>
            <Badge variant="secondary">{permissions.length}</Badge>
          </div>
          {permissions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No permissions assigned</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {permissions.map((permission) => (
                <Badge key={permission} variant="outline" className="bg-primary/5">
                  {permission}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Users with this role */}
        <div className="border rounded-lg p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Users with this Role</h3>
            <Badge variant="secondary">{users.length}</Badge>
          </div>
          {users.length === 0 ? (
            <p className="text-muted-foreground text-sm">No users assigned to this role</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {users.map((user) => (
                <UserCard key={user._id} user={user} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRoleDetails;
