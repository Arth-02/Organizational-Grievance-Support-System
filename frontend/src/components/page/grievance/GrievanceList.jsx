import { Draggable, Droppable } from "@hello-pangea/dnd";
import GrievanceCard from "./GrievanceCard";
import useInfiniteScroll from "@/hooks/useInfiniteScroll";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import cn from "classnames";

const STATUS_CONFIG = {
  submitted: {
    label: "Submitted",
    textColor: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-500/15",
  },
  "in-progress": {
    label: "In Progress",
    textColor: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-500/15",
  },
  resolved: {
    label: "Resolved",
    textColor: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-500/15",
  },
  dismissed: {
    label: "Dismissed",
    textColor: "text-slate-600 dark:text-gray-400",
    bgColor: "bg-slate-100 dark:bg-gray-700/50",
  },
};

const SkeletonCard = () => (
  <div className="bg-card rounded-lg p-4 shadow-sm border border-border skeleton-shimmer">
    <div className="flex items-start justify-between gap-3 mb-3">
      <Skeleton className="h-5 w-3/4 bg-muted" />
      <Skeleton className="h-5 w-14 rounded-full bg-muted" />
    </div>
    <Skeleton className="h-4 w-full mb-2 bg-muted" />
    <Skeleton className="h-4 w-2/3 mb-4 bg-muted" />
    <div className="flex justify-between items-center pt-3 border-t border-border">
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-md bg-muted" />
        <Skeleton className="h-6 w-16 rounded-md bg-muted" />
      </div>
      <Skeleton className="h-8 w-8 rounded-full bg-muted" />
    </div>
  </div>
);

const GrievanceList = ({
  list,
  grievances,
  location,
  hasNextPage,
  page,
  isInisialized,
  totalGrievancesCount,
  onPageChange,
}) => {
  const containerRef = useRef(null);
  const statusConfig = STATUS_CONFIG[list] || STATUS_CONFIG.submitted;

  // Track if we're currently loading
  const [isLoading, setIsLoading] = useState(false);

  const loadMoreGrievances = () => {
    if (hasNextPage && !isLoading.current) {
      setIsLoading(true);
      onPageChange(list, page + 1);
    }
  };

  // Reset loading state when grievances array changes
  useEffect(() => {
    setIsLoading(false);
  }, [grievances]);

  const lastElementRef = useInfiniteScroll(
    loadMoreGrievances,
    hasNextPage,
    isLoading
  );

  // Generate a random number between 1 and 4
  const randomSkeletonCountRef = useRef(Math.floor(Math.random() * 4) + 1);

  return (
    <Droppable droppableId={list} key={list}>
      {(provided, snapshot) => {
        const isDraggingOver = Boolean(snapshot.isDraggingOver);
        const isDraggingFrom = Boolean(snapshot.draggingFromThisWith);

        return (
          <div
            key={list}
            className={cn(
              "flex-shrink-0 w-[350px] max-h-full rounded-lg flex flex-col overflow-hidden",
              "bg-secondary",
              "border border-border",
              isDraggingOver && "ring-2 ring-primary/30",
              "transition-all duration-200"
            )}
          >
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className={cn(
                  "font-medium text-sm",
                  statusConfig.textColor
                )}>
                  {statusConfig.label}
                </h3>
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-medium",
                  statusConfig.bgColor,
                  statusConfig.textColor
                )}>
                  {totalGrievancesCount}
                </span>
              </div>
            </div>

            {/* Cards container */}
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
                {!isInisialized ? (
                  Array.from({ length: randomSkeletonCountRef.current }).map((_, index) => (
                    <SkeletonCard key={index} />
                  ))
                ) : (
                  grievances.map((grievance, index) => (
                    <Draggable
                      key={grievance._id}
                      draggableId={grievance._id.toString()}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <GrievanceCard
                          grievance={grievance}
                          provided={provided}
                          snapshot={snapshot}
                          location={location}
                        />
                      )}
                    </Draggable>
                  ))
                )}
                {hasNextPage && <div ref={lastElementRef} className="h-4" />}
              </div>
              {provided.placeholder}
              {isLoading && isInisialized && (
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

export default GrievanceList;