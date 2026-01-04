import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
// import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Paperclip,
  Users,
  AlertTriangle,
  X,
  Loader2,
} from "lucide-react";
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
import ActionComboBoxButton from "../../ui/ActionComboBoxButton";
import EditableDescription from "../../ui/EditableDescription";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import EditableTitle from "../../ui/EditableTitle";
import { useGetAllUserNamesQuery } from "@/services/user.service";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoutableModal } from "@/components/ui/RoutedModal";
import AttachmentManager from "../../ui/MediaManager";
import useSocket from "@/utils/useSocket";
import {
  useUpdateProjectBoardTaskMutation,
  useDeleteProjectBoardTaskMutation,
  useGetProjectBoardTaskByIdQuery,
} from "@/services/project.service";
import GrievanceModalSkeleton from "../grievance/GreievanceCardModalSkeleton";
import AvatarGroup from "@/components/ui/AvatarGroup";

const PRIORITY_BADGES = {
  low: { color: "bg-green-500/10 text-green-500", label: "Low" },
  medium: { color: "bg-yellow-500/10 text-yellow-500", label: "Medium" },
  high: { color: "bg-red-500/10 text-red-500", label: "High" },
};

const TAG_BADGES = {
  todo: { color: "bg-blue-500/10 text-blue-500", label: "Todo" },
  in_progress: {
    color: "bg-yellow-500/10 text-yellow-500",
    label: "In Progress",
  },
  done: { color: "bg-green-500/10 text-green-500", label: "Done" },
};

