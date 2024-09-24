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
} from "@/components/ui/dropdown-menu"; // Assume this is available for dropdown functionality
import { useGetAllUsersQuery } from "@/services/api.service";
import { ArrowDown, ArrowUp, Check, ChevronsUpDown, EyeOff, Settings2 } from "lucide-react";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";

const UserTable = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    username: "",
    is_active: "",
    employee_id: "",
    role: "",
    department: "",
    sort_by: "username", // Default sorting column
    order: "asc", // Default sort order
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
  ]);

  const [selectedRows, setSelectedRows] = useState([]); // New state for selected rows

  const { data, isLoading } = useGetAllUsersQuery(filters);

  // Optional Sorting based on column
  const allColumns = [
    {
      accessorKey: "select", // New checkbox column
      header: () => (
        <Checkbox
          checked={
            selectedRows.length === data?.users.length && data?.users.length > 0
          } // Check if all rows are selected
          onCheckedChange={() => handleSelectAll()}
          className="mt-1"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedRows.includes(row.original._id)} // Check if the current row is selected
          onCheckedChange={() => handleRowSelect(row.original._id)}
          className="mt-1"
        />
      ),
    },
    { accessorKey: "username", header: "Username", sortable: true },
    { accessorKey: "email", header: "Email", sortable: true },
    { accessorKey: "firstname", header: "First Name", sortable: true },
    { accessorKey: "lastname", header: "Last Name", sortable: true },
    { accessorKey: "employee_id", header: "Employee ID", sortable: false },
    { accessorKey: "role", header: "Role", sortable: true },
    { accessorKey: "department", header: "Department", sortable: true },
    {
      accessorKey: "is_active",
      header: "Status",
      sortable: false, // Disable sorting
      cell: ({ row }) => (row.original.is_active ? "Active" : "Inactive"),
    },
    {
      accessorKey: "last_login",
      header: "Last Login",
      sortable: false, // Disable sorting
      cell: ({ row }) => new Date(row.original.last_login).toLocaleString(),
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

  // Handle row selection
  const handleRowSelect = (id) => {
    console.log("Selected row: ", id);
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  // Handle selecting/deselecting all rows
  const handleSelectAll = () => {
    if (selectedRows.length === data?.users.length) {
      setSelectedRows([]); // Deselect all
    } else {
      setSelectedRows(data?.users.map((user) => user._id)); // Select all
    }
  };

  // Handle deleting selected rows
  const handleDelete = () => {
    if (selectedRows.length > 0) {
      // Dispatch an action or call an API to delete the selected rows
      // Example: dispatch(deleteUsers(selectedRows));
      console.log("Delete rows: ", selectedRows);
      setSelectedRows([]); // Clear the selection after deletion
    }
  };
  const isSelected = (column) => visibleColumns.includes(column);

    const getSortIcon = (key) => {
      if (filters.sort_by === key) {
        if (filters.order === "asc") {
          return <ArrowUp className="ml-2 text-gray-400" size={16} />;
        } else {
          return <ArrowDown className="ml-2 text-gray-400" size={16} />;
        }
      };

    return <ChevronsUpDown className="ml-2 text-gray-400" size={16} />
  }

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
          <DropdownMenuContent className="">
            {allColumns.map((col) =>
              col.accessorKey === "select" ? null : (
                <DropdownMenuItem
                  key={col.accessorKey}
                  className="flex items-center relative px-2"
                  onClick={() => handleColumnVisibilityChange(col.accessorKey)}
                >
                  {isSelected(col.accessorKey) && (
                    <Check size={16} className=" absolute" />
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.column.columnDef.sortable ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {getSortIcon(header.column.columnDef.accessorKey)}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                handleSortChange(header.column.columnDef, "asc")
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
                            <DropdownMenuItem
                              onClick={() =>
                               handleColumnVisibilityChange(header.column.columnDef.accessorKey)
                              }
                            >
                              <EyeOff className="mr-3" size={16} />
                              Hide
                            </DropdownMenuItem>
                          </>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
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

export default UserTable;
