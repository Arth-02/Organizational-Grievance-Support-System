import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Search,
  RefreshCcw,
  MoreHorizontal,
  Eye,
  Trash2,
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
import { Badge } from "@/components/ui/badge";
import {
  useGetAdminGrievancesQuery,
  useUpdateAdminGrievanceStatusMutation,
  useDeleteAdminGrievanceMutation,
  useGetOrganizationNamesQuery,
} from "@/services/admin.service";
import toast from "react-hot-toast";

const getStatusConfig = (status) => {
  const configs = {
    submitted: { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Clock },
    "in-progress": { color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Loader2 },
    resolved: { color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle },
    dismissed: { color: "bg-red-500/10 text-red-600 border-red-500/20", icon: XCircle },
  };
  return configs[status] || configs.submitted;
};

const getPriorityConfig = (priority) => {
  const configs = {
    high: "bg-red-500/10 text-red-600",
    medium: "bg-yellow-500/10 text-yellow-600",
    low: "bg-green-500/10 text-green-600",
  };
  return configs[priority] || "bg-gray-500/10 text-gray-600";
};

const AdminGrievancesList = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    title: "",
    organization_id: "all",
    status: "all",
    priority: "all",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGrievanceId, setSelectedGrievanceId] = useState(null);

  const { data, isLoading, isFetching } = useGetAdminGrievancesQuery(filters);
  const { data: orgsData } = useGetOrganizationNamesQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateAdminGrievanceStatusMutation();
  const [deleteGrievance, { isLoading: isDeleting }] = useDeleteAdminGrievanceMutation();

  const grievances = data?.data?.grievances || [];
  const pagination = data?.data?.pagination;
  const organizations = orgsData?.data || [];

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateStatus({ id, status: newStatus }).unwrap();
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update status");
    }
  };

  const handleDeleteClick = (id) => {
    setSelectedGrievanceId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteGrievance(selectedGrievanceId).unwrap();
      toast.success("Grievance deleted successfully");
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete grievance");
    }
  };

  const handleSearchChange = (e) => {
    setFilters((prev) => ({ ...prev, title: e.target.value, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleResetFilters = () => {
    setFilters({ page: 1, limit: 10, title: "", organization_id: "all", status: "all", priority: "all" });
  };

  const hasActiveFilters = filters.title || filters.organization_id !== "all" || filters.status !== "all" || filters.priority !== "all";

  const renderLoadingState = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Grievances</h1>
        <p className="text-muted-foreground">Manage all grievances across organizations</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title..."
              value={filters.title}
              onChange={handleSearchChange}
              className="pl-9 w-64"
            />
          </div>
          <Select
            value={filters.organization_id}
            onValueChange={(value) => handleFilterChange("organization_id", value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Organization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              {organizations.map((org) => (
                <SelectItem key={org._id} value={org._id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.priority}
            onValueChange={(value) => handleFilterChange("priority", value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reported By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || isFetching ? (
              renderLoadingState()
            ) : grievances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No grievances found
                </TableCell>
              </TableRow>
            ) : (
              grievances.map((grievance) => {
                const statusConfig = getStatusConfig(grievance.status);
                return (
                  <TableRow key={grievance._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium line-clamp-1">{grievance.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {grievance.department_id?.name || "-"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{grievance.organization_id?.name || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getPriorityConfig(grievance.priority)}>
                        {grievance.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusConfig.color}>
                        {grievance.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {grievance.reported_by?.firstname} {grievance.reported_by?.lastname}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {grievance.date_reported
                        ? format(new Date(grievance.date_reported), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/grievances/${grievance._id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(grievance._id, "in-progress")}
                            disabled={isUpdating || grievance.status === "in-progress"}
                          >
                            <Loader2 className="h-4 w-4 mr-2" />
                            Mark In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(grievance._id, "resolved")}
                            disabled={isUpdating || grievance.status === "resolved"}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Resolved
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(grievance._id, "dismissed")}
                            disabled={isUpdating || grievance.status === "dismissed"}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Dismiss
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(grievance._id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Showing {grievances.length} of {pagination.totalItems} grievances
          </span>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                />
              </PaginationItem>
              {[...Array(Math.min(pagination.totalPages, 5))].map((_, i) => (
                <PaginationItem key={i}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(i + 1)}
                    className={`h-8 w-8 ${
                      pagination.currentPage === i + 1
                        ? "bg-primary text-primary-foreground hover:bg-primary/80"
                        : ""
                    }`}
                  >
                    {i + 1}
                  </Button>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Grievance</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this grievance? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminGrievancesList;
