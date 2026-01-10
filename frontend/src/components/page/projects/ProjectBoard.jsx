import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Plus, Settings, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetProjectByIdQuery } from "@/services/project.service";
import { useGetBoardsByProjectQuery } from "@/services/board.service";
import { setCurrentProject } from "@/features/projectSlice";
import { useEffect, useState } from "react";
import TaskBoardView from "./TaskBoardView";
import TaskFilters from "./TaskFilters";
import TaskModal from "./TaskModal";
import TaskForm from "./TaskForm";

const ProjectBoard = () => {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);

  const userPermissions = useSelector((state) => state.user.permissions);
  const currentUser = useSelector((state) => state.user.user);
  const canUpdate = userPermissions.includes("UPDATE_PROJECT");

  // Fetch project data
  const {
    data: projectData,
    isLoading: projectLoading,
    error: projectError,
  } = useGetProjectByIdQuery(projectId);

  // Fetch board data for the project
  const {
    data: boardData,
    isLoading: boardLoading,
    error: boardError,
  } = useGetBoardsByProjectQuery(projectId);

  const project = projectData?.data;
  const board = boardData?.data?.[0]; // Get the first (default) board

  // Check if user can create tasks (is project member or manager)
  const isProjectMember = project?.members?.some(m => m._id === currentUser?._id);
  const isProjectManager = project?.manager?.some(m => m._id === currentUser?._id);
  const canCreateTask = isProjectMember || isProjectManager;

  // Set current project in Redux when loaded
  useEffect(() => {
    if (project) {
      dispatch(setCurrentProject(project));
    }
    return () => {
      dispatch(setCurrentProject(null));
    };
  }, [project, dispatch]);

  // Get selected task ID from URL params
  const selectedTaskId = searchParams.get("taskId");

  const handleCloseTaskModal = () => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.delete("taskId");
      return newParams;
    });
  };

  const handleAddTask = () => {
    setIsTaskFormOpen(true);
  };

  const handleTaskFormSuccess = () => {
    // Task created successfully, form will close automatically
    // The board will update via RTK Query cache invalidation
  };

  // Loading state
  if (projectLoading || boardLoading) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex justify-between items-center pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-7 w-48" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
        <div className="flex-1 flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="w-[350px] h-full rounded-lg flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (projectError || boardError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <p className="text-destructive mb-4">
          {projectError?.data?.message || boardError?.data?.message || "Failed to load project"}
        </p>
        <Button variant="outline" onClick={() => navigate("/projects")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    );
  }

  // No project found
  if (!project) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Project not found</p>
        <Button variant="outline" onClick={() => navigate("/projects")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/projects")}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              {project.name}
              <span className="text-sm font-normal text-muted-foreground">
                ({project.key})
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Task Filters */}
          <TaskFilters projectId={projectId} />
          
          {/* Add Task Button */}
          {canCreateTask && (
            <Button size="sm" onClick={handleAddTask}>
              <Plus size={18} className="mr-2" />
              Add Task
            </Button>
          )}

          {/* Settings Link */}
          {canUpdate && (
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-9 w-9"
            >
              <Link to={`/projects/${projectId}/settings`}>
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Board View */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {board ? (
          <TaskBoardView
            projectId={projectId}
            board={board}
            selectedTaskId={selectedTaskId}
            onCloseTaskModal={handleCloseTaskModal}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No board configured for this project</p>
          </div>
        )}
      </div>

      {/* Task Modal */}
      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          projectId={projectId}
          onClose={handleCloseTaskModal}
        />
      )}

      {/* Task Form Modal */}
      <TaskForm
        projectId={projectId}
        defaultStatus="todo"
        open={isTaskFormOpen}
        onOpenChange={setIsTaskFormOpen}
        onSuccess={handleTaskFormSuccess}
        onCancel={() => setIsTaskFormOpen(false)}
      />
    </div>
  );
};

export default ProjectBoard;
