/* eslint-disable react-hooks/exhaustive-deps */
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useSocket from "@/utils/useSocket";
import {
  useGetTasksByProjectQuery,
  useUpdateTaskStatusMutation,
} from "@/services/task.service";
import { useUpdateBoardMutation } from "@/services/board.service";
import TaskList from "./TaskList";

// Component to fetch tasks for a single column
const ColumnTasksFetcher = ({
  projectId,
  columnKey,
  page,
  filters,
  onDataLoaded,
  onError,
}) => {
  const queryFilters = useMemo(() => {
    const result = { status: columnKey, page };
    
    if (filters.assignee) result.assignee = filters.assignee;
    if (filters.priority) result.priority = filters.priority;
    if (filters.type) result.type = filters.type;
    if (filters.search) result.search = filters.search;
    if (filters.myFilter && filters.myFilter !== "all") {
      result.my_filter = filters.myFilter;
    }
    
    return result;
  }, [columnKey, page, filters]);

  const { data, isError } = useGetTasksByProjectQuery({
    projectId,
    filters: queryFilters,
  });

  useEffect(() => {
    if (data?.data?.tasks) {
      onDataLoaded(
        columnKey,
        data.data.tasks,
        data.data.pagination?.hasNextPage || false,
        data.data.pagination?.totalStatusCount || 0,
        page
      );
    }
  }, [data, columnKey, page]);

  useEffect(() => {
    if (isError) {
      onError(columnKey);
    }
  }, [isError, columnKey]);

  return null;
};


