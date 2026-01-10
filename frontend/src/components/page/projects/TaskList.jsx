import { Draggable, Droppable } from "@hello-pangea/dnd";
import { useRef, useState, useEffect } from "react";
import { Loader2, GripVertical, MoreHorizontal, Pencil, Trash2, ArrowRight, Check, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import cn from "classnames";
import useInfiniteScroll from "@/hooks/useInfiniteScroll";
import TaskCard from "./TaskCard";

// Status configuration for column styling
const STATUS_CONFIG = {
  todo: {
    label: "To Do",
    textColor: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-100 dark:bg-slate-700/50",
  },
  "in-progress": {
    label: "In Progress",
    textColor: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-500/15",
  },
  "in-review": {
    label: "In Review",
    textColor: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-500/15",
  },
  done: {
    label: "Done",
    textColor: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-500/15",
  },
  // Fallback for custom statuses
  default: {
    label: "Unknown",
    textColor: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-700/50",
  },
};

// Skeleton card for loading state
const SkeletonCard = () => (
  <div className="bg-card rounded-lg p-4 shadow-sm border border-border skeleton-shimmer">
    <div className="flex items-start justify-between gap-3 mb-3">
      <Skeleton className="h-4 w-16 bg-muted" />
      <Skeleton className="h-5 w-14 rounded-full bg-muted" />
    </div>
    <Skeleton className="h-5 w-full mb-2 bg-muted" />
    <Skeleton className="h-4 w-3/4 mb-4 bg-muted" />
    <div className="flex justify-between items-center pt-3 border-t border-border">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-md bg-muted" />
      </div>
      <Skeleton className="h-7 w-7 rounded-full bg-muted" />
    </div>
  </div>
);

const TaskList = ({
  column,
  tasks,
  hasNextPage,
  page,
  isInitialized,
  totalTasksCount,
  onPageChange,
  dragHandleProps,
  isProjectManager,
  allColumns = [],
  onRenameColumn,
  onDeleteColumn,
  isUpdatingBoard,
}) => {
  const containerRef = useRef(null);
  
  // Get status config, using column label if available, otherwise key
  const statusConfig = STATUS_CONFIG[column.key] || {
    ...STATUS_CONFIG.default,
    label: column.label || column.key,
  };

  // Track loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // Rename state
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(column.label || "");
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteAction, setDeleteAction] = useState("move"); // "move" or "delete"
  const [targetColumn, setTargetColumn] = useState("");

  const loadMoreTasks = () => {
    if (hasNextPage && !isLoading) {
      setIsLoading(true);
      onPageChange(column.key, page + 1);
    }
  };

  // Reset loading state when tasks change
  useEffect(() => {
    setIsLoading(false);
  }, [tasks]);

  // Reset rename value when column label changes
  useEffect(() => {
    setRenameValue(column.label || "");
  }, [column.label]);

  const lastElementRef = useInfiniteScroll(
    loadMoreTasks,
    hasNextPage,
    isLoading
  );

  // Random skeleton count for initial loading
  const randomSkeletonCountRef = useRef(Math.floor(Math.random() * 4) + 1);

  // Handle rename submit
  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== column.label) {
      onRenameColumn?.(column.key, renameValue.trim());
    }
    setIsRenaming(false);
  };

  // Handle rename cancel
  const handleRenameCancel = () => {
    setRenameValue(column.label || "");
    setIsRenaming(false);
  };

  // Handle rename key press
  const handleRenameKeyPress = (e) => {
    if (e.key === "Enter") {
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      handleRenameCancel();
    }
  };

  // Handle delete column
  const handleDeleteColumn = () => {
    // Check if column has tasks (use both totalTasksCount from API and tasks.length from loaded data)
    const hasTasksInColumn = totalTasksCount > 0 || tasks.length > 0;
    
    if (hasTasksInColumn) {
      // Set default target column (first column that's not the current one)
      const otherColumns = allColumns.filter(c => c.key !== column.key);
      if (otherColumns.length > 0) {
        setTargetColumn(otherColumns[0].key);
      }
      setIsDeleteDialogOpen(true);
    } else {
      // No tasks, delete directly
      onDeleteColumn?.(column.key);
    }
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (deleteAction === "move" && targetColumn) {
      onDeleteColumn?.(column.key, { action: "move", targetColumn });
    } else {
      onDeleteColumn?.(column.key, { action: "delete" });
    }
    setIsDeleteDialogOpen(false);
  };

  // Get other columns for move selection
  const otherColumns = allColumns.filter(c => c.key !== column.key);

  return (
    <>
      <Droppable droppableId={column.key} key={column.key}>
        {(provided, snapshot) => {
          const isDraggingOver = Boolean(snapshot.isDraggingOver);
          const isDraggingFrom = Boolean(snapshot.draggingFromThisWith);

          return (
            <div
              className={cn(
                "flex-shrink-0 w-[350px] max-h-full rounded-lg flex flex-col overflow-hidden",
                "bg-secondary",
                "border border-border",
                isDraggingOver && "ring-2 ring-primary/30",
                "transition-all duration-200"
              )}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Drag Handle - Only visible to project managers */}
                    {isProjectManager && dragHandleProps && (
                      <div
                        {...dragHandleProps}
                        className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-muted transition-colors flex-shrink-0"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Column Name - Editable when renaming */}
                    {isRenaming ? (
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={handleRenameKeyPress}
                          className="h-7 text-sm"
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 flex-shrink-0"
                          onClick={handleRenameSubmit}
                          disabled={isUpdatingBoard}
                        >
                          <Check className="h-4 w-4 text-emerald-500" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 flex-shrink-0"
                          onClick={handleRenameCancel}
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ) : (
                      <h3
                        className={cn(
                          "font-medium text-sm truncate",
                          statusConfig.textColor
                        )}
                      >
                        {column.label || statusConfig.label}
                      </h3>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        statusConfig.bgColor,
                        statusConfig.textColor
                      )}
                    >
                      {totalTasksCount}
                    </span>
                    
                    {/* Column Menu - Only visible to project managers */}
                    {isProjectManager && !isRenaming && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                          >
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Rename Column
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={handleDeleteColumn}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Column
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>

              {/* Cards Container */}
              <div
                ref={(node) => {
                  provided.innerRef(node);
                  containerRef.current = node;
                }}
                {...provided.droppableProps}
                className="flex-1 overflow-x-hidden overflow-y-auto max-h-full p-3 pt-1"
              >
                <div
                  className={cn(
                    "space-y-3 transition-all duration-200",
                    isDraggingFrom ? "opacity-60" : "opacity-100"
                  )}
                >
                  {!isInitialized ? (
                    // Loading skeleton
                    Array.from({ length: randomSkeletonCountRef.current }).map(
                      (_, index) => <SkeletonCard key={index} />
                    )
                  ) : (
                    // Task cards
                    tasks.map((task, index) => (
                      <Draggable
                        key={task._id}
                        draggableId={task._id.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <TaskCard
                            task={task}
                            provided={provided}
                            snapshot={snapshot}
                          />
                        )}
                      </Draggable>
                    ))
                  )}
                  {/* Infinite scroll trigger */}
                  {hasNextPage && <div ref={lastElementRef} className="h-4" />}
                </div>
                {provided.placeholder}
                {/* Loading indicator for pagination */}
                {isLoading && isInitialized && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                )}
              </div>
            </div>
          );
        }}
      </Droppable>

      {/* Delete Column Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Column</DialogTitle>
            <DialogDescription>
              This column has {Math.max(totalTasksCount, tasks.length)} task{Math.max(totalTasksCount, tasks.length) !== 1 ? "s" : ""}. 
              What would you like to do with them?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Move tasks option */}
            <div
              onClick={() => setDeleteAction("move")}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-colors",
                deleteAction === "move"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/50"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Move tasks to another column</span>
              </div>
              {deleteAction === "move" && otherColumns.length > 0 && (
                <Select value={targetColumn} onValueChange={setTargetColumn}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {otherColumns.map((col) => (
                      <SelectItem key={col.key} value={col.key}>
                        {col.label || col.key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Delete all tasks option */}
            <div
              onClick={() => setDeleteAction("delete")}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-colors",
                deleteAction === "delete"
                  ? "border-destructive bg-destructive/5"
                  : "border-border hover:border-muted-foreground/50"
              )}
            >
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-destructive" />
                <span className="font-medium text-sm">Delete all tasks</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                This action cannot be undone
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={deleteAction === "delete" ? "destructive" : "default"}
              onClick={handleConfirmDelete}
              disabled={isUpdatingBoard || (deleteAction === "move" && !targetColumn)}
            >
              {isUpdatingBoard && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {deleteAction === "move" ? "Move & Delete" : "Delete All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskList;

