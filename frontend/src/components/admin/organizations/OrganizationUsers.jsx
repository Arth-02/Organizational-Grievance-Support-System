import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Search, RefreshCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetOrganizationUsersQuery } from "@/services/admin.service";

const OrganizationUsers = ({ orgId }) => {
  const [filters, setFilters] = useState({
    id: orgId,
    page: 1,
    limit: 10,
    username: "",
    is_active: "all",
  });

  const { data, isLoading, isFetching } = useGetOrganizationUsersQuery(filters);

  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination;

  const handleSearchChange = (e) => {
    setFilters((prev) => ({ ...prev, username: e.target.value, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleResetFilters = () => {
    setFilters({ id: orgId, page: 1, limit: 10, username: "", is_active: "all" });
  };

  const renderLoadingState = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username..."
              value={filters.username}
              onChange={handleSearchChange}
              className="pl-9 w-64"
            />
          </div>
          <Select
            value={filters.is_active}
            onValueChange={(value) => handleFilterChange("is_active", value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(filters.username || filters.is_active !== "all") && (
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
              <TableHead className="w-12"></TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || isFetching ? (
              renderLoadingState()
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.username} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {user.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">
                    {user.firstname} {user.lastname}
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>{user.role?.name || "-"}</TableCell>
                  <TableCell>{user.department?.name || "-"}</TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
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
            Showing {users.length} of {pagination.totalItems} users
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

export default OrganizationUsers;
