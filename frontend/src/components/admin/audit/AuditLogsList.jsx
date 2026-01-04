import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import {
  RefreshCcw,
  Building2,
  User,
  FolderKanban,
  Shield,
  AlertTriangle,
  Briefcase,
  Activity,
  Calendar,
  Filter,
  Eye,
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useGetAuditLogsQuery,
  useGetAuditLogStatsQuery,
  useGetOrganizationNamesQuery,
} from "@/services/admin.service";

const getEntityIcon = (entityType) => {
  const icons = {
    Organization: Building2,
    User: User,
    Project: FolderKanban,
    Role: Shield,
    Grievance: AlertTriangle,
    Department: Briefcase,
    Task: Activity,
  };
  return icons[entityType] || Activity;
};

const getActionColor = (action) => {
  if (action.includes("CREATED")) return "bg-green-500/10 text-green-600 border-green-500/20";
  if (action.includes("DELETED")) return "bg-red-500/10 text-red-600 border-red-500/20";
  if (action.includes("ACTIVATED")) return "bg-blue-500/10 text-blue-600 border-blue-500/20";
  if (action.includes("DEACTIVATED") || action.includes("SUSPENDED")) return "bg-orange-500/10 text-orange-600 border-orange-500/20";
  if (action.includes("UPDATED") || action.includes("CHANGED")) return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
  if (action.includes("LOGIN")) return "bg-purple-500/10 text-purple-600 border-purple-500/20";
  if (action.includes("APPROVED")) return "bg-green-500/10 text-green-600 border-green-500/20";
  if (action.includes("REJECTED")) return "bg-red-500/10 text-red-600 border-red-500/20";
  return "bg-gray-500/10 text-gray-600 border-gray-500/20";
};

const formatAction = (action) => {
  return action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
};

const StatsCard = ({ title, value, icon: Icon, className = "" }) => (
  <div className={`p-4 rounded-lg border ${className}`}>
    <div className="flex items-center gap-3">
      <div className="p-2 bg-primary/10 rounded-lg">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </div>
  </div>
);

const AuditLogsList = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    entity_type: "all",
    organization_id: "all",
    start_date: "",
    end_date: "",
  });

  const { data, isLoading, isFetching } = useGetAuditLogsQuery(filters);
  const { data: statsData, isLoading: statsLoading } = useGetAuditLogStatsQuery();
  const { data: orgsData } = useGetOrganizationNamesQuery();

  const logs = data?.data?.logs || [];
  const pagination = data?.data?.pagination;
  const stats = statsData?.data || {};
  const organizations = orgsData?.data || [];

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      entity_type: "all",
      organization_id: "all",
      start_date: "",
      end_date: "",
    });
  };

  const hasActiveFilters =
    filters.entity_type !== "all" ||
    filters.organization_id !== "all" ||
    filters.start_date ||
    filters.end_date;

  const renderLoadingState = () => (
    <>
      {[...Array(10)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">Track all actions across the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Logs"
          value={statsLoading ? "..." : stats.totalLogs || 0}
          icon={Activity}
        />
        <StatsCard
          title="Today's Activity"
          value={statsLoading ? "..." : stats.todayLogs || 0}
          icon={Calendar}
        />
        <StatsCard
          title="Last 7 Days"
          value={statsLoading ? "..." : stats.lastWeekLogs || 0}
          icon={Activity}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3 items-center flex-wrap">
          <Select
            value={filters.entity_type}
            onValueChange={(value) => handleFilterChange("entity_type", value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Entity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Organization">Organization</SelectItem>
              <SelectItem value="User">User</SelectItem>
              <SelectItem value="Project">Project</SelectItem>
              <SelectItem value="Role">Role</SelectItem>
              <SelectItem value="Grievance">Grievance</SelectItem>
              <SelectItem value="Department">Department</SelectItem>
              <SelectItem value="Task">Task</SelectItem>
            </SelectContent>
          </Select>
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
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Date Range
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => handleFilterChange("start_date", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => handleFilterChange("end_date", e.target.value)}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {hasActiveFilters && (
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
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Performed By</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="w-16">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || isFetching ? (
              renderLoadingState()
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const EntityIcon = getEntityIcon(log.entity_type);
                return (
                  <TableRow key={log._id}>
                    <TableCell>
                      <Badge variant="outline" className={getActionColor(log.action)}>
                        {formatAction(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <EntityIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{log.entity_type}</p>
                          {log.entity_name && (
                            <p className="text-xs text-muted-foreground truncate max-w-32">
                              {log.entity_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                        {log.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      {log.performed_by ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={log.performed_by?.avatar} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {log.performed_by?.username?.[0]?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {log.performed_by?.firstname} {log.performed_by?.lastname}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">System</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/admin/audit-logs/${log._id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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
            Showing {logs.length} of {pagination.totalItems} logs
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
    </div>
  );
};

export default AuditLogsList;
