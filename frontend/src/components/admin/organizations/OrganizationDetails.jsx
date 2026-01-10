import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Users,
  Shield,
  Building,
  Check,
  X,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
  useGetAdminOrganizationByIdQuery,
  useApproveOrganizationMutation,
  useUpdateOrganizationStatusMutation,
  useDeleteOrganizationMutation,
} from "@/services/admin.service";
import toast from "react-hot-toast";
import OrganizationUsers from "./OrganizationUsers";


const StatCard = ({ icon: Icon, label, value, className }) => (
  <div className={`p-4 rounded-lg border ${className}`}>
    <div className="flex items-center gap-3">
      <div className="p-2 bg-primary/10 rounded-lg">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  </div>
);

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3">
    <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  </div>
);

const OrganizationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading, error } = useGetAdminOrganizationByIdQuery(id);
  const [approveOrg, { isLoading: isApproving }] = useApproveOrganizationMutation();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrganizationStatusMutation();
  const [deleteOrg, { isLoading: isDeleting }] = useDeleteOrganizationMutation();

  const org = data?.data;

  const handleApprove = async () => {
    try {
      await approveOrg(id).unwrap();
      toast.success("Organization approved successfully");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to approve organization");
    }
  };

  const handleToggleStatus = async () => {
    try {
      await updateStatus({ id, is_active: !org.is_active }).unwrap();
      toast.success(org.is_active ? "Organization suspended" : "Organization activated");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteOrg(id).unwrap();
      toast.success("Organization deleted successfully");
      navigate("/admin/organizations");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete organization");
    }
  };

  const getStatusBadge = () => {
    if (!org?.is_approved) {
      return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending Approval</Badge>;
    }
    if (!org?.is_active) {
      return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Suspended</Badge>;
    }
    return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Organization not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/organizations")}>
          Back to Organizations
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/organizations")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{org.name}</h1>
              {getStatusBadge()}
            </div>
            <p className="text-muted-foreground">{org.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!org.is_approved ? (
            <Button onClick={handleApprove} disabled={isApproving} className="bg-green-600 hover:bg-green-700">
              <Check className="h-4 w-4 mr-2" />
              {isApproving ? "Approving..." : "Approve"}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleToggleStatus}
              disabled={isUpdating}
            >
              {org.is_active ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  {isUpdating ? "Suspending..." : "Suspend"}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {isUpdating ? "Activating..." : "Activate"}
                </>
              )}
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this organization? This will deactivate all users
                  and projects associated with it. This action cannot be undone.
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={org.stats?.userCount || 0} />
        <StatCard icon={Building} label="Departments" value={org.stats?.departmentCount || 0} />
        <StatCard icon={Shield} label="Roles" value={org.stats?.roleCount || 0} />
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "users"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Users ({org.stats?.userCount || 0})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Organization Info */}
          <div className="border rounded-lg p-5">
            <h3 className="font-semibold mb-4">Organization Information</h3>
            <div className="divide-y">
              <InfoRow icon={Building2} label="Organization Name" value={org.name} />
              <InfoRow icon={Mail} label="Email" value={org.email} />
              <InfoRow icon={Phone} label="Phone" value={org.phone} />
              <InfoRow icon={Globe} label="Website" value={org.website} />
            </div>
          </div>

          {/* Address */}
          <div className="border rounded-lg p-5">
            <h3 className="font-semibold mb-4">Address</h3>
            <div className="divide-y">
              <InfoRow icon={MapPin} label="Address" value={org.address} />
              <InfoRow icon={MapPin} label="City" value={org.city} />
              <InfoRow icon={MapPin} label="State" value={org.state} />
              <InfoRow icon={MapPin} label="Country" value={org.country} />
              <InfoRow icon={MapPin} label="Pincode" value={org.pincode} />
            </div>
          </div>

          {/* Description */}
          <div className="border rounded-lg p-5 lg:col-span-2">
            <h3 className="font-semibold mb-4">Description</h3>
            <p className="text-muted-foreground">{org.description || "No description provided"}</p>
          </div>

          {/* Timestamps */}
          <div className="border rounded-lg p-5 lg:col-span-2">
            <h3 className="font-semibold mb-4">Timeline</h3>
            <div className="flex gap-8">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {org.created_at ? format(new Date(org.created_at), "PPP 'at' p") : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {org.updated_at ? format(new Date(org.updated_at), "PPP 'at' p") : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <OrganizationUsers orgId={id} />
      )}
    </div>
  );
};

export default OrganizationDetails;
