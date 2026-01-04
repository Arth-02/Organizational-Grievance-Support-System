import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Building2,
  Users,
  FolderKanban,
  Check,
  X,
  Eye,
  MoreHorizontal,
  Search,
  RefreshCcw,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  useGetAdminOrganizationsQuery,
  useApproveOrganizationMutation,
  useRejectOrganizationMutation,
  useUpdateOrganizationStatusMutation,
} from "@/services/admin.service";
import toast from "react-hot-toast";
import RejectDialog from "./RejectDialog";


const OrganizationsList = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    name: "",
    is_approved: "all",
  });
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState(null);

  const { data, isLoading, isFetching } = useGetAdminOrganizationsQuery(filters);
  const [approveOrg, { isLoading: isApproving }] = useApproveOrganizationMutation();
  const [rejectOrg, { isLoading: isRejecting }] = useRejectOrganizationMutation();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrganizationStatusMutation();

  const organizations = data?.data?.organizations || [];
  const pagination = data?.data?.pagination;

  const handleApprove = async (id) => {
    try {
      await approveOrg(id).unwrap();
      toast.success("Organization approved successfully");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to approve organization");
    }
  };

  const handleRejectClick = (id) => {
    setSelectedOrgId(id);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async (reason) => {
    try {
      await rejectOrg({ id: selectedOrgId, reason }).unwrap();
      toast.success("Organization rejected successfully");
      setRejectDialogOpen(false);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to reject organization");
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await updateStatus({ id, is_active: !currentStatus }).unwrap();
      toast.success(currentStatus ? "Organization suspended" : "Organization activated");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update status");
    }
  };

  const handleSearchChange = (e) => {
    setFilters((prev) => ({ ...prev, name: e.target.value, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleResetFilters = () => {
    setFilters({ page: 1, limit: 10, name: "", is_approved: "all" });
  };

  const getStatusBadge = (org) => {
    if (!org.is_approved) {
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>;
    }
    if (!org.is_active) {
      return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">Suspended</Badge>;
    }
    return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
  };

  const renderLoadingState = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
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
        <h1 className="text-2xl font-bold">Organizations</h1>
        <p className="text-muted-foreground">Manage all organizations in the system</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={filters.name}
              onChange={handleSearchChange}
              className="pl-9 w-64"
            />
          </div>
          <Select
            value={filters.is_approved}
            onValueChange={(value) => handleFilterChange("is_approved", value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Approved</SelectItem>
              <SelectItem value="false">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(filters.name || filters.is_approved !== "all") && (
          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || isFetching ? (
              renderLoadingState()
            ) : organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No organizations found
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((org) => (
                <TableRow key={org._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{org.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{org.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {org.city}, {org.state}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{org.userCount || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <FolderKanban className="h-4 w-4 text-muted-foreground" />
                      <span>{org.projectCount || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(org)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDistanceToNow(new Date(org.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/admin/organizations/${org._id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {!org.is_approved ? (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleApprove(org._id)}
                              disabled={isApproving}
                              className="text-green-600"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRejectClick(org._id)}
                              disabled={isRejecting}
                              className="text-red-600"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(org._id, org.is_active)}
                            disabled={isUpdating}
                          >
                            {org.is_active ? (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                Suspend
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Showing {organizations.length} of {pagination.totalItems} organizations
          </span>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                />
              </PaginationItem>
              {[...Array(pagination.totalPages)].map((_, i) => (
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

      {/* Reject Dialog */}
      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={handleRejectConfirm}
        isLoading={isRejecting}
      />
    </div>
  );
};

export default OrganizationsList;