const TaskModal = () => {
  const { projectId, boardId, taskId } = useParams();
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [isTagSelectOpen, setIsTagSelectOpen] = useState(false);
  const [isPrioritySelectOpen, setIsPrioritySelectOpen] = useState(false);

  const [updateTask] = useUpdateProjectBoardTaskMutation();
  const [deleteTask] = useDeleteProjectBoardTaskMutation();
  const { data: users } = useGetAllUserNamesQuery();
  const {
    data: taskData,
    isLoading,
    refetch,
  } = useGetProjectBoardTaskByIdQuery({
    project_id: projectId,
    task_id: taskId,
  });

  const task = taskData?.data;

  const navigate = useNavigate();

  const socket = useSocket();

  // const userPermissions = useSelector((state) => state.user.permissions);
  // const user = useSelector((state) => state.user.user);

  const canEditTag = true;
  const canEditPriority = true;
  const canEditAssignee = true;
  const canEditAttachments = true;
  const canEditTask = true;
  const canEditTitleAndDescription = true;
  const canDeleteTask = true;

  const handleUpdateTask = async (data) => {
    try {
      const response = await updateTask({
        project_id: projectId,
        task_id: taskId,
        data,
      }).unwrap();
      refetch();
      toast.success(response.message);
    } catch (error) {
      console.error("Failed to update task:", error);
      toast.error(error.data.message);
    }
  };

  const handleUpdateTaskAssignee = async (assigneeId) => {
    try {
      await updateTask({
        project_id: projectId,
        task_id: taskId,
        data: {
          assignee_to: assigneeId,
        },
      }).unwrap();
      refetch();
      // toast.success(response.message);
    } catch (error) {
      console.error("Failed to update assignee:", error);
      toast.error(error.data.message);
    }
  };

  const handleCloseTask = async () => {
    setDeleting(true);
    try {
      await deleteTask({ project_id: projectId, task_id: taskId }).unwrap();
      navigate(-1);
      toast.success("Task deleted successfully");
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error(error.data.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isTagSelectOpen && !isPrioritySelectOpen) {
      navigate(-1);
    }
  };

  const usersList = users?.data
    ?.map((user) => ({
      label: user.username,
      value: user._id,
      image: user.avatar,
      email: user.email,
    }))
    .filter(
      (u) =>
        !task?.assignee_to?.some((assigned) => assigned._id === u.value) &&
        u.value !== task?.created_by?._id
    );

  useEffect(() => {
    socket.on("update_task", handleUpdateTask);
    socket.on("update_task_assignee", handleUpdateTask);
    socket.on("update_task_tag", handleUpdateTask);
    socket.on("delete_task", handleCloseTask);
    return () => {
      socket.off("update_task", handleUpdateTask);
      socket.off("update_task_assignee", handleUpdateTask);
      socket.off("update_task_tag", handleUpdateTask);
      socket.off("delete_task", handleCloseTask);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  return (
    <RoutableModal
      backTo={`/projects/${projectId}/board/${boardId}`}
      width="max-w-4xl"
      shouldRemoveCloseIcon={true}
      onPointerDownOutside={(e) => {
        if (isTagSelectOpen || isPrioritySelectOpen) {
          e.preventDefault();
        }
      }}
    >
      {isLoading && <GrievanceModalSkeleton />}
      {!isLoading && (
        <div className="bg-gray-100 dark:bg-slate-800 rounded-lg w-full max-h-[90vh] focus:border-red-700 focus-within:border-red-700 focus-visible:border-red-700 overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="p-4 flex items-start justify-between border-gray-200 dark:border-slate-700">
              <div className="flex-1">
                <EditableTitle
                  title={task?.title}
                  canEditTitle={canEditTitleAndDescription}
                  updateTitle={handleUpdateTask}
                />
                <div className="flex items-center gap-2 mt-3">
                  {task?.tag && (
                    <Badge
                      className={cn("font-medium", TAG_BADGES[task.tag].color)}
                    >
                      {TAG_BADGES[task.tag].label}
                    </Badge>
                  )}
                  {task?.priority && (
                    <Badge
                      className={cn(
                        "font-medium",
                        PRIORITY_BADGES[task.priority].color
                      )}
                    >
                      {PRIORITY_BADGES[task.priority].label}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600/50"
                onClick={handleClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>

          <Separator className="w-[97%] mx-auto bg-gray-200 dark:bg-white/10 h-[1px]" />

          <div className="flex-1 overflow-y-auto">
            <div className="p-4 flex gap-6">
              {/* Left Column - Main Content */}
              <div className="flex-1 space-y-6">
                <div className="flex flex-wrap gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                      Created By
                    </h3>
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger>
                          <Avatar>
                            <AvatarImage
                              src={task?.created_by?.avatar}
                              alt={task?.created_by?.username}
                            />
                            <AvatarFallback>
                              {task?.created_by?.username[0]}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          {task?.created_by?.username}
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-gray-700 dark:text-slate-300">
                        {task?.created_by?.username || "User"}
                      </span>
                    </div>
                  </div>
                  {task?.assignee_to?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                        Assigned To
                      </h3>
                      <div className="flex items-center gap-2">
                        <AvatarGroup users={task.assignee_to} shoudlShowFilters={false} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <EditableDescription
                  description={task?.description}
                  canEdit={canEditTitleAndDescription}
                  onSave={(content) => {
                    handleUpdateTask({ description: content });
                  }}
                />

                <AttachmentManager
                  projectId={projectId}
                  taskId={taskId}
                  existingAttachments={task?.attachments || []}
                  uploadModal={attachmentModalOpen}
                  setUploadModal={setAttachmentModalOpen}
                  canEdit={canEditAttachments}
                />
              </div>

              {/* Right Column - Actions */}
              <div className="w-48 space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400">
                    Tag
                  </h4>
                  {canEditTag ? (
                    <Select
                      value={task?.tag}
                      modal={false}
                      onValueChange={(value) => {
                        handleUpdateTask({ tag: value });
                      }}
                      onOpenChange={setIsTagSelectOpen}
                    >
                      <SelectTrigger className="w-full bg-white hover:bg-gray-50 dark:bg-slate-900/70 dark:hover:bg-slate-900/50">
                        <SelectValue placeholder="Select tag" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900">
                        {Object.entries(TAG_BADGES).map(
                          ([value, { label, color }]) => (
                            <SelectItem
                              key={value}
                              value={value}
                              className="hover:bg-gray-100 dark:hover:bg-slate-700/50"
                            >
                              <span
                                className={`px-2 py-1 rounded text-sm ${color}`}
                              >
                                {label}
                              </span>
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div
                      className={`px-2 py-2 rounded-md w-full text-sm bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-input/50 ${
                        TAG_BADGES[task?.tag]?.color
                      }`}
                    >
                      {TAG_BADGES[task?.tag]?.label}
                    </div>
                  )}

                  <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-4">
                    Priority
                  </h4>
                  {canEditPriority ? (
                    <Select
                      value={task?.priority}
                      onValueChange={(value) => {
                        handleUpdateTask({ priority: value });
                      }}
                      onOpenChange={setIsPrioritySelectOpen}
                    >
                      <SelectTrigger className="w-full bg-white hover:bg-gray-50 dark:bg-slate-900/70 dark:hover:bg-slate-900/50">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900">
                        {Object.entries(PRIORITY_BADGES).map(
                          ([value, { label, color }]) => (
                            <SelectItem
                              key={value}
                              value={value}
                              className="hover:bg-gray-100 dark:hover:bg-slate-600/50"
                            >
                              <span
                                className={`px-2 py-1 rounded text-sm ${color}`}
                              >
                                {label}
                              </span>
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div
                      className={`px-2 py-2 rounded-md w-full text-sm bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-input/50 ${
                        PRIORITY_BADGES[task?.priority]?.color
                      }`}
                    >
                      {PRIORITY_BADGES[task?.priority]?.label}
                    </div>
                  )}
                </div>

                {canEditAttachments && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400">
                      Add to card
                    </h4>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-black/5 dark:text-slate-300 dark:hover:text-gray-200 dark:hover:bg-slate-700/50"
                      onClick={() => setAttachmentModalOpen(true)}
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      Attachment
                    </Button>
                  </div>
                )}

                {(canEditTask || canEditAssignee || canDeleteTask) && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400">
                      Actions
                    </h4>
                    {canEditAssignee && (
                      <ActionComboBoxButton
                        buttonLabel="Change Assignee"
                        buttonIcon={Users}
                        shouldShowUserAvatar={true}
                        multiSelect={true}
                        selectedOptions={
                          task?.assignee_to?.map((assignee) => ({
                            label: assignee.username,
                            value: assignee._id,
                            image: assignee.avatar,
                            email: assignee.email,
                          })) || []
                        }
                        options={usersList}
                        onSelect={(selectedOptions) => {
                          const selectedUserIds = selectedOptions.map(
                            (option) => option.value
                          );
                          handleUpdateTaskAssignee(selectedUserIds);
                        }}
                      />
                    )}
                    {canDeleteTask && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-200/30 dark:text-red-400 dark:hover:bg-red-500/10"
                        onClick={() => {
                          setDeleteDialog(true);
                        }}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Close Task
                      </Button>
                    )}
                  </div>
                )}
                <div className="pt-4 border-t border-gray-200 dark:border-slate-700 !mb-2">
                  <div className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Created {new Date(task?.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <AlertDialog
        open={deleteDialog}
        onOpenChange={(open) => setDeleteDialog(open ? true : false)}
      >
        <AlertDialogContent className="bg-slate-900 dark:border-2 dark:border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle>Finish Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark &quot;
              {task?.title}&quot; as finished? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-transparent dark:hover:bg-slate-800/50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseTask}
              className="bg-red-500 hover:bg-red-600"
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Finish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RoutableModal>
  );
};

export default TaskModal;
