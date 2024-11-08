import { Draggable, Droppable } from "@hello-pangea/dnd";
import GrievanceCard from "./GrievanceCard";
import useInfiniteScroll from "@/hooks/useInfiniteScroll";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const SkeletonCard = () => (
  <div className="bg-white dark:bg-gray-600/40 rounded-lg p-4 shadow">
    <Skeleton className="h-4 w-3/4 mb-2" />
    <Skeleton className="h-4 w-1/2 mb-4" />
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-6 w-16" />
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
  onPageChange,
}) => {
  const containerRef = useRef(null);

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
  const randomSkeletonCount = Math.floor(Math.random() * 4) + 1;

  return (
    <Droppable droppableId={list} key={list}>
      {(provided, snapshot) => {
        const isDraggingOver = Boolean(snapshot.isDraggingOver);
        const isDraggingFrom = Boolean(snapshot.draggingFromThisWith);

        return (
          <div
            key={list}
            className={`flex-shrink-0 w-[370px] bg-gray-100 dark:bg-slate-900/50 max-h-full rounded-lg flex flex-col border
                  ${
                    isDraggingOver ? "dark:border-white/35" : "border-white/0"
                  } transition-all duration-200 overflow-x-hidden`}
          >
            <div className="p-4 pb-2">
              <h3 className="font-semibold capitalize">{list}</h3>
            </div>
            <div
              ref={(node) => {
                provided.innerRef(node);
                containerRef.current = node;
              }}
              {...provided.droppableProps}
              className={`flex-1 overflow-x-hidden overflow-y-auto max-h-full p-4 pt-2 transition-all duration-200`}
            >
              <div
                className={`space-y-4 transition-all duration-200 ${
                  isDraggingFrom ? "opacity-50" : "opacity-100"
                }`}
              >
                {!isInisialized ? (
                  Array.from({ length: randomSkeletonCount }).map((_, index) => (
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
              {isLoading && isInisialized && <Loader2 className="w-7 h-7 mt-4 mx-auto animate-spin" />}
            </div>
          </div>
        );
      }}
    </Droppable>
  );
};

export default GrievanceList;