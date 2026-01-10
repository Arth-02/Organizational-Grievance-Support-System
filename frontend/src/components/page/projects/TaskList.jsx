import { Draggable, Droppable } from "@hello-pangea/dnd";
import { useRef, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
}) => {
  const containerRef = useRef(null);
  
  // Get status config, using column label if available, otherwise key
  const statusConfig = STATUS_CONFIG[column.key] || {
    ...STATUS_CONFIG.default,
    label: column.label || column.key,
  };

  // Track loading state
  const [isLoading, setIsLoading] = useState(false);

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

  const lastElementRef = useInfiniteScroll(
    loadMoreTasks,
    hasNextPage,
    isLoading
  );

  // Random skeleton count for initial loading
  const randomSkeletonCountRef = useRef(Math.floor(Math.random() * 4) + 1);

  return (
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
                <h3
                  className={cn(
                    "font-medium text-sm",
                    statusConfig.textColor
                  )}
                >
                  {column.label || statusConfig.label}
                </h3>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium",
                    statusConfig.bgColor,
                    statusConfig.textColor
                  )}
                >
                  {totalTasksCount}
                </span>
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
  );
};

export default TaskList;
