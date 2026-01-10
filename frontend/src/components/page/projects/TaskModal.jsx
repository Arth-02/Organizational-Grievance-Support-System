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
  GitBranch,
  User,
  Calendar,
  Trash2,
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
} from "@/services/task.service";
import { useGetProjectMembersQuery } from "@/services/project.service";
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
  subtask: { icon: GitBranch, color: "text-gray-500", label: "Subtask" },
};

// Priority configuration
const PRIORITY_CONFIG = {
  lowest: { badge: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400", label: "Lowest" },
  low: { badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400", label: "Low" },
  medium: { badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400", label: "Medium" },
  high: { badge: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400", label: "High" },
  highest: { badge: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400", label: "Highest" },
};

// Status configuration
const STATUS_CONFIG = {
  todo: { badge: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400", label: "To Do" },
  "in-progress": { badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400", label: "In Progress" },
  review: { badge: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400", label: "Review" },
  done: { badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400", label: "Done" },
};

function TaskModal({ taskId: propTaskId, projectId, onClose }) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Use prop if provided, otherwise get from search params
  const taskId = propTaskId || searchParams.get("taskId");
  
  const [task, setTask] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Track select open states to prevent modal close
  const [isStatusSelectOpen, setIsStatusSelectOpen] = useState(false);
  const [isPrioritySelectOpen, setIsPrioritySelectOpen] = useState(false);
  const [isTypeSelectOpen, setIsTypeSelectOpen] = useState(false);
  const [isAssigneeSelectOpen, setIsAssigneeSelectOpen] = useState(false);

  // API hooks
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();

  const { data: taskData, isLoading } = useGetTaskByIdQuery(taskId, {
    skip: !taskId,
  });

  const { data: membersData } = useGetProjectMembersQuery(projectId, {
    skip: !projectId,
  });

  const socket = useSocket();

  useEffect(() => {
    if (taskData?.data) {
      setTask(taskData.data);
    }
  }, [taskData]);

  const userPermissions = useSelector((state) => state.user.permissions);
  const user = useSelector((state) => state.user.user);

  // Permission checks
  const canEditTask = userPermissions.includes("UPDATE_TASK") || 
    user._id === task?.assigned_to?._id || 
    user._id === task?.reported_by?._id;
  const canDeleteTask = userPermissions.includes("DELETE_TASK") || 
    user._id === task?.reported_by?._id;

  // Get project members for assignee selector
  const projectMembers = membersData?.data?.members || [];


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
    const data = { assigned_to: assigneeData || { _id: assigneeId } };
    optimisticUpdate(
      data,
      () => updateTask({ id: taskId, data: { assigned_to: assigneeId } }).unwrap(),
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

  const handleClose = () => {
    // Only allow closing if no select is open
    if (!isStatusSelectOpen && !isPrioritySelectOpen && !isTypeSelectOpen && !isAssigneeSelectOpen) {
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
      <div 
        className="fixed inset-0 bg-black/60 z-50" 
        onClick={handleClose}
      />
      
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
                      <Badge className={cn("text-xs font-semibold px-2 py-0.5 uppercase", PRIORITY_CONFIG[task.priority].badge)}>
                        {PRIORITY_CONFIG[task.priority].label}
                      </Badge>
                    )}
                    {task.status && STATUS_CONFIG[task.status] && (
                      <Badge className={cn("text-xs font-semibold px-2 py-0.5 uppercase", STATUS_CONFIG[task.status].badge)}>
                        {STATUS_CONFIG[task.status].label}
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
                                  src={task.reported_by?.avatar}
                                  alt={task.reported_by?.username}
                                />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                  {getInitials(task.reported_by)}
                                </AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                              {task.reported_by?.username}
                            </TooltipContent>
                          </Tooltip>
                          <span className="text-sm font-medium text-card-foreground">
                            {getDisplayName(task.reported_by)}
                          </span>
                        </div>
                      </div>

                      {/* Assigned To */}
                      <div>
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          Assignee
                        </h3>
                        <div className="flex items-center gap-2.5">
                          {task.assigned_to ? (
                            <>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Avatar className="h-7 w-7 ring-2 ring-border shadow-sm">
                                    <AvatarImage
                                      src={task.assigned_to?.avatar}
                                      alt={task.assigned_to?.username}
                                    />
                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                      {getInitials(task.assigned_to)}
                                    </AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {task.assigned_to?.username}
                                </TooltipContent>
                              </Tooltip>
                              <span className="text-sm font-medium text-card-foreground">
                                {getDisplayName(task.assigned_to)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">Unassigned</span>
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
                      onSave={(content) => handleUpdateTask({ description: content })}
                    />

                    {/* Attachments */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Paperclip className="h-4 w-4" />
                          Attachments ({task.attachments?.length || 0})
                        </h3>
                      </div>
                      {task.attachments?.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                          {task.attachments.map((attachment) => (
                            <div
                              key={attachment._id}
                              className="relative group rounded-lg overflow-hidden border border-border"
                            >
                              {attachment.type?.startsWith("image/") ? (
                                <img
                                  src={attachment.url}
                                  alt={attachment.name}
                                  className="w-full h-20 object-cover"
                                />
                              ) : (
                                <div className="w-full h-20 flex items-center justify-center bg-muted">
                                  <Paperclip className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <a
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-white text-xs"
                                >
                                  View
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No attachments</p>
                      )}
                    </div>

                    {/* Comments Section */}
                    <TaskComments
                      taskId={taskId}
                      comments={task.comments || []}
                      onCommentUpdate={(updatedTask) => {
                        if (updatedTask) {
                          setTask(updatedTask);
                        }
                      }}
                    />

                    {/* Activity Section */}
                    <TaskActivity activity={task.activity || []} />
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
                          onValueChange={(value) => handleUpdateTask({ status: value })}
                          onOpenChange={setIsStatusSelectOpen}
                        >
                          <SelectTrigger className="w-full bg-background hover:bg-muted border-border">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {Object.entries(STATUS_CONFIG).map(([value, { label, badge }]) => (
                              <SelectItem key={value} value={value}>
                                <span className={`px-2 py-1 rounded text-sm ${badge}`}>
                                  {label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className={`px-2 py-2 rounded-md w-full text-sm bg-background border border-border ${STATUS_CONFIG[task.status]?.badge}`}>
                          {STATUS_CONFIG[task.status]?.label}
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
                          onValueChange={(value) => handleUpdateTask({ priority: value })}
                          onOpenChange={setIsPrioritySelectOpen}
                        >
                          <SelectTrigger className="w-full bg-background hover:bg-muted border-border">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {Object.entries(PRIORITY_CONFIG).map(([value, { label, badge }]) => (
                              <SelectItem key={value} value={value}>
                                <span className={`px-2 py-1 rounded text-sm ${badge}`}>
                                  {label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className={`px-2 py-2 rounded-md w-full text-sm bg-background border border-border ${PRIORITY_CONFIG[task.priority]?.badge}`}>
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
                          onValueChange={(value) => handleUpdateTask({ type: value })}
                          onOpenChange={setIsTypeSelectOpen}
                        >
                          <SelectTrigger className="w-full bg-background hover:bg-muted border-border">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {Object.entries(TASK_TYPE_CONFIG).map(([value, { label, icon: Icon, color }]) => (
                              <SelectItem key={value} value={value}>
                                <div className="flex items-center gap-2">
                                  <Icon className={cn("h-4 w-4", color)} />
                                  <span>{label}</span>
                                </div>
                              </SelectItem>
                            ))}
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
                          value={task.assigned_to?._id || "unassigned"}
                          onValueChange={(value) => {
                            if (value === "unassigned") {
                              handleUpdateTask({ assigned_to: null });
                            } else {
                              handleUpdateAssignee(value);
                            }
                          }}
                          onOpenChange={setIsAssigneeSelectOpen}
                        >
                          <SelectTrigger className="w-full bg-background hover:bg-muted border-border">
                            <SelectValue placeholder="Select assignee">
                              {task.assigned_to ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={task.assigned_to.avatar} />
                                    <AvatarFallback className="text-xs">
                                      {getInitials(task.assigned_to)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="truncate">{getDisplayName(task.assigned_to)}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Unassigned</span>
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
                          {task.assigned_to ? (
                            <>
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={task.assigned_to.avatar} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(task.assigned_to)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{getDisplayName(task.assigned_to)}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
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
                          onChange={(date) => handleUpdateTask({ due_date: date })}
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
                        Created {new Date(task.createdAt).toLocaleDateString()}
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
