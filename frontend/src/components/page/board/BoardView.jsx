import { DragDropContext } from "@hello-pangea/dnd";
import { useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  useGetProjectBoardTasksQuery,
  useUpdateProjectBoardTagMutation,
  useAddProjectBoardTagMutation,
  useGetProjectBoardTagsQuery,
} from "@/services/project.service";
import ProjectList from "./TaskList";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CustomInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const ProjectBoardView = () => {
  const location = useLocation();
  const { projectId } = useParams();
  const [createProjectList] = useAddProjectBoardTagMutation();
  const [updateProjectListName] = useUpdateProjectBoardTagMutation();

  const { data: boardData } = useGetProjectBoardTasksQuery(projectId);
  const { data: boardTags } = useGetProjectBoardTagsQuery(projectId);

  const [lists, setLists] = useState([]);
  const [tasks, setTasks] = useState({});
  const [hasNextPage, setHasNextPage] = useState({});
  const [isInitialized, setIsInitialized] = useState({});
  const [totalTasksCount, setTotalTasksCount] = useState({});
  const [page, setPage] = useState({});
  const [newListTitle, setNewListTitle] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handlePageChange = (listId, newPage) => {
    setPage((prev) => ({
      ...prev,
      [listId]: newPage,
    }));
  };

  useEffect(() => {
    if (boardData) {
      const newTasks = {};
      const newHasNextPage = {};
      const newIsInitialized = {};
      const newTotalTasksCount = {};
      const newPage = {};

      boardTags?.data?.forEach((tag) => {
        newTasks[tag] = boardData.data.tasks.filter((task) => task.tag === tag);
        newHasNextPage[tag] = boardData.data.pagination.hasNextPage;
        newIsInitialized[tag] = true;
        newTotalTasksCount[tag] = newTasks[tag].length;
        newPage[tag] = 1;
      });

      setTasks(newTasks);
      setHasNextPage(newHasNextPage);
      setIsInitialized(newIsInitialized);
      setTotalTasksCount(newTotalTasksCount);
      setPage(newPage);
    }
  }, [boardData, boardTags]);

  useEffect(() => {
    if (boardTags) {
      setLists(boardTags.data);
    }
  }, [boardTags]);

  const handleCreateList = async () => {
    try {
      const data = { tag: newListTitle };
      await createProjectList({ id: projectId, data }).unwrap();
      setLists((prev) => [...prev, newListTitle]);
      setTasks((prev) => ({ ...prev, [newListTitle]: [] }));
      setHasNextPage((prev) => ({ ...prev, [newListTitle]: false }));
      setIsInitialized((prev) => ({ ...prev, [newListTitle]: true }));
      setTotalTasksCount((prev) => ({ ...prev, [newListTitle]: 0 }));
      setPage((prev) => ({ ...prev, [newListTitle]: 1 }));
      setNewListTitle("");
      setIsPopoverOpen(false);
    } catch (error) {
      console.error("Error creating list:", error);
      toast.error("Failed to create list");
    }
  };

  const handleUpdateListName = async (listId, newName) => {
    try {
      if (listId === newName) return;
      const data = { newtag: newName, oldtag: listId };
      await updateProjectListName({ id: projectId, data }).unwrap();
      setLists((prev) =>
        prev.map((list) => (list === listId ? newName : list))
      );
    } catch (error) {
      console.error("Error updating list name:", error);
      toast.error("Failed to update list name");
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

  const onDragEnd = async (taskId, newStatus, destinationDraggableProps) => {
    let originalTasks;
    let originalTasksCount;

    try {
      originalTasks = JSON.parse(JSON.stringify(tasks));
      originalTasksCount = JSON.parse(JSON.stringify(totalTasksCount));

      let destinationTasks = [...tasks[newStatus]];
      const destinationIndex = destinationDraggableProps.index;
      destinationTasks = destinationTasks.filter((task) => task.id !== taskId);
      const prevRank =
        destinationIndex > 0 ? destinationTasks[destinationIndex - 1].rank : null;
      const nextRank =
        destinationIndex < destinationTasks.length
          ? destinationTasks[destinationIndex].rank
          : null;

      const updatedTasks = Object.keys(tasks).reduce((acc, status) => {
        acc[status] = [...tasks[status]];
        return acc;
      }, {});

      const oldStatus = Object.keys(updatedTasks).find((status) =>
        updatedTasks[status].some((task) => task.id === taskId)
      );

      if (!oldStatus) {
        throw new Error("Task not found in any list.");
      }

      const taskToMove = updatedTasks[oldStatus].find((task) => task.id === taskId);

      if (!taskToMove) {
        throw new Error("Task not found.");
      }

      updatedTasks[oldStatus] = updatedTasks[oldStatus].filter(
        (task) => task.id !== taskId
      );

      if (!updatedTasks[newStatus]) {
        updatedTasks[newStatus] = [];
      }

      const updatedDestinationArray = [...updatedTasks[newStatus]];
      updatedDestinationArray.splice(destinationIndex, 0, {
        ...taskToMove,
        tag: newStatus,
      });

      updatedTasks[newStatus] = updatedDestinationArray;

      setTasks(updatedTasks);
      handleCardMoveCount(oldStatus, newStatus);

      const updatedTask = prevRank + nextRank / 2;

      if (updatedTask) {
        setTasks((prevTasks) => {
          const newStatus = updatedTask.tag;
          const updatedNewList = prevTasks[newStatus].map((task) =>
            task.id === updatedTask.id ? { ...task, rank: updatedTask.rank } : task
          );

          return {
            ...prevTasks,
            [newStatus]: updatedNewList,
          };
        });
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error(error.message || "An error occurred while updating the task");
      setTasks(originalTasks);
      setTotalTasksCount(originalTasksCount);
    }
  };

  const handleCardMoveCount = (oldStatus, newStatus) => {
    if (oldStatus === newStatus) return;

    setTotalTasksCount((prev) => ({
      ...prev,
      [oldStatus]: prev[oldStatus] - 1,
      [newStatus]: prev[newStatus] + 1,
    }));
  };

  return (
    <div className="flex flex-col space-y-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex space-x-4 overflow-x-auto">
          {lists.map((list) => (
            <ProjectList
              key={list}
              list={{ _id: list, name: list }}
              tasks={tasks[list]}
              location={location}
              hasNextPage={hasNextPage[list]}
              page={page[list]}
              isInitialized={isInitialized[list]}
              totalTasksCount={totalTasksCount[list]}
              onPageChange={handlePageChange}
              onUpdateListName={handleUpdateListName}
            />
          ))}
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                onClick={() => setIsPopoverOpen(true)}
                className=" h-10 shrink-0 min-w-52 p-2 px-4 pr-6 dark:bg-slate-900/50 dark:hover:bg-slate-800/50 rounded-lg shadow-md transition-all"
              >
                <Plus className="mr-2" size={20} /> Add New List
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-4">
              <h2 className="text-lg font-semibold mb-4">Add New List</h2>
              <CustomInput
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="List Title"
                className="mb-4"
              />
              <Button onClick={handleCreateList}>
                Create List
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </DragDropContext>
    </div>
  );
};

export default ProjectBoardView;
