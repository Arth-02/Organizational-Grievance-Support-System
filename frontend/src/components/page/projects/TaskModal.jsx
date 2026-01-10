/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Loader2,
  AlertTriangle,
  Clock,
  Paperclip,
  CheckSquare,
  Bug,
  BookOpen,
  Zap,
  User,
  Calendar,
  Trash2,
  Upload,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  FileArchive,
} from "lucide-react";
import cn from "classnames";
import { Separator } from "@/components/ui/separator";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import toast from "react-hot-toast";
import {
  useGetTaskByIdQuery,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useAddAttachmentMutation,
  useRemoveAttachmentMutation,
} from "@/services/task.service";
import { useGetProjectMembersQuery } from "@/services/project.service";
import { useGetBoardsByProjectQuery } from "@/services/board.service";
import EditableTitle from "../../ui/EditableTitle";
import EditableDescription from "../../ui/EditableDescription";
import TaskComments from "./TaskComments";
import TaskActivity from "./TaskActivity";
import { DatePicker } from "../../ui/DatePicker";
import TaskModalSkeleton from "./TaskModalSkeleton";
import useSocket from "@/utils/useSocket";

// Task type configuration
const TASK_TYPE_CONFIG = {
  task: { icon: CheckSquare, color: "text-blue-500", label: "Task" },
  bug: { icon: Bug, color: "text-red-500", label: "Bug" },
  story: { icon: BookOpen, color: "text-green-500", label: "Story" },
  epic: { icon: Zap, color: "text-purple-500", label: "Epic" },
};

// Priority configuration
const PRIORITY_CONFIG = {
  lowest: {
    badge:
      "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400",
    label: "Lowest",
  },
  low: {
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    label: "Low",
  },
  medium: {
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    label: "Medium",
  },
  high: {
    badge:
      "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
    label: "High",
  },
  highest: {
    badge: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
    label: "Highest",
  },
};

// Helper to get file icon and color based on file type
const getFileTypeConfig = (filetype) => {
  if (!filetype) return { icon: File, color: "text-gray-500", bgColor: "bg-gray-100 dark:bg-gray-500/20" };
  
  const type = filetype.toLowerCase();
  
  // Images
  if (type.startsWith("image/")) {
    return { icon: FileImage, color: "text-purple-500", bgColor: "bg-purple-100 dark:bg-purple-500/20" };
  }
  
  // PDFs
  if (type === "application/pdf") {
    return { icon: FileText, color: "text-red-500", bgColor: "bg-red-100 dark:bg-red-500/20" };
  }
  
  // Word documents
  if (type.includes("word") || type.includes("document") || type === "application/msword" || 
      type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return { icon: FileText, color: "text-blue-500", bgColor: "bg-blue-100 dark:bg-blue-500/20" };
  }
  
  // Excel/Spreadsheets
  if (type.includes("excel") || type.includes("spreadsheet") || type === "application/vnd.ms-excel" ||
      type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
    return { icon: FileSpreadsheet, color: "text-green-500", bgColor: "bg-green-100 dark:bg-green-500/20" };
  }
  
  // Archives
  if (type.includes("zip") || type.includes("rar") || type.includes("tar") || type.includes("compressed") ||
      type === "application/x-rar-compressed" || type === "application/x-7z-compressed") {
    return { icon: FileArchive, color: "text-amber-500", bgColor: "bg-amber-100 dark:bg-amber-500/20" };
  }
  
  // Text files
  if (type.startsWith("text/") || type === "application/json" || type === "application/xml") {
    return { icon: FileText, color: "text-slate-500", bgColor: "bg-slate-100 dark:bg-slate-500/20" };
  }
  
  // Default
  return { icon: File, color: "text-gray-500", bgColor: "bg-gray-100 dark:bg-gray-500/20" };
};

