import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
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
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronsUpDown,
  Edit3,
  Eye,
  EyeOff,
  RefreshCw,
  Settings2,
  Trash,
  X,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CustomSearch from "@/components/ui/CustomSearch";
import Modal from "@/components/ui/Model";

const GeneralTable = ({
  data,
  columns,
  filters,
  setFilters,
  customFilters,
  isLoading,
  isFetching,
  error,
  pagination,
  onDelete,
  onDeleteAll,
  onEdit,
  onView,
  searchOptions,
}) => {
  const allColumns = [
    {
      accessorKey: "select",
      header: () => (
        <Checkbox
          checked={selectedRows.length === data.length && data.length > 0}
          onCheckedChange={handleSelectAll}
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
    ...columns.map((col) => ({
      ...col,
      hideable: col.hideable ?? true,
    })),
    {
      accessorKey: "actions",
      header: "Actions",
      hideable: false,
      cell: ({ row }) => (
        <div className="flex gap-2 ml-2">
          <Tooltip>
            <TooltipTrigger
              onClick={() => onView(row.original._id)}
              className="p-2 h-8 w-8 rounded-md bg-blue-100/50 text-blue-500 hover:bg-blue-100/80 hover:text-blue-700"
            >
              <Eye size={15} />
            </TooltipTrigger>
            <TooltipContent>
              <p>View</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              onClick={() => onEdit(row.original._id)}
              className="p-2 h-8 w-8 rounded-md bg-orange-100/50 text-orange-500 hover:bg-orange-100/80 hover:text-orange-700"
            >
              <Edit3 size={15} />
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              onClick={() => handleDeleteClick(row.original._id)}
              className="p-2 h-8 w-8 rounded-md bg-red-100/50 text-red-500 hover:bg-red-100/80 hover:text-red-700"
            >
              <Trash size={15} />
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete</p>
            </TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ];

  const defaultFilters = filters;
  const [selectedRows, setSelectedRows] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(
    allColumns.map((col) => col.accessorKey)
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const totalHideableColumns = allColumns.filter(
    (col) => col.hideable === true
  ).length;
  const visibleHideableColumns =
    visibleColumns.length -
    allColumns.filter((col) => col.hideable === false).length;

  const filteredColumns = allColumns.filter(
    (col) =>
      visibleColumns.includes(col.accessorKey) ||
      col.accessorKey === "select" ||
      col.accessorKey === "actions"
  );

  const table = useReactTable({
    data,
    columns: filteredColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    pageCount: pagination?.totalPages || -1,
  });

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleColumnVisibilityChange = (column) => {
    const col = allColumns.find((col) => col.accessorKey === column);
    if (col && col.hideable === false) return;

    if (visibleColumns.length === 1 && visibleColumns.includes(column)) return;
    setVisibleColumns((prev) =>
      prev.includes(column)
        ? prev.filter((col) => col !== column)
        : [...prev, column]
    );
  };

  const handleResetColumns = () => {
    setVisibleColumns(allColumns.map((column) => column.accessorKey));
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
    if (selectedRows.length === data.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(data.map((item) => item._id));
    }
  };

  const handleLimitChange = (newLimit) => {
    setFilters((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleSearchChange = (searchField, searchValue) => {
    setFilters((prev) => ({ ...prev, [searchField]: searchValue }));
  };

  const handleDeleteAll = () => {
    setDeleteDialogOpen(true);
    if (selectedRows.length > 0) {
      onDeleteAll(selectedRows);
    }
    setSelectedRows([]);
  };

  const handleDeleteClick = (id) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      onDelete(itemToDelete);
    } else {
      handleDeleteAll();
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleFilterChange = (filter, value) => {
    setFilters((prev) => ({ ...prev, [filter]: value }));
  };

  const renderPageButtons = () => {
    const buttons = [];

    for (let i = 1; i <= pagination.totalPages; i++) {
      buttons.push(
        <PaginationItem key={i}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePageChange(i)}
            className={`h-8 w-8 ${
              pagination.currentPage === i
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

  const showNoDataMessage =
    !isLoading && !isFetching && (data.length === 0 || error);

  const renderLoadingState = () => (
    <TableRow>
      <TableCell colSpan={filteredColumns.length} className="h-24 text-center">
        Loading...
      </TableCell>
    </TableRow>
  );

  const renderNoDataMessage = () => (
    <TableRow>
      <TableCell colSpan={filteredColumns.length} className="h-24 text-center">
        {error ? `${error.message || "Failed to fetch data"}` : "No data found"}
      </TableCell>
    </TableRow>
  );

  const renderTableRows = () =>
    table.getRowModel().rows.map((row) => (
      <TableRow key={row.id}>
        {row.getVisibleCells().map((cell) => (
          <TableCell
            key={cell.id}
            className={`text-nowrap align-middle ${
              cell.column.columnDef.accessorKey === "select"
                ? "px-2"
                : cell.column.columnDef.accessorKey === "actions"
                ? "pl-0 pr-3"
                : "px-[22px]"
            } ${!cell.getValue() ? "text-center" : ""}`}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    ));

  const renderTableContent = () => {
    if (isLoading || isFetching) return renderLoadingState();
    if (showNoDataMessage) return renderNoDataMessage();
    return renderTableRows();
  };

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

  const handleResetFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <CustomSearch
          onSearch={handleSearchChange}
          searchOptions={searchOptions}
        />
        <div className="flex gap-4 items-center">
          {customFilters &&
            customFilters.map((filter, index) => (
              <div key={index} className="flex flex-nowrap items-center gap-2">
                <span>{filter.label}</span>
                <Select
                  value={filters[filter.key]}
                  onValueChange={(value) =>
                    handleFilterChange(filter.key, value)
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={filter.placeholder || "All"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          {defaultFilters !== filters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="flex items-center gap-2"
            >
              <RefreshCcw size={16} />
              Reset Filters
            </Button>
          )}
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
                    {visibleColumns.includes(col.accessorKey) && (
                      <Check size={16} className="absolute" />
                    )}
                    <span className="pl-8">{col.header}</span>
                  </DropdownMenuItem>
                )
              )}
              {visibleHideableColumns < totalHideableColumns && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center relative px-2"
                    onClick={handleResetColumns}
                  >
                    <RefreshCw size={16} className="absolute" />
                    <span className="pl-8">Reset</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
                    className="text-nowrap align-middle"
                  >
                    {header.column.columnDef.sortable ||
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
                              getSortIcon(header.column.columnDef.accessorKey)}
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
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>{renderTableContent()}</TableBody>
        </Table>
      </div>
      {pagination && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Showing {table.getRowModel().rows.length} of{" "}
            {pagination.totalItems || 0} results
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <span className="mr-2">Rows per page</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="data-[state=open]:bg-muted h-8 px-2 pl-3"
                  >
                    {filters.limit}{" "}
                    <ChevronsUpDown size={16} className="ml-1" />
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
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                  />
                </PaginationItem>
                {renderPageButtons()}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
      {selectedRows.length > 0 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 border border-secondary flex gap-2 py-2 px-3 bg-white shadow-customlight rounded-md items-center">
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
                <Trash size={18} onClick={() => setDeleteDialogOpen(true)} />
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete Selected</p>
              </TooltipContent>
            </Tooltip>
          </>
        </div>
      )}
      <Modal
        open={deleteDialogOpen}
        title="Are you sure?"
        description="This action cannot be undone. This will permanently delete the selected items."
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        confirmVariant="outline-destructive"
      ></Modal>
    </div>
  );
};

export default GeneralTable;
