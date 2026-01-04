import { Draggable, Droppable } from "@hello-pangea/dnd";
import ProjectTaskCard from "./ProjectTaskCard";
import useInfiniteScroll from "@/hooks/useInfiniteScroll";
import { useEffect, useRef, useState } from "react";
import { EllipsisVertical, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit2, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SkeletonCard = () => (
  <div className="bg-white dark:bg-gray-600/20 rounded-lg p-4 shadow">
    <Skeleton className="h-4 w-3/4 mb-2" />
    <Skeleton className="h-4 w-1/2 mb-4" />
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-6 w-16" />
    </div>
  </div>
);

const ProjectList = ({
  list,
  tasks,
  location,
  hasNextPage,
  page,
  isInitialized,
  totalTasksCount,
  onPageChange,
  onUpdateListName,
  onDeleteList,
  onAddTask,
}) => {
  const containerRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newListName, setNewListName] = useState(list.name);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const loadMoreTasks = () => {
    if (hasNextPage && !isLoading.current) {
      setIsLoading(true);
      onPageChange(list._id, page + 1);
    }
  };

  useEffect(() => {
    setIsLoading(false);
  }, [tasks]);

  const lastElementRef = useInfiniteScroll(
    loadMoreTasks,
    hasNextPage,
    isLoading
  );

  const handleListNameChange = (e) => {
    setNewListName(e.target.value);
  };

  const handleListNameSubmit = () => {
    onUpdateListName(list._id, newListName);
    setIsEditing(false);
  };

  const handleAddTask = () => {
    onAddTask(list._id, newTaskTitle);
    setNewTaskTitle("");
    setIsPopoverOpen(false);
  };

  const handleDeleteList = async () => {
    const success = await onDeleteList(list._id);
    if (success) {
      setIsModalOpen(false);
    }
  };

  return (
    <Droppable droppableId={list._id} key={list._id}>
      {(provided, snapshot) => {
        const isDraggingOver = Boolean(snapshot.isDraggingOver);
        const isDraggingFrom = Boolean(snapshot.draggingFromThisWith);

        return (
          <div
            key={list._id}
            className={`flex-shrink-0 w-[370px] h-fit bg-gray-100 dark:bg-slate-900/50 max-h-full rounded-lg flex flex-col border
                  ${
                    isDraggingOver ? "dark:border-white/35" : "border-white/0"
                  } transition-all duration-200 overflow-x-hidden`}
          >
            <div className="p-4 pb-2 flex justify-between items-center">
              {isEditing ? (
                <input
                  type="text"
                  value={newListName}
                  onChange={handleListNameChange}
                  onBlur={handleListNameSubmit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleListNameSubmit();
                    }
                  }}
                  className="bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none"
                />
              ) : (
                <h3
                  className="font-semibold capitalize cursor-pointer"
                  onClick={() => setIsEditing(true)}
                >
                  {list.name} {`(${totalTasksCount})`}
                </h3>
              )}

              {/* Menu of options like delete list, update name this list */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <EllipsisVertical className="w-[30px] h-7 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10 dark:focus:bg-white/10 cursor-pointer p-1 rounded-md transition-all" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-gray-900 rounded-md shadow-lg">
                  <DropdownMenuItem
                    className="hover:bg-gray-100 dark:hover:bg-gray-600/50 cursor-pointer"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="w-4 h-4 mr-3" />
                    Change Name
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 hover:text-red-600 hover:bg-red-200/40 dark:text-red-400 dark:hover:bg-red-500/20 cursor-pointer focus:bg-red-200/40 focus:text-red-600"
                    onSelect={(e) => {
                      e.preventDefault();
                      setIsModalOpen(true);
                    }}
                  >
                    <Trash className="w-4 h-4 mr-3" />
                    Delete List
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {isPopoverOpen && (
              <div className="p-4">
                <Input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task Title"
                  className="mb-4"
                />
                <Button
                  onClick={handleAddTask}
                  className="bg-blue-500 text-gray-200"
                >
                  Add Task
                </Button>
              </div>
            )}

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
                {!isInitialized
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <SkeletonCard key={index} />
                    ))
                  : tasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <ProjectTaskCard
                            task={task}
                            provided={provided}
                            snapshot={snapshot}
                            location={location}
                          />
                        )}
                      </Draggable>
                    ))}
                {hasNextPage && <div ref={lastElementRef} className="h-4" />}
              </div>
              {provided.placeholder}
              {isLoading && isInitialized && (
                <Loader2 className="w-7 h-7 mt-4 mx-auto animate-spin" />
              )}
            </div>

            {/* AlertDialog for confirming deletion */}
            <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this list? This action cannot be undone.
                    This will permanently delete the list and all related tasks.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleDeleteList}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      }}
    </Droppable>
  );
};

export default ProjectList;