// Helper to format file size
const formatFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function TaskModal({ taskId: propTaskId, projectId, onClose }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Use prop if provided, otherwise get from search params
  const taskId = propTaskId || searchParams.get("taskId");

  const [task, setTask] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("comments"); // "comments" or "activity"

  // Track select open states to prevent modal close
  const [isStatusSelectOpen, setIsStatusSelectOpen] = useState(false);
  const [isPrioritySelectOpen, setIsPrioritySelectOpen] = useState(false);
  const [isTypeSelectOpen, setIsTypeSelectOpen] = useState(false);
  const [isAssigneeSelectOpen, setIsAssigneeSelectOpen] = useState(false);

  // API hooks
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [addAttachment, { isLoading: isUploading }] = useAddAttachmentMutation();
  const [removeAttachment] = useRemoveAttachmentMutation();

  const { data: taskData, isLoading } = useGetTaskByIdQuery(taskId, {
    skip: !taskId,
  });

  const { data: membersData } = useGetProjectMembersQuery(projectId, {
    skip: !projectId,
  });

  const { data: boardData } = useGetBoardsByProjectQuery(projectId, {
    skip: !projectId,
  });

  const socket = useSocket();

  useEffect(() => {
    if (taskData?.data) {
      setTask(taskData.data);
    }
  }, [taskData]);

  const user = useSelector((state) => state.user.user);

  // Permission checks
  const canEditTask =
    user._id === task?.assignee?._id || user._id === task?.reporter?._id;
  const canDeleteTask = user._id === task?.reporter?._id;

  // Get project members for assignee selector
  const projectMembers = membersData?.data || [];

  // Get board columns for status selector
  const board = boardData?.data?.[0];
  const boardColumns = board?.columns || [];

  // Helper to get status label from board columns
  const getStatusLabel = (statusKey) => {
    const column = boardColumns.find(col => col.key === statusKey);
    return column?.label || statusKey;
  };

  // Helper to get status badge style
  const getStatusBadge = (statusKey) => {
    // Default badge styles based on common status keys
    const badgeStyles = {
      todo: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400",
      "in-progress": "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
      review: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
      done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    };
    return badgeStyles[statusKey] || "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400";
  };

  // Dispatch custom event for cross-component optimistic updates
  const dispatchTaskUpdate = (updatedData) => {
    window.dispatchEvent(
      new CustomEvent("task_optimistic_update", {
        detail: { taskId, updatedData },
      })
    );
  };

  // Optimistic update helper
  const optimisticUpdate = (localData, apiCall, successMsg, errorMsg) => {
    const previousTask = task ? { ...task } : null;
    const fullUpdatedData = { ...task, ...localData };

    // Optimistic update - apply changes immediately
    setTask((prev) => ({ ...prev, ...localData }));
    dispatchTaskUpdate(fullUpdatedData);

    // Call API in background
    apiCall()
      .then((response) => {
        toast.success(response?.data?.message || successMsg);
      })
      .catch((error) => {
        // Rollback on error
        console.error(errorMsg, error);
        if (previousTask) {
          setTask(previousTask);
          dispatchTaskUpdate(previousTask);
        }
        toast.error(error?.data?.message || errorMsg);
      });
  };

  const handleUpdateTask = (data) => {
    optimisticUpdate(
      data,
      () => updateTask({ id: taskId, data }).unwrap(),
      "Task updated",
      "Failed to update task"
    );
  };

  const handleUpdateAssignee = (assigneeId) => {
    const assigneeData = projectMembers.find((m) => m._id === assigneeId);
    const data = { assignee: assigneeData || { _id: assigneeId } };
    optimisticUpdate(
      data,
      () => updateTask({ id: taskId, data: { assignee: assigneeId } }).unwrap(),
      "Assignee updated",
      "Failed to update assignee"
    );
  };

  const handleDeleteTask = async () => {
    setDeleting(true);
    try {
      const response = await deleteTask(taskId).unwrap();

      // Dispatch event to notify board view
      window.dispatchEvent(
        new CustomEvent("task_deleted", {
          detail: { taskId, status: task?.status },
        })
      );

      toast.success(response?.message || "Task deleted");
      handleClose();
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error(error?.data?.message || "Failed to delete task");
    } finally {
      setDeleting(false);
    }
  };

  // Handle attachment upload
  const handleAttachmentUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate file count
    const currentCount = task.attachments?.length || 0;
    if (currentCount + files.length > 20) {
      toast.error("Maximum 20 attachments allowed per task");
      return;
    }

    // Validate file sizes (max 10MB each)
    const maxSize = 10 * 1024 * 1024; // 10MB
    for (const file of files) {
      if (file.size > maxSize) {
        toast.error(`File "${file.name}" exceeds 10MB limit`);
        return;
      }
    }

    const formData = new FormData();
    for (const file of files) {
      formData.append("attachments", file);
    }

    try {
      const response = await addAttachment({ taskId, formData }).unwrap();
      if (response?.data) {
        setTask(response.data);
      }
      toast.success("Attachment(s) uploaded successfully");
    } catch (error) {
      console.error("Failed to upload attachment:", error);
      toast.error(error?.data?.message || "Failed to upload attachment");
    }

    // Reset file input
    e.target.value = "";
  };

  // Handle attachment removal
  const handleRemoveAttachment = async (attachmentId) => {
    try {
      const response = await removeAttachment({ taskId, attachmentId }).unwrap();
      if (response?.data) {
        setTask(response.data);
      } else {
        // Optimistically remove from local state
        setTask((prev) => ({
          ...prev,
          attachments: prev.attachments.filter((a) => a._id !== attachmentId),
        }));
      }
      toast.success("Attachment removed");
    } catch (error) {
      console.error("Failed to remove attachment:", error);
      toast.error(error?.data?.message || "Failed to remove attachment");
    }
  };

  const handleClose = () => {
    // Only allow closing if no select is open
    if (
      !isStatusSelectOpen &&
      !isPrioritySelectOpen &&
      !isTypeSelectOpen &&
      !isAssigneeSelectOpen
    ) {
      if (onClose) {
        onClose();
      } else {
        setSearchParams((prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.delete("taskId");
          return newParams;
        });
      }
    }
  };

  // Socket event handlers
  const handleTaskUpdate = (data) => {
    if (taskId === data.taskId) {
      setTask((prevTask) => ({
        ...prevTask,
        ...data.updatedData,
      }));
    }
  };

  const handleTaskDelete = (data) => {
    if (taskId === data.taskId) {
      handleClose();
    }
  };

  useEffect(() => {
    socket.on("update_task", handleTaskUpdate);
    socket.on("delete_task", handleTaskDelete);
    return () => {
      socket.off("update_task");
      socket.off("delete_task");
    };
  }, [socket, taskId]);

  // Get display name for a user
  const getDisplayName = (user) => {
    if (!user) return "Unassigned";
    if (user.firstname && user.lastname) {
      return `${user.firstname} ${user.lastname}`;
    }
    return user.username || "Unknown User";
  };

  // Get initials for avatar fallback
  const getInitials = (user) => {
    if (!user) return "?";
    if (user.firstname && user.lastname) {
      return `${user.firstname[0]}${user.lastname[0]}`.toUpperCase();
    }
    return user.username?.slice(0, 2).toUpperCase() || "??";
  };

  // Get task type icon
  const TaskTypeIcon = ({ type }) => {
    const config = TASK_TYPE_CONFIG[type] || TASK_TYPE_CONFIG.task;
    const Icon = config.icon;
    return <Icon className={cn("h-4 w-4", config.color)} />;
  };

  if (!taskId) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-card rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          {isLoading && <TaskModalSkeleton />}
          {!isLoading && task && (
            <>
              {/* Header */}
              <div className="p-4 flex items-start justify-between border-b border-border">
                <div className="flex-1">
                  {/* Issue Key */}
                  <div className="flex items-center gap-2 mb-2">
                    <TaskTypeIcon type={task.type} />
                    <span className="text-sm font-medium text-muted-foreground">
                      {task.issue_key}
                    </span>
                  </div>

                  {/* Editable Title */}
                  <EditableTitle
                    title={task.title}
                    canEditTitle={canEditTask}
                    updateTitle={handleUpdateTask}
                  />

                  {/* Badges */}
                  <div className="flex items-center gap-2 mt-3">
                    {task.priority && PRIORITY_CONFIG[task.priority] && (
                      <Badge
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5 uppercase",
                          PRIORITY_CONFIG[task.priority].badge
                        )}
                      >
                        {PRIORITY_CONFIG[task.priority].label}
                      </Badge>
                    )}
                    {task.status && (
                      <Badge
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5 uppercase",
                          getStatusBadge(task.status)
                        )}
                      >
                        {getStatusLabel(task.status)}
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted"
                  onClick={handleClose}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <Separator className="w-[97%] mx-auto bg-border" />

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 flex gap-6">
                  {/* Left Column - Main Content */}
                  <div className="flex-1 space-y-6">
                    {/* Reporter and Assignee Info */}
                    <div className="flex flex-wrap gap-6">
                      {/* Reported By */}
                      <div>
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          Reporter
                        </h3>
                        <div className="flex items-center gap-2.5">
                          <Tooltip>
                            <TooltipTrigger>
                              <Avatar className="h-7 w-7 ring-2 ring-border shadow-sm">
                                <AvatarImage
                                  src={task.reporter?.avatar}
                                  alt={task.reporter?.username}
                                />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                  {getInitials(task.reporter)}
                                </AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                              {task.reporter?.username}
                            </TooltipContent>
                          </Tooltip>
                          <span className="text-sm font-medium text-card-foreground">
                            {getDisplayName(task.reporter)}
                          </span>
                        </div>
                      </div>

                      {/* Assigned To */}
                      <div>
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          Assignee
                        </h3>
                        <div className="flex items-center gap-2.5">
                          {task.assignee ? (
                            <>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Avatar className="h-7 w-7 ring-2 ring-border shadow-sm">
                                    <AvatarImage
                                      src={task.assignee?.avatar}
                                      alt={task.assignee?.username}
                                    />
                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                      {getInitials(task.assignee)}
                                    </AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {task.assignee?.username}
                                </TooltipContent>
                              </Tooltip>
                              <span className="text-sm font-medium text-card-foreground">
                                {getDisplayName(task.assignee)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Unassigned
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Due Date */}
                      {task.due_date && (
                        <div>
                          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                            Due Date
                          </h3>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-card-foreground">
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <EditableDescription
                      description={task.description}
                      canEdit={canEditTask}
                      onSave={(content) =>
                        handleUpdateTask({ description: content })
                      }
                    />

                    {/* Attachments */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Paperclip className="h-4 w-4" />
                          Attachments ({task.attachments?.length || 0})
                        </h3>
                        {canEditTask && (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              multiple
                              className="hidden"
                              onChange={handleAttachmentUpload}
                              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                              disabled={isUploading}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground"
                              disabled={isUploading}
                              asChild
                            >
                              <span>
                                {isUploading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Upload className="h-4 w-4" />
                                )}
                                <span className="ml-1">Upload</span>
                              </span>
                            </Button>
                          </label>
                        )}
                      </div>
                      {task.attachments?.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {task.attachments.map((attachment) => {
                            const fileType = attachment.filetype || attachment.type;
                            const fileName = attachment.filename || attachment.name || "File";
                            const isImage = fileType?.startsWith("image/");
                            const fileConfig = getFileTypeConfig(fileType);
                            const FileIcon = fileConfig.icon;
                            
                            return (
                              <div
                                key={attachment._id}
                                className="relative group rounded-lg overflow-hidden border border-border bg-card hover:border-primary/50 transition-colors"
                              >
                                {isImage ? (
                                  <div className="aspect-square">
                                    <img
                                      src={attachment.url}
                                      alt={fileName}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="aspect-square flex flex-col items-center justify-center p-3 bg-muted/50">
                                    <div className={cn("p-3 rounded-lg mb-2", fileConfig.bgColor)}>
                                      <FileIcon className={cn("h-8 w-8", fileConfig.color)} />
                                    </div>
                                    <span className="text-xs text-muted-foreground truncate w-full text-center font-medium">
                                      {fileName.length > 20 ? `${fileName.slice(0, 17)}...` : fileName}
                                    </span>
                                    {attachment.filesize && (
                                      <span className="text-[10px] text-muted-foreground/70 mt-0.5">
                                        {formatFileSize(attachment.filesize)}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                  <span className="text-white text-xs text-center truncate w-full px-1">
                                    {fileName}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-white text-xs bg-white/20 px-3 py-1.5 rounded-md hover:bg-white/30 transition-colors"
                                    >
                                      View
                                    </a>
                                    {canEditTask && (
                                      <button
                                        onClick={() => handleRemoveAttachment(attachment._id)}
                                        className="text-white text-xs bg-red-500/80 p-1.5 rounded-md hover:bg-red-500 transition-colors"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                          {canEditTask ? (
                            <label className="cursor-pointer block">
                              <input
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleAttachmentUpload}
                                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                                disabled={isUploading}
                              />
                              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                {isUploading ? (
                                  <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                  <Upload className="h-6 w-6" />
                                )}
                                <span className="text-sm">
                                  {isUploading ? "Uploading..." : "Drop files here or click to upload"}
                                </span>
                              </div>
                            </label>
                          ) : (
                            <p className="text-sm text-muted-foreground">No attachments</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Activity Section with Tabs */}
                    <div className="space-y-4">
                      {/* Tab Header */}
                      <div className="flex items-center gap-1 border-b border-border">
                        <button
                          onClick={() => setActiveTab("comments")}
                          className={cn(
                            "px-4 py-2 text-sm font-medium transition-colors relative",
                            activeTab === "comments"
                              ? "text-primary"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Comments
                          {activeTab === "comments" && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                          )}
                        </button>
                        <button
                          onClick={() => setActiveTab("activity")}
                          className={cn(
                            "px-4 py-2 text-sm font-medium transition-colors relative",
                            activeTab === "activity"
                              ? "text-primary"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Activity
                          {activeTab === "activity" && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                          )}
                        </button>
                      </div>

                      {/* Tab Content */}
                      {activeTab === "comments" ? (
                        <TaskComments
                          taskId={taskId}
                          comments={task.comments || []}
                          onCommentUpdate={(updatedTask) => {
                            if (updatedTask) {
                              setTask(updatedTask);
                            }
                          }}
                        />
                      ) : (
                        <TaskActivity activity={task.activity || []} />
                      )}
                    </div>
                  </div>

                  {/* Right Column - Actions */}
                  <div className="w-56 space-y-4 bg-muted/50 border border-border p-4 rounded-xl">
                    {/* Status */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Status
                      </h4>
                      {canEditTask ? (
                        <Select
                          value={task.status}
                          modal={false}
                          onValueChange={(value) => {
                            // Validate status exists in board columns
                            const validStatus = boardColumns.find(col => col.key === value);
                            if (!validStatus) {
                              toast.error("Invalid status");
                              return;
                            }
                            handleUpdateTask({ status: value });
                          }}
                          onOpenChange={setIsStatusSelectOpen}
                        >
                          <SelectTrigger className="w-full bg-background hover:bg-muted border-border">
                            <SelectValue placeholder="Select status">
                              <span className={`px-2 py-1 rounded text-sm ${getStatusBadge(task.status)}`}>
                                {getStatusLabel(task.status)}
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {boardColumns.map((column) => (
                              <SelectItem key={column.key} value={column.key}>
                                <span className={`px-2 py-1 rounded text-sm ${getStatusBadge(column.key)}`}>
                                  {column.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div
                          className={`px-2 py-2 rounded-md w-full text-sm bg-background border border-border ${getStatusBadge(task.status)}`}
                        >
                          {getStatusLabel(task.status)}
                        </div>
                      )}
                    </div>

                    {/* Priority */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Priority
                      </h4>
                      {canEditTask ? (
                        <Select
                          value={task.priority}
                          onValueChange={(value) =>
                            handleUpdateTask({ priority: value })
                          }
                          onOpenChange={setIsPrioritySelectOpen}
                        >
                          <SelectTrigger className="w-full bg-background hover:bg-muted border-border">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {Object.entries(PRIORITY_CONFIG).map(
                              ([value, { label, badge }]) => (
                                <SelectItem key={value} value={value}>
                                  <span
                                    className={`px-2 py-1 rounded text-sm ${badge}`}
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
                          className={`px-2 py-2 rounded-md w-full text-sm bg-background border border-border ${
                            PRIORITY_CONFIG[task.priority]?.badge
                          }`}
                        >
                          {PRIORITY_CONFIG[task.priority]?.label}
                        </div>
                      )}
                    </div>

                    {/* Type */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Type
                      </h4>
                      {canEditTask ? (
                        <Select
                          value={task.type}
                          onValueChange={(value) =>
                            handleUpdateTask({ type: value })
                          }
                          onOpenChange={setIsTypeSelectOpen}
                        >
                          <SelectTrigger className="w-full bg-background hover:bg-muted border-border">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {Object.entries(TASK_TYPE_CONFIG).map(
                              ([value, { label, icon: Icon, color }]) => (
                                <SelectItem key={value} value={value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className={cn("h-4 w-4", color)} />
                                    <span>{label}</span>
                                  </div>
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="px-2 py-2 rounded-md w-full text-sm bg-background border border-border flex items-center gap-2">
                          <TaskTypeIcon type={task.type} />
                          <span>{TASK_TYPE_CONFIG[task.type]?.label}</span>
                        </div>
                      )}
                    </div>

                    {/* Assignee */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Assignee
                      </h4>
                      {canEditTask ? (
                        <Select
                          value={task.assignee?._id || "unassigned"}
                          onValueChange={(value) => {
                            if (value === "unassigned") {
                              handleUpdateTask({ assignee: null });
                            } else {
                              handleUpdateAssignee(value);
                            }
                          }}
                          onOpenChange={setIsAssigneeSelectOpen}
                        >
                          <SelectTrigger className="w-full bg-background hover:bg-muted border-border">
                            <SelectValue placeholder="Select assignee">
                              {task.assignee ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={task.assignee.avatar} />
                                    <AvatarFallback className="text-xs">
                                      {getInitials(task.assignee)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="truncate">
                                    {getDisplayName(task.assignee)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">
                                  Unassigned
                                </span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="unassigned">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>Unassigned</span>
                              </div>
                            </SelectItem>
                            {projectMembers.map((member) => (
                              <SelectItem key={member._id} value={member._id}>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={member.avatar} />
                                    <AvatarFallback className="text-xs">
                                      {getInitials(member)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{getDisplayName(member)}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="px-2 py-2 rounded-md w-full text-sm bg-background border border-border flex items-center gap-2">
                          {task.assignee ? (
                            <>
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={task.assignee.avatar} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(task.assignee)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{getDisplayName(task.assignee)}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">
                              Unassigned
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Due Date */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Due Date
                      </h4>
                      {canEditTask ? (
                        <DatePicker
                          value={task.due_date ? new Date(task.due_date) : null}
                          onChange={(date) =>
                            handleUpdateTask({ due_date: date })
                          }
                          placeholder="Set due date"
                          buttonClassName="w-full bg-background hover:bg-muted border-border"
                        />
                      ) : (
                        <div className="px-2 py-2 rounded-md w-full text-sm bg-background border border-border flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {task.due_date
                              ? new Date(task.due_date).toLocaleDateString()
                              : "No due date"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Delete Action */}
                    {canDeleteTask && (
                      <div className="space-y-3 pt-3 border-t border-border">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Actions
                        </h4>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-200/30 dark:text-red-400 dark:hover:bg-red-500/10"
                          onClick={() => setDeleteDialog(true)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Task
                        </Button>
                      </div>
                    )}

                    {/* Created Date */}
                    <div className="pt-3 border-t border-border">
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Created {new Date(task.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent className="bg-card border border-border shadow-xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-lg font-semibold text-card-foreground">
                Delete Task
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete &quot;
              <span className="font-medium text-foreground">{task?.title}</span>
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="border-border hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default TaskModal;
