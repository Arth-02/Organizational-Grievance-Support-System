/* eslint-disable react-hooks/exhaustive-deps */
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  // Use currentData instead of data - currentData is undefined when args change
  // until fresh data arrives, preventing stale cached data from being shown
  const { currentData, isError } = useGetTasksByProjectQuery(
    {
      projectId,
      filters: queryFilters,
    }
  );

  useEffect(() => {
    if (currentData?.data?.tasks) {
      onDataLoaded(
        projectId,
        columnKey,
        currentData.data.tasks,
        currentData.data.pagination?.hasNextPage || false,
        currentData.data.pagination?.totalItems || 0,
        page
      );
    }
  }, [currentData, columnKey, page, projectId]);

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
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnLabel, setNewColumnLabel] = useState("");

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

  // Use ref to store column keys - only updates when keys actually change
  const columnKeysRef = useRef([]);
  useEffect(() => {
    const newKeys = columns.map(c => c.key).sort().join(',');
    const oldKeys = [...columnKeysRef.current].sort().join(',');
    if (newKeys !== oldKeys) {
      columnKeysRef.current = columns.map(c => c.key);
    }
  }, [columns]);

  // Ref to track current projectId for stale update prevention
  // Updated synchronously (not in useEffect) to prevent race conditions
  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;

  // Initialize state for each column - empty objects that grow as columns are discovered
  // No reset logic needed since key={projectId} on this component causes full remount
  const [page, setPage] = useState({});
  const [tasks, setTasks] = useState({});
  const [hasNextPage, setHasNextPage] = useState({});
  const [isInitialized, setIsInitialized] = useState({});
  const [totalTasksCount, setTotalTasksCount] = useState({});

  const handlePageChange = useCallback((status, newPage) => {
    setPage((prev) => ({
      ...prev,
      [status]: newPage,
    }));
  }, []);

  const handleDataLoaded = useCallback((forProjectId, status, newTasks, hasNextPageStatus, totalCount, currentPage) => {
    // Ignore updates from stale projects (race condition prevention)
    if (forProjectId !== projectIdRef.current) {
      return;
    }

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

  // Create stable filter key for comparison (only considers non-null values)
  // This is used in the ColumnTasksFetcher key to force remount when filters change
  const stableFilterKey = useMemo(() => {
    const activeFilters = {};
    if (filters.assignee) activeFilters.assignee = filters.assignee;
    if (filters.priority) activeFilters.priority = filters.priority;
    if (filters.type) activeFilters.type = filters.type;
    if (filters.search) activeFilters.search = filters.search;
    if (filters.myFilter && filters.myFilter !== "all") activeFilters.myFilter = filters.myFilter;
    return JSON.stringify(activeFilters);
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

  // Handle add column
  const handleAddColumn = async () => {
    if (!newColumnLabel.trim()) {
      toast.error("Column label is required");
      return;
    }

    const columnKey = generateColumnKey(newColumnLabel);

    // Check if key already exists
    if (localColumns.some((col) => col.key === columnKey)) {
      toast.error("A column with this name already exists");
      return;
    }

    try {
      const newColumn = {
        key: columnKey,
        label: newColumnLabel.trim(),
        order: localColumns.length,
      };

      const updatedColumns = [...localColumns, newColumn];

      await updateBoard({
        id: board._id,
        data: { columns: updatedColumns },
      }).unwrap();

      toast.success("Column added successfully");
      setIsAddingColumn(false);
      setNewColumnLabel("");
    } catch (error) {
      console.error("Failed to add column:", error);
      toast.error(error?.data?.message || "Failed to add column");
    }
  };

  // Handle cancel add column
  const handleCancelAddColumn = () => {
    setIsAddingColumn(false);
    setNewColumnLabel("");
  };

  // Handle key press for add column input
  const handleAddColumnKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAddColumn();
    } else if (e.key === "Escape") {
      handleCancelAddColumn();
    }
  };

  // Handle rename column
  const handleRenameColumn = async (columnKey, newLabel) => {
    // Optimistically update local columns
    const updatedColumns = localColumns.map((col) =>
      col.key === columnKey ? { ...col, label: newLabel } : col
    );
    setLocalColumns(updatedColumns);

    try {
      await updateBoard({
        id: board._id,
        data: { columns: updatedColumns },
      }).unwrap();

      toast.success("Column renamed successfully");
    } catch (error) {
      // Revert on error
      setLocalColumns(localColumns);
      console.error("Failed to rename column:", error);
      toast.error(error?.data?.message || "Failed to rename column");
    }
  };

  // Handle delete column
  const handleDeleteColumn = async (columnKey, options) => {
    try {
      // Get tasks in this column
      const columnTasks = tasks[columnKey] || [];
      
      if (columnTasks.length > 0 && options) {
        if (options.action === "move" && options.targetColumn) {
          // Move all tasks to target column
          for (const task of columnTasks) {
            await updateTaskStatus({
              id: task._id,
              data: { status: options.targetColumn },
            }).unwrap();
          }
          toast.success(`${columnTasks.length} task${columnTasks.length !== 1 ? "s" : ""} moved successfully`);
        }
        // If action is "delete", we just remove the column (tasks will be deleted on backend or stay orphaned)
      }

      // Optimistically update local columns
      const updatedColumns = localColumns
        .filter((col) => col.key !== columnKey)
        .map((col, index) => ({ ...col, order: index }));
      setLocalColumns(updatedColumns);

      // Clear local state for this column
      setTasks((prev) => {
        const newTasks = { ...prev };
        delete newTasks[columnKey];
        return newTasks;
      });
      setPage((prev) => {
        const newPage = { ...prev };
        delete newPage[columnKey];
        return newPage;
      });
      setIsInitialized((prev) => {
        const newInit = { ...prev };
        delete newInit[columnKey];
        return newInit;
      });
      setTotalTasksCount((prev) => {
        const newCount = { ...prev };
        delete newCount[columnKey];
        return newCount;
      });

      await updateBoard({
        id: board._id,
        data: { columns: updatedColumns },
      }).unwrap();

      toast.success("Column deleted successfully");
    } catch (error) {
      // Revert on error - refetch will restore state
      console.error("Failed to delete column:", error);
      toast.error(error?.data?.message || "Failed to delete column");
    }
  };

  return (
    <>
      {/* Render fetchers for each column */}
      {localColumns.map((column) => (
        <ColumnTasksFetcher
          key={`${projectId}-${column.key}-${page[column.key] || 1}-${stableFilterKey}`}
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
              className="flex items-start pt-2 pl-2 gap-4 overflow-x-auto overflow-y-hidden h-[calc(100vh-180px)]"
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
                        allColumns={localColumns}
                        onRenameColumn={handleRenameColumn}
                        onDeleteColumn={handleDeleteColumn}
                        isUpdatingBoard={isUpdatingBoard}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              {/* Add Column Button/Input - Only visible to project managers */}
              {isProjectManager && (
                <div className="flex-shrink-0 w-[300px]">
                  {isAddingColumn ? (
                    <div className="bg-card border border-border rounded-lg p-3">
                      <Input
                        placeholder="Enter column name..."
                        value={newColumnLabel}
                        onChange={(e) => setNewColumnLabel(e.target.value)}
                        onKeyDown={handleAddColumnKeyPress}
                        autoFocus
                        className="mb-2"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleAddColumn}
                          disabled={isUpdatingBoard || !newColumnLabel.trim()}
                          className="flex-1"
                        >
                          {isUpdatingBoard && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelAddColumn}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full h-12 border-dashed border-2 text-muted-foreground hover:text-foreground hover:border-primary/50"
                      onClick={() => setIsAddingColumn(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Column
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>


    </>
  );
};

export default TaskBoardView;
