/* eslint-disable react-hooks/exhaustive-deps */
import { DragDropContext } from "@hello-pangea/dnd";
import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import useSocket from "@/utils/useSocket";
import {
  useGetTasksByProjectQuery,
  useUpdateTaskStatusMutation,
} from "@/services/task.service";
import TaskList from "./TaskList";

const TaskBoardView = ({ projectId, board }) => {
  const socket = useSocket();
  const filters = useSelector((state) => state.project.filters);

  const [updateTaskStatus] = useUpdateTaskStatusMutation();

  // Get columns from board configuration
  const columns = useMemo(() => {
    return board?.columns || [];
  }, [board]);

  // Initialize state for each column
  const [page, setPage] = useState(() => {
    const initial = {};
    columns.forEach((col) => {
      initial[col.key] = 1;
    });
    return initial;
  });

  const [tasks, setTasks] = useState(() => {
    const initial = {};
    columns.forEach((col) => {
      initial[col.key] = [];
    });
    return initial;
  });

  const [hasNextPage, setHasNextPage] = useState(() => {
    const initial = {};
    columns.forEach((col) => {
      initial[col.key] = false;
    });
    return initial;
  });

  const [isInitialized, setIsInitialized] = useState(() => {
    const initial = {};
    columns.forEach((col) => {
      initial[col.key] = false;
    });
    return initial;
  });

  const [totalTasksCount, setTotalTasksCount] = useState(() => {
    const initial = {};
    columns.forEach((col) => {
      initial[col.key] = 0;
    });
    return initial;
  });

  // Build query filters
  const buildFilters = (status) => {
    const queryFilters = { status, page: page[status] };
    
    if (filters.assignee) queryFilters.assignee = filters.assignee;
    if (filters.priority) queryFilters.priority = filters.priority;
    if (filters.type) queryFilters.type = filters.type;
    if (filters.search) queryFilters.search = filters.search;
    if (filters.myFilter && filters.myFilter !== "all") {
      queryFilters.my_filter = filters.myFilter;
    }
    
    return queryFilters;
  };

  // Create queries for each column dynamically
  const columnQueries = columns.map((col) => {
    const queryFilters = buildFilters(col.key);
    return useGetTasksByProjectQuery({
      projectId,
      filters: queryFilters,
    });
  });

  const handlePageChange = (status, newPage) => {
    setPage((prev) => ({
      ...prev,
      [status]: newPage,
    }));
  };

  const updateTasks = (status, newTasks, hasNextPageStatus, totalCount) => {
    if (!isInitialized[status] && page[status] === 1) {
      // Initial load
      setTasks((prev) => ({
        ...prev,
        [status]: newTasks,
      }));
      setIsInitialized((prev) => ({
        ...prev,
        [status]: true,
      }));
    } else if (page[status] > 1) {
      // Subsequent loads (pagination)
      setTasks((prev) => ({
        ...prev,
        [status]: [...prev[status], ...newTasks],
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
  };

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
        acc[status] = [...tasks[status]];
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
          const updatedList = prevTasks[status].map((task) =>
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
    const { source, destination, draggableId } = result;

    if (
      source.droppableId !== destination.droppableId ||
      source.index !== destination.index
    ) {
      onDragEnd(draggableId, destination.droppableId, destination);
    }
  };

  const handleCardMoveCount = (oldStatus, newStatus) => {
    if (oldStatus === newStatus) return;

    setTotalTasksCount((prev) => ({
      ...prev,
      [oldStatus]: Math.max(0, prev[oldStatus] - 1),
      [newStatus]: prev[newStatus] + 1,
    }));
  };

  // Update tasks when query data changes
  useEffect(() => {
    columns.forEach((col, index) => {
      const queryResult = columnQueries[index];
      if (queryResult?.data?.data?.tasks) {
        updateTasks(
          col.key,
          queryResult.data.data.tasks,
          queryResult.data.data.pagination?.hasNextPage || false,
          queryResult.data.data.pagination?.totalStatusCount || 0
        );
      }
      if (queryResult?.isError) {
        setIsInitialized((prev) => ({
          ...prev,
          [col.key]: true,
        }));
      }
    });
  }, [columnQueries.map((q) => q.data).join(",")]);

  // Reset state when filters change
  useEffect(() => {
    const resetState = {};
    columns.forEach((col) => {
      resetState[col.key] = 1;
    });
    setPage(resetState);
    
    const resetTasks = {};
    const resetInitialized = {};
    columns.forEach((col) => {
      resetTasks[col.key] = [];
      resetInitialized[col.key] = false;
    });
    setTasks(resetTasks);
    setIsInitialized(resetInitialized);
  }, [filters, columns]);

  // Socket event handlers
  const handleUpdateTask = (msg) => {
    let oldStatus = null;
    setTasks((prevTasks) => {
      const updatedTask = msg.updatedData;
      const newStatus = updatedTask.status;

      // If task is not active, remove it
      if (!updatedTask.is_active) {
        return {
          ...prevTasks,
          [newStatus]: prevTasks[newStatus]?.filter(
            (task) => task._id !== updatedTask._id
          ) || [],
        };
      }

      // Find old status
      oldStatus = Object.keys(prevTasks).find((status) =>
        prevTasks[status]?.some((task) => task._id === updatedTask._id)
      );

      if (!oldStatus) return prevTasks;

      // Remove from old list
      const updatedOldList = prevTasks[oldStatus].filter(
        (task) => task._id !== updatedTask._id
      );

      // Add to new list
      const updatedNewList = [
        ...(prevTasks[newStatus]?.filter(
          (task) => task._id !== updatedTask._id
        ) || []),
        updatedTask,
      ];

      // Sort by rank
      const sortedNewList = updatedNewList.sort((a, b) =>
        a.rank?.localeCompare(b.rank, undefined, {
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
  };

  const handleDeleteTask = (msg) => {
    setTasks((prevTasks) => {
      const taskId = msg.taskId;
      const status = msg.status;

      return {
        ...prevTasks,
        [status]: prevTasks[status]?.filter((task) => task._id !== taskId) || [],
      };
    });

    if (msg.status) {
      setTotalTasksCount((prev) => ({
        ...prev,
        [msg.status]: Math.max(0, prev[msg.status] - 1),
      }));
    }
  };

  const handleTaskCreated = (event) => {
    const { task } = event.detail;
    if (!task || task.project !== projectId) return;

    const status = task.status || columns[0]?.key;
    setTasks((prev) => ({
      ...prev,
      [status]: [task, ...(prev[status] || [])],
    }));
    setTotalTasksCount((prev) => ({
      ...prev,
      [status]: (prev[status] || 0) + 1,
    }));
  };

  const handleTaskDeleted = (event) => {
    const { taskId, status } = event.detail;
    if (!taskId) return;

    const targetStatus =
      status ||
      Object.keys(tasks).find((s) =>
        tasks[s]?.some((t) => t._id === taskId)
      );

    if (targetStatus) {
      setTasks((prev) => ({
        ...prev,
        [targetStatus]: prev[targetStatus]?.filter((t) => t._id !== taskId) || [],
      }));
      setTotalTasksCount((prev) => ({
        ...prev,
        [targetStatus]: Math.max(0, prev[targetStatus] - 1),
      }));
    }
  };

  const handleOptimisticUpdate = (event) => {
    const { taskId, updatedData } = event.detail;

    setTasks((prevTasks) => {
      const newStatus = updatedData.status;

      const oldStatus = Object.keys(prevTasks).find((status) =>
        prevTasks[status]?.some((t) => t._id === taskId)
      );

      if (!oldStatus) return prevTasks;

      if (oldStatus !== newStatus) {
        const updatedOldList = prevTasks[oldStatus].filter(
          (t) => t._id !== taskId
        );
        const updatedNewList = [
          updatedData,
          ...(prevTasks[newStatus]?.filter((t) => t._id !== taskId) || []),
        ];

        return {
          ...prevTasks,
          [oldStatus]: updatedOldList,
          [newStatus]: updatedNewList,
        };
      }

      return {
        ...prevTasks,
        [oldStatus]: prevTasks[oldStatus].map((t) =>
          t._id === taskId ? { ...t, ...updatedData } : t
        ),
      };
    });
  };

  // Set up socket and event listeners
  useEffect(() => {
    window.addEventListener("task_optimistic_update", handleOptimisticUpdate);
    window.addEventListener("task_created", handleTaskCreated);
    window.addEventListener("task_deleted", handleTaskDeleted);

    socket.on("update_task", handleUpdateTask);
    socket.on("delete_task", handleDeleteTask);

    return () => {
      window.removeEventListener("task_optimistic_update", handleOptimisticUpdate);
      window.removeEventListener("task_created", handleTaskCreated);
      window.removeEventListener("task_deleted", handleTaskDeleted);
      socket.off("update_task");
      socket.off("delete_task");
    };
  }, [socket, projectId]);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex items-start gap-4 overflow-x-auto overflow-y-hidden h-[calc(100vh-180px)]">
        {columns.map((column, index) => (
          <TaskList
            key={column.key}
            column={column}
            tasks={tasks[column.key] || []}
            hasNextPage={hasNextPage[column.key] || false}
            page={page[column.key] || 1}
            isInitialized={isInitialized[column.key] || false}
            totalTasksCount={totalTasksCount[column.key] || 0}
            onPageChange={handlePageChange}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

export default TaskBoardView;
