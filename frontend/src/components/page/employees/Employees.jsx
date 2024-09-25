import { useState } from "react";
import classnames from "classnames";
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
  Edit3,
  EyeOff,
  RefreshCw,
  Settings2,
  Trash,
  X,
} from "lucide-react";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Employees = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 1,
    username: "",
    is_active: "",
    employee_id: "",
    role: "",
    department: "",
    sort_by: "created_at",
    order: "desc",
    search: "",
  });

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
          className="mt-1 ml-1 mr-2"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedRows.includes(row.original._id)}
          onCheckedChange={() => handleRowSelect(row.original._id)}
          className="mt-1 ml-1 mr-2"
        />
      ),
      hideable: false,
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

  const [visibleColumns, setVisibleColumns] = useState(
    allColumns.map((column) => {
      if (column.hideable === true) return column.accessorKey;
    })
  );

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
    if (col && !col.hideable) return;

    if (visibleColumns.length === 1 && visibleColumns.includes(column)) return;
    setVisibleColumns((prev) =>
      prev.includes(column)
        ? prev.filter((col) => col !== column)
        : [...prev, column]
    );
  };

  const handleResetColumns = () => {
    setVisibleColumns(
      allColumns.map((column) => {
        if (column.hideable === true) return column.accessorKey;
      })
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

  // const handleDelete = () => {
  //   if (selectedRows.length > 0) {
  //     console.log("Delete rows: ", selectedRows);
  //     setSelectedRows([]);
  //   }
  // };

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

  const handleLimitChange = (newLimit) => {
    setFilters((prev) => ({ ...prev, limit: newLimit, page: 1 })); // Reset to first page on limit change
  };

  const renderPageButtons = () => {
    const buttons = [];

    for (let i = 1; i <= data.pagination.totalPages; i++) {
      buttons.push(
        <PaginationItem key={i}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePageChange(i)}
            className={`h-8 w-8 ${
              data.pagination.currentPage === i
                ? "font-bold bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
                : ""
            }`}
          >
            {i}
          </Button>
        </PaginationItem>
      );
    }

    return buttons;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <Input
            placeholder="Search"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-96"
          />
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center">
            <span className="mr-2">Rows per page</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="data-[state=open]:bg-muted"
                >
                  {filters.limit} <ChevronsUpDown size={16} className="ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {[1, 10, 20, 30, 40, 50].map((limit) => (
                  <DropdownMenuItem
                    key={limit}
                    onClick={() => handleLimitChange(limit)}
                  >
                    {limit}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="data-[state=open]:bg-muted"
              >
                <Settings2 size={18} className="mr-2" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {allColumns.map((col) =>
                col.accessorKey === "select" || !col.hideable ? null : (
                  <DropdownMenuItem
                    key={col.accessorKey}
                    className="flex items-center relative px-2"
                    onClick={() =>
                      handleColumnVisibilityChange(col.accessorKey)
                    }
                  >
                    {isSelected(col.accessorKey) && (
                      <Check size={16} className="absolute" />
                    )}
                    <span className="pl-8">{col.header}</span>
                  </DropdownMenuItem>
                )
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                key="Reset"
                className="flex items-center relative px-2"
                onClick={() => handleResetColumns()}
              >
                <RefreshCw size={16} className="absolute" />
                <span className="pl-8">Reset</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Uncomment if Delete Selected button is needed */}
          {/* <button
      className="bg-red-500 text-white px-4 py-2 rounded"
      disabled={selectedRows.length === 0}
      onClick={handleDelete}
    >
      Delete Selected
    </button> */}
        </div>
      </div>

      <div className="rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={classnames(
                      "text-center text-nowrap align-middle",
                      header.column.columnDef.accessorKey === "select"
                        ? "pl-3"
                        : ""
                    )}
                  >
                    {
                      // Render sorting icon if column is sortable
                      header.column.columnDef.sortable ||
                      header.column.columnDef.hideable ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="data-[state=open]:bg-muted/40"
                            >
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
                                {header.column.columnDef.hideable && (
                                  <DropdownMenuSeparator />
                                )}
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
                onClick={() =>
                  handlePageChange(data.pagination.currentPage - 1)
                }
                disabled={!data.pagination.hasPrevPage}
              />
            </PaginationItem>
            {renderPageButtons()}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  handlePageChange(data.pagination.currentPage + 1)
                }
                disabled={!data.pagination.hasNextPage}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {selectedRows.length > 0 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 border border-secondary flex gap-2 py-2 px-3 bg-white shadow-customlight rounded-md items-center">
          <TooltipProvider>
            <div className="border border-dashed rounded-lg border-black/30 px-1 py-1 flex gap-2 justify-between items-center">
              <span className="mb-[2px] ml-2">
                {selectedRows.length} selected
              </span>
              <Tooltip>
                <TooltipTrigger
                  className="h-6 w-6 p-1 hover:bg-secondary rounded-md"
                  onClick={() => setSelectedRows([])}
                >
                  <X size={14} />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clear Selection</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="w-[1px] h-[27px] bg-black/20" />
            <>
              {selectedRows.length === 1 && (
                <Tooltip>
                  <TooltipTrigger className="h-8 px-2 border rounded-md border-input/50 bg-background hover:bg-accent hover:text-accent-foreground">
                    <Edit3 size={18} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit Row</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger className="h-8 px-2 border rounded-md border-input/50 bg-background hover:bg-accent hover:text-accent-foreground">
                  <Trash size={18} />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete Row</p>
                </TooltipContent>
              </Tooltip>
            </>
          </TooltipProvider>
        </div>
      )}

      {isLoading && <div>Loading...</div>}
    </div>
  );
};

export default Employees;
