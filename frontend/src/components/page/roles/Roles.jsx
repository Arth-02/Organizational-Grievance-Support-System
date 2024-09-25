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
import { useGetAllRolesQuery } from "@/services/api.service";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronsUpDown,
  EyeOff,
  RefreshCw,
  Settings2,
} from "lucide-react";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";

const Roles = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 1,
    name: "",
    is_active: "",
    permissions: "",
  });

  const [selectedRows, setSelectedRows] = useState([]);

  const { data, isLoading } = useGetAllRolesQuery(filters);
  console.log(data);
  const allColumns = [
    {
      accessorKey: "select",
      header: () => (
        <Checkbox
          checked={
            selectedRows.length === data?.roles.length && data?.roles.length > 0
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
      hideable: false,
    },
    {
      accessorKey: "name",
      header: "Name",
      sortable: true,
      hideable: true,
    },
    {
      accessorKey: "permissions",
      header: "Permissions",
      sortable: false,
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

  const [visibleColumns, setVisibleColumns] = useState(allColumns.map((col) => col.accessorKey));

  const filteredColumns = allColumns.filter(
    (col) =>
      visibleColumns.includes(col.accessorKey) || col.accessorKey === "select"
  );

  const table = useReactTable({
    data: data?.roles || [],
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
    setVisibleColumns(allColumns.map((col) => col.accessorKey));
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
    if (selectedRows.length === data?.roles.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(data?.roles.map((user) => user._id));
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
    setFilters((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const renderPageButtons = () => {
    const buttons = [];
    const { currentPage, totalPages } = data.pagination;
  
    // Always show the first page
    buttons.push(
      <PaginationItem key={1}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(1)}
          className={`h-8 w-8 ${
            currentPage === 1
              ? "font-bold bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
              : ""
          }`}
        >
          1
        </Button>
      </PaginationItem>
    );
  
    // Show the current page and the next two pages, with conditions for "..."
    if (currentPage > 3) {
      buttons.push(
        <PaginationItem key="ellipsis-1">
          <span className="mx-2">…</span>
        </PaginationItem>
      );
    }
  
    for (let i = Math.max(2, currentPage); i <= Math.min(currentPage + 2, totalPages - 1); i++) {
      buttons.push(
        <PaginationItem key={i}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePageChange(i)}
            className={`h-8 w-8 ${
              currentPage === i
                ? "font-bold bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
                : ""
            }`}
          >
            {i}
          </Button>
        </PaginationItem>
      );
    }
  
    // Show ellipsis if currentPage + 2 is less than totalPages - 1
    if (currentPage + 2 < totalPages - 1) {
      buttons.push(
        <PaginationItem key="ellipsis-2">
          <span className="mx-2">…</span>
        </PaginationItem>
      );
    }
  
    // Always show the last page if totalPages > 1
    if (totalPages > 1) {
      buttons.push(
        <PaginationItem key={totalPages}>
          <Button
            variant="ghost"
            onClick={() => handlePageChange(totalPages)}
            className={`h-8 w-8 ${
              currentPage === totalPages
                ? "font-bold bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
                : ""
            }`}
          >
            {totalPages}
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
                <Button variant="outline" size="sm" className="data-[state=open]:bg-muted">
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
              <Button variant="outline" size="sm" className="data-[state=open]:bg-muted">
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
                            <Button variant="ghost" size="sm" className="data-[state=open]:bg-muted/40">
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
                    className="text-center text-wrap align-middle"
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

      {isLoading && <div>Loading...</div>}
    </div>
  );
};

export default Roles;