const TaskBoardView = ({ projectId, board, isProjectManager = false }) => {
  const socket = useSocket();
  const filters = useSelector((state) => state.project.filters);

  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [updateBoard, { isLoading: isUpdatingBoard }] = useUpdateBoardMutation();

  // Add column dialog state
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [newColumnLabel, setNewColumnLabel] = useState("");
  const [newColumnKey, setNewColumnKey] = useState("");

  // Local columns state for drag-and-drop reordering
  const [localColumns, setLocalColumns] = useState([]);

  // Get columns from board configuration and sync with local state
  const columns = useMemo(() => {
    return board?.columns || [];
  }, [board]);

  // Sync local columns with board columns
  useEffect(() => {
    setLocalColumns([...columns].sort((a, b) => a.order - b.order));
  }, [columns]);

  // Initialize state for each column
  const [page, setPage] = useState({});
  const [tasks, setTasks] = useState({});
  const [hasNextPage, setHasNextPage] = useState({});
  const [isInitialized, setIsInitialized] = useState({});
  const [totalTasksCount, setTotalTasksCount] = useState({});

  // Initialize state when columns change
  useEffect(() => {
    const initialPage = {};
    const initialTasks = {};
    const initialHasNextPage = {};
    const initialIsInitialized = {};
    const initialTotalCount = {};

    localColumns.forEach((col) => {
      initialPage[col.key] = 1;
      initialTasks[col.key] = [];
      initialHasNextPage[col.key] = false;
      initialIsInitialized[col.key] = false;
      initialTotalCount[col.key] = 0;
    });

    setPage(initialPage);
    setTasks(initialTasks);
    setHasNextPage(initialHasNextPage);
    setIsInitialized(initialIsInitialized);
    setTotalTasksCount(initialTotalCount);
  }, [columns]);

  const handlePageChange = useCallback((status, newPage) => {
    setPage((prev) => ({
      ...prev,
      [status]: newPage,
    }));
  }, []);

  const handleDataLoaded = useCallback((status, newTasks, hasNextPageStatus, totalCount, currentPage) => {
    if (currentPage === 1) {
      // Initial load
      setTasks((prev) => ({
        ...prev,
        [status]: newTasks,
      }));
      setIsInitialized((prev) => ({
        ...prev,
        [status]: true,
      }));
    } else {
      // Subsequent loads (pagination)
      setTasks((prev) => ({
        ...prev,
        [status]: [...(prev[status] || []), ...newTasks],
      }));
    }

    setHasNextPage((prev) => ({
      ...prev,
      [status]: hasNextPageStatus,
    }));

    setTotalTasksCount((prev) => ({
      ...prev,
      [status]: totalCount,
    }));
  }, []);

  const handleError = useCallback((status) => {
    setIsInitialized((prev) => ({
      ...prev,
      [status]: true,
    }));
  }, []);

  const handleCardMoveCount = useCallback((oldStatus, newStatus) => {
    if (oldStatus === newStatus) return;

    setTotalTasksCount((prev) => ({
      ...prev,
      [oldStatus]: Math.max(0, (prev[oldStatus] || 0) - 1),
      [newStatus]: (prev[newStatus] || 0) + 1,
    }));
  }, []);

  // Handle drag end with optimistic updates
  const onDragEnd = async (taskId, newStatus, destinationDraggableProps) => {
    let originalTasks;
    let originalTasksCount;

    try {
      // Create deep copies for rollback
      originalTasks = JSON.parse(JSON.stringify(tasks));
      originalTasksCount = JSON.parse(JSON.stringify(totalTasksCount));

      // Get destination tasks and calculate ranks
      let destinationTasks = [...(tasks[newStatus] || [])];
      const destinationIndex = destinationDraggableProps.index;
      destinationTasks = destinationTasks.filter((task) => task._id !== taskId);

      const prevRank =
        destinationIndex > 0
          ? destinationTasks[destinationIndex - 1]?.rank
          : null;

      const nextRank =
        destinationIndex < destinationTasks.length
          ? destinationTasks[destinationIndex]?.rank
          : null;

      // Create updated tasks object
      const updatedTasks = Object.keys(tasks).reduce((acc, status) => {
        acc[status] = [...(tasks[status] || [])];
        return acc;
      }, {});

      // Find old status
      const oldStatus = Object.keys(updatedTasks).find((status) =>
        updatedTasks[status].some((task) => task._id === taskId)
      );

      if (!oldStatus) {
        throw new Error("Task not found in any column.");
      }

      // Find task to move
      const taskToMove = updatedTasks[oldStatus].find(
        (task) => task._id === taskId
      );

      if (!taskToMove) {
        throw new Error("Task not found.");
      }

      // Remove from old status
      updatedTasks[oldStatus] = updatedTasks[oldStatus].filter(
        (task) => task._id !== taskId
      );

      // Ensure destination array exists
      if (!updatedTasks[newStatus]) {
        updatedTasks[newStatus] = [];
      }

      // Insert at destination
      const updatedDestinationArray = [...updatedTasks[newStatus]];
      updatedDestinationArray.splice(destinationIndex, 0, {
        ...taskToMove,
        status: newStatus,
      });
      updatedTasks[newStatus] = updatedDestinationArray;

      // Optimistic update
      setTasks(updatedTasks);
      handleCardMoveCount(oldStatus, newStatus);

      // Call API
      const response = await updateTaskStatus({
        id: taskId,
        data: {
          status: newStatus,
          prevRank,
          nextRank,
        },
      });

      const updatedTask = response.data?.data;

      // Update rank from response
      if (updatedTask) {
        setTasks((prevTasks) => {
          const status = updatedTask.status;
          const updatedList = (prevTasks[status] || []).map((task) =>
            task._id === updatedTask._id
              ? { ...task, rank: updatedTask.rank }
              : task
          );
          return {
            ...prevTasks,
            [status]: updatedList,
          };
        });
      }

      if (response.error) {
        throw new Error(response.error.data?.message || "Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error(error.message || "An error occurred while updating the task");
      // Rollback
      setTasks(originalTasks);
      setTotalTasksCount(originalTasksCount);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId, type } = result;

    // Handle column reordering
    if (type === "COLUMN") {
      if (source.index === destination.index) return;
      
      // Only managers can reorder columns
      if (!isProjectManager) {
        toast.error("Only project managers can reorder columns");
        return;
      }

      // Optimistically update local columns
      const reorderedColumns = [...localColumns];
      const [movedColumn] = reorderedColumns.splice(source.index, 1);
      reorderedColumns.splice(destination.index, 0, movedColumn);

      // Update order values
      const updatedColumns = reorderedColumns.map((col, index) => ({
        ...col,
        order: index,
      }));

      setLocalColumns(updatedColumns);

      // Save to backend
      updateBoard({
        id: board._id,
        data: { columns: updatedColumns },
      })
        .unwrap()
        .then(() => {
          toast.success("Column order updated");
        })
        .catch((error) => {
          console.error("Failed to update column order:", error);
          toast.error("Failed to update column order");
          // Rollback on error
          setLocalColumns([...columns].sort((a, b) => a.order - b.order));
        });

      return;
    }

    // Handle task drag
    if (
      source.droppableId !== destination.droppableId ||
      source.index !== destination.index
    ) {
      onDragEnd(draggableId, destination.droppableId, destination);
    }
  };

  // Reset state when filters change
  useEffect(() => {
    const resetPage = {};
    const resetTasks = {};
    const resetInitialized = {};

    localColumns.forEach((col) => {
      resetPage[col.key] = 1;
      resetTasks[col.key] = [];
      resetInitialized[col.key] = false;
    });

    setPage(resetPage);
    setTasks(resetTasks);
    setIsInitialized(resetInitialized);
  }, [filters]);


  // Socket event handlers
  const handleUpdateTask = useCallback((msg) => {
    // Only handle updates for this project
    if (msg.projectId && msg.projectId !== projectId) return;

    let oldStatus = null;
    setTasks((prevTasks) => {
      const updatedTask = msg.updatedData;
      const newStatus = updatedTask.status;

      // If task is not active, remove it
      if (!updatedTask.is_active) {
        return {
          ...prevTasks,
          [newStatus]: (prevTasks[newStatus] || []).filter(
            (task) => task._id !== updatedTask._id
          ),
        };
      }

      // Find old status
      oldStatus = Object.keys(prevTasks).find((status) =>
        (prevTasks[status] || []).some((task) => task._id === updatedTask._id)
      );

      if (!oldStatus) return prevTasks;

      // Remove from old list
      const updatedOldList = (prevTasks[oldStatus] || []).filter(
        (task) => task._id !== updatedTask._id
      );

      // Add to new list
      const updatedNewList = [
        ...(prevTasks[newStatus] || []).filter(
          (task) => task._id !== updatedTask._id
        ),
        updatedTask,
      ];

      // Sort by rank
      const sortedNewList = updatedNewList.sort((a, b) =>
        (a.rank || "").localeCompare(b.rank || "", undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );

      return {
        ...prevTasks,
        [oldStatus]: updatedOldList,
        [newStatus]: sortedNewList,
      };
    });

    if (oldStatus) {
      handleCardMoveCount(oldStatus, msg.updatedData.status);
    }
  }, [handleCardMoveCount, projectId]);

  // Handle task status update from socket (drag-drop by other users)
  const handleUpdateTaskStatus = useCallback((msg) => {
    // Only handle updates for this project
    if (msg.projectId && msg.projectId !== projectId) return;

    const updatedTask = msg.updatedData;
    const newStatus = updatedTask.status;
    const oldStatus = msg.oldStatus;

    setTasks((prevTasks) => {
      // Find current status of the task in our state
      const currentStatus = Object.keys(prevTasks).find((status) =>
        (prevTasks[status] || []).some((task) => task._id === updatedTask._id)
      );

      // If task not found in current state, add it to the new status column
      if (!currentStatus) {
        const updatedNewList = [updatedTask, ...(prevTasks[newStatus] || [])];
        const sortedNewList = updatedNewList.sort((a, b) =>
          (a.rank || "").localeCompare(b.rank || "", undefined, {
            numeric: true,
            sensitivity: "base",
          })
        );
        return {
          ...prevTasks,
          [newStatus]: sortedNewList,
        };
      }

      // Remove from current status
      const updatedOldList = (prevTasks[currentStatus] || []).filter(
        (task) => task._id !== updatedTask._id
      );

      // Add to new status
      const updatedNewList = [
        ...(prevTasks[newStatus] || []).filter(
          (task) => task._id !== updatedTask._id
        ),
        updatedTask,
      ];

      // Sort by rank
      const sortedNewList = updatedNewList.sort((a, b) =>
        (a.rank || "").localeCompare(b.rank || "", undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );

      return {
        ...prevTasks,
        [currentStatus]: updatedOldList,
        [newStatus]: sortedNewList,
      };
    });

    // Update counts if status changed
    if (oldStatus && oldStatus !== newStatus) {
      handleCardMoveCount(oldStatus, newStatus);
    }
  }, [handleCardMoveCount, projectId]);

  // Handle task created from socket (by other users)
  const handleSocketTaskCreated = useCallback((msg) => {
    // Only handle tasks for this project
    if (msg.projectId && msg.projectId !== projectId) return;

    const task = msg.updatedData;
    if (!task) return;

    const status = task.status || columns[0]?.key;
    if (!status) return;

    // Check if task already exists (avoid duplicates)
    setTasks((prev) => {
      const existingTask = (prev[status] || []).find((t) => t._id === task._id);
      if (existingTask) return prev;

      return {
        ...prev,
        [status]: [task, ...(prev[status] || [])],
      };
    });

    setTotalTasksCount((prev) => ({
      ...prev,
      [status]: (prev[status] || 0) + 1,
    }));
  }, [projectId, columns]);

  const handleDeleteTask = useCallback((msg) => {
    // Only handle deletes for this project
    if (msg.projectId && msg.projectId !== projectId) return;

    setTasks((prevTasks) => {
      const taskId = msg.taskId;
      const status = msg.status;

      return {
        ...prevTasks,
        [status]: (prevTasks[status] || []).filter((task) => task._id !== taskId),
      };
    });

    if (msg.status) {
      setTotalTasksCount((prev) => ({
        ...prev,
        [msg.status]: Math.max(0, (prev[msg.status] || 0) - 1),
      }));
    }
  }, [projectId]);

  const handleTaskCreated = useCallback((event) => {
    const { task } = event.detail;
    if (!task) return;
    
    // Check if task belongs to this project
    if (task.project_id && task.project_id !== projectId) return;
    if (task.project && task.project !== projectId) return;

    const status = task.status || columns[0]?.key;
    if (!status) return;

    // Check if task already exists (avoid duplicates)
    setTasks((prev) => {
      const existingTask = (prev[status] || []).find((t) => t._id === task._id);
      if (existingTask) return prev;

      return {
        ...prev,
        [status]: [task, ...(prev[status] || [])],
      };
    });

    setTotalTasksCount((prev) => ({
      ...prev,
      [status]: (prev[status] || 0) + 1,
    }));
  }, [projectId, columns]);

  const handleTaskDeleted = useCallback((event) => {
    const { taskId, status } = event.detail;
    if (!taskId) return;

    setTasks((prevTasks) => {
      const targetStatus =
        status ||
        Object.keys(prevTasks).find((s) =>
          (prevTasks[s] || []).some((t) => t._id === taskId)
        );

      if (!targetStatus) return prevTasks;

      return {
        ...prevTasks,
        [targetStatus]: (prevTasks[targetStatus] || []).filter((t) => t._id !== taskId),
      };
    });

    if (status) {
      setTotalTasksCount((prev) => ({
        ...prev,
        [status]: Math.max(0, (prev[status] || 0) - 1),
      }));
    }
  }, []);

  const handleOptimisticUpdate = useCallback((event) => {
    const { taskId, updatedData } = event.detail;

    setTasks((prevTasks) => {
      const newStatus = updatedData.status;

      const oldStatus = Object.keys(prevTasks).find((status) =>
        (prevTasks[status] || []).some((t) => t._id === taskId)
      );

      if (!oldStatus) return prevTasks;

      if (oldStatus !== newStatus) {
        const updatedOldList = (prevTasks[oldStatus] || []).filter(
          (t) => t._id !== taskId
        );
        const updatedNewList = [
          updatedData,
          ...(prevTasks[newStatus] || []).filter((t) => t._id !== taskId),
        ];

        return {
          ...prevTasks,
          [oldStatus]: updatedOldList,
          [newStatus]: updatedNewList,
        };
      }

      return {
        ...prevTasks,
        [oldStatus]: (prevTasks[oldStatus] || []).map((t) =>
          t._id === taskId ? { ...t, ...updatedData } : t
        ),
      };
    });
  }, []);

  // Set up socket and event listeners
  useEffect(() => {
    window.addEventListener("task_optimistic_update", handleOptimisticUpdate);
    window.addEventListener("task_created", handleTaskCreated);
    window.addEventListener("task_deleted", handleTaskDeleted);

    // Socket event listeners for real-time updates from other users
    socket.on("update_task", handleUpdateTask);
    socket.on("update_task_status", handleUpdateTaskStatus);
    socket.on("task_created", handleSocketTaskCreated);
    socket.on("delete_task", handleDeleteTask);

    return () => {
      window.removeEventListener("task_optimistic_update", handleOptimisticUpdate);
      window.removeEventListener("task_created", handleTaskCreated);
      window.removeEventListener("task_deleted", handleTaskDeleted);
      socket.off("update_task");
      socket.off("update_task_status");
      socket.off("task_created");
      socket.off("delete_task");
    };
  }, [socket, handleUpdateTask, handleUpdateTaskStatus, handleSocketTaskCreated, handleDeleteTask, handleTaskCreated, handleTaskDeleted, handleOptimisticUpdate]);

  // Generate column key from label
  const generateColumnKey = (label) => {
    return label
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  // Handle label change and auto-generate key
  const handleLabelChange = (value) => {
    setNewColumnLabel(value);
    setNewColumnKey(generateColumnKey(value));
  };

  // Handle add column
  const handleAddColumn = async () => {
    if (!newColumnLabel.trim()) {
      toast.error("Column label is required");
      return;
    }

    if (!newColumnKey.trim()) {
      toast.error("Column key is required");
      return;
    }

    // Check if key already exists
    if (localColumns.some((col) => col.key === newColumnKey)) {
      toast.error("A column with this key already exists");
      return;
    }

    try {
      const newColumn = {
        key: newColumnKey,
        label: newColumnLabel.trim(),
        order: localColumns.length,
      };

      const updatedColumns = [...localColumns, newColumn];

      await updateBoard({
        id: board._id,
        data: { columns: updatedColumns },
      }).unwrap();

      toast.success("Column added successfully");
      setIsAddColumnOpen(false);
      setNewColumnLabel("");
      setNewColumnKey("");
    } catch (error) {
      console.error("Failed to add column:", error);
      toast.error(error?.data?.message || "Failed to add column");
    }
  };

  return (
    <>
      {/* Render fetchers for each column */}
      {localColumns.map((column) => (
        <ColumnTasksFetcher
          key={`${column.key}-${page[column.key] || 1}`}
          projectId={projectId}
          columnKey={column.key}
          page={page[column.key] || 1}
          filters={filters}
          onDataLoaded={handleDataLoaded}
          onError={handleError}
        />
      ))}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board-columns" direction="horizontal" type="COLUMN">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex items-start gap-4 overflow-x-auto overflow-y-hidden h-[calc(100vh-180px)]"
            >
              {localColumns.map((column, index) => (
                <Draggable
                  key={column.key}
                  draggableId={`column-${column.key}`}
                  index={index}
                  isDragDisabled={!isProjectManager}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={snapshot.isDragging ? "opacity-90" : ""}
                    >
                      <TaskList
                        column={column}
                        tasks={tasks[column.key] || []}
                        hasNextPage={hasNextPage[column.key] || false}
                        page={page[column.key] || 1}
                        isInitialized={isInitialized[column.key] || false}
                        totalTasksCount={totalTasksCount[column.key] || 0}
                        onPageChange={handlePageChange}
                        dragHandleProps={isProjectManager ? provided.dragHandleProps : null}
                        isProjectManager={isProjectManager}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              {/* Add Column Button - Only visible to project managers */}
              {isProjectManager && (
                <div className="flex-shrink-0 w-[300px]">
                  <Button
                    variant="outline"
                    className="w-full h-12 border-dashed border-2 text-muted-foreground hover:text-foreground hover:border-primary/50"
                    onClick={() => setIsAddColumnOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Column
                  </Button>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add Column Dialog */}
      <Dialog open={isAddColumnOpen} onOpenChange={setIsAddColumnOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Column</DialogTitle>
            <DialogDescription>
              Add a new column to your board. The column key will be auto-generated from the label.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="columnLabel">Column Label</Label>
              <Input
                id="columnLabel"
                placeholder="e.g., In Review"
                value={newColumnLabel}
                onChange={(e) => handleLabelChange(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="columnKey">Column Key</Label>
              <Input
                id="columnKey"
                placeholder="e.g., in-review"
                value={newColumnKey}
                onChange={(e) => setNewColumnKey(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Used internally. Only lowercase letters, numbers, and hyphens allowed.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddColumnOpen(false);
                setNewColumnLabel("");
                setNewColumnKey("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddColumn} disabled={isUpdatingBoard || !newColumnLabel.trim() || !newColumnKey.trim()}>
              {isUpdatingBoard && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Column
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskBoardView;
