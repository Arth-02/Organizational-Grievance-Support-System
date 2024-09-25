import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useGetAllUsersQuery } from "@/services/api.service";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronsUpDown,
  EyeOff,
  Settings2,
} from "lucide-react";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";

const Employees = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    username: "",
    is_active: "",
    employee_id: "",
    role: "",
    department: "",
    sort_by: "created_at", // Default sorting column
    order: "desc", // Default sort order
    search: "",
  });

  const [visibleColumns, setVisibleColumns] = useState([
    "username",
    "email",
    "firstname",
    "lastname",
    "employee_id",
    "role",
    "department",
    "is_active",
    "last_login",
    "created_at",
  ]);

  const [selectedRows, setSelectedRows] = useState([]);

  const { data, isLoading } = useGetAllUsersQuery(filters);

  const allColumns = [
    {
      accessorKey: "select",
      header: () => (
        <Checkbox
          checked={
            selectedRows.length === data?.users.length && data?.users.length > 0
          }
          onCheckedChange={() => handleSelectAll()}
          className="mt-1"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedRows.includes(row.original._id)}
          onCheckedChange={() => handleRowSelect(row.original._id)}
          className="mt-1"
        />
      ),
      hideable: false, // This column cannot be hidden
    },
    {
      accessorKey: "username",
      header: "Username",
      sortable: true,
      hideable: true,
    },
    { accessorKey: "email", header: "Email", sortable: true, hideable: true },
    {
      accessorKey: "firstname",
      header: "First Name",
      sortable: true,
      hideable: true,
    },
    {
      accessorKey: "lastname",
      header: "Last Name",
      sortable: true,
      hideable: true,
    },
    {
      accessorKey: "employee_id",
      header: "Employee ID",
      sortable: false,
      hideable: true,
    },
    { accessorKey: "role", header: "Role", sortable: true, hideable: true },
    {
      accessorKey: "department",
      header: "Department",
      sortable: true,
      hideable: true,
    },
    {
      accessorKey: "is_active",
      header: "Status",
      sortable: false,
      cell: ({ row }) => (row.original.is_active ? "Active" : "Inactive"),
      hideable: true,
    },
    {
      accessorKey: "last_login",
      header: "Last Login",
      sortable: false,
      cell: ({ row }) =>
        row.original.last_login
          ? new Date(row.original.last_login).toLocaleString()
          : "-",
      hideable: true,
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      sortable: true,
      cell: ({ row }) =>
        row.original.created_at
          ? new Date(row.original.created_at).toLocaleString()
          : "-",
      hideable: true,
    },
  ];

  const filteredColumns = allColumns.filter(
    (col) =>
      visibleColumns.includes(col.accessorKey) || col.accessorKey === "select"
  );

  const table = useReactTable({
    data: data?.users || [],
    columns: filteredColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    pageCount: data?.pagination?.totalPages || -1,
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleColumnVisibilityChange = (column) => {
    const col = allColumns.find((col) => col.accessorKey === column);
    if (col && !col.hideable) return; // Prevent hiding non-hideable columns

    if (visibleColumns.length === 1 && visibleColumns.includes(column)) return;
    setVisibleColumns((prev) =>
      prev.includes(column)
        ? prev.filter((col) => col !== column)
        : [...prev, column]
    );
  };

  const handleSortChange = (column, order) => {
    if (column.sortable) {
      setFilters((prev) => ({
        ...prev,
        sort_by: column.accessorKey,
        order,
      }));
    }
  };

  const handleRowSelect = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === data?.users.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(data?.users.map((user) => user._id));
    }
  };

  const handleDelete = () => {
    if (selectedRows.length > 0) {
      console.log("Delete rows: ", selectedRows);
      setSelectedRows([]);
    }
  };

  const isSelected = (column) => visibleColumns.includes(column);

  const getSortIcon = (key) => {
    if (filters.sort_by === key) {
      return filters.order === "asc" ? (
        <ArrowUp className="ml-2 text-gray-400" size={16} />
      ) : (
        <ArrowDown className="ml-2 text-gray-400" size={16} />
      );
    }

    return <ChevronsUpDown className="ml-2 text-gray-400" size={16} />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-end">
        <Input
          placeholder="Search"
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="max-w-xs"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="text-base">
              <Settings2 size={18} className="mr-3" />
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {allColumns.map((col) =>
              col.accessorKey === "select" || !col.hideable ? null : (
                <DropdownMenuItem
                  key={col.accessorKey}
                  className="flex items-center relative px-2"
                  onClick={() => handleColumnVisibilityChange(col.accessorKey)}
                >
                  {isSelected(col.accessorKey) && (
                    <Check size={16} className="absolute" />
                  )}
                  <span className="pl-8">{col.header}</span>
                </DropdownMenuItem>
              )
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          className="bg-red-500 text-white px-4 py-2 rounded"
          disabled={selectedRows.length === 0}
          onClick={handleDelete}
        >
          Delete Selected
        </button>
      </div>

      <div className="rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-center align-middle"
                  >
                    {
                      // Render sorting icon if column is sortable
                      header.column.columnDef.sortable ||
                      header.column.columnDef.hideable ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {header.column.columnDef.sortable &&
                                getSortIcon(
                                  header.column.columnDef.accessorKey
                                )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {header.column.columnDef.sortable && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleSortChange(
                                      header.column.columnDef,
                                      "asc"
                                    )
                                  }
                                >
                                  <ArrowUp className="mr-3" size={16} />
                                  Asc
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleSortChange(
                                      header.column.columnDef,
                                      "desc"
                                    )
                                  }
                                >
                                  <ArrowDown className="mr-3" size={16} />
                                  Desc
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {header.column.columnDef.hideable && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleColumnVisibilityChange(
                                    header.column.columnDef.accessorKey
                                  )
                                }
                              >
                                <EyeOff className="mr-3" size={16} />
                                Hide
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )
                    }
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="text-center text-nowrap align-middle"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data?.pagination && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={!data.pagination.hasPrevPage}
              />
            </PaginationItem>
            <PaginationItem>
              Page {data.pagination.currentPage} of {data.pagination.totalPages}
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={!data.pagination.hasNextPage}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {isLoading && <div>Loading...</div>}
    </div>
  );
};

export default Employees;
