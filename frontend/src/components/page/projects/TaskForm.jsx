import { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  X,
  Loader2,
  Upload,
  Paperclip,
  CheckSquare,
  Bug,
  BookOpen,
  Zap,
  GitBranch,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import TextEditor from "../../ui/TextEditor";
import MediaPreviewGrid from "../../ui/MediaPreviewGrid";
import toast from "react-hot-toast";
import { useCreateTaskMutation } from "@/services/task.service";
import { useGetProjectMembersQuery } from "@/services/project.service";
import { cn } from "@/lib/utils";
import { useDropzone } from "react-dropzone";

// Task type configuration
const TASK_TYPE_CONFIG = {
  task: { icon: CheckSquare, color: "text-blue-500", label: "Task" },
  bug: { icon: Bug, color: "text-red-500", label: "Bug" },
  story: { icon: BookOpen, color: "text-green-500", label: "Story" },
  epic: { icon: Zap, color: "text-purple-500", label: "Epic" },
  subtask: { icon: GitBranch, color: "text-gray-500", label: "Subtask" },
};

// Priority configuration
const PRIORITY_OPTIONS = [
  { value: "lowest", label: "Lowest", color: "text-slate-500" },
  { value: "low", label: "Low", color: "text-emerald-500" },
  { value: "medium", label: "Medium", color: "text-amber-500" },
  { value: "high", label: "High", color: "text-orange-500" },
  { value: "highest", label: "Highest", color: "text-red-500" },
];

// File upload configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;
const ACCEPTED_TYPES = {
  "image/*": [".png", ".jpg", ".jpeg", ".gif"],
  "video/*": [".mp4", ".webm"],
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
};

// Validation schema for task creation
const taskFormSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Title is required" })
    .max(200, { message: "Title must not exceed 200 characters" }),
  description: z.string().optional(),
  type: z.enum(["task", "bug", "story", "epic", "subtask"]).default("task"),
  priority: z.enum(["lowest", "low", "medium", "high", "highest"]).default("medium"),
  assignee: z.string().optional().nullable(),
});

/**
 * TaskForm - Form component for creating new tasks
 * 
 * @param {Object} props
 * @param {string} props.projectId - The project ID to create the task in
 * @param {string} props.defaultStatus - Default status for the new task (e.g., "todo")
 * @param {Function} props.onSuccess - Callback when task is created successfully
 * @param {Function} props.onCancel - Callback when form is cancelled
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onOpenChange - Callback when dialog open state changes
 */
export default function TaskForm({
  projectId,
  defaultStatus = "todo",
  onSuccess,
  onCancel,
  open,
  onOpenChange,
}) {
  const [files, setFiles] = useState([]);
  
  // Track select open states to prevent dialog close
  const [isTypeSelectOpen, setIsTypeSelectOpen] = useState(false);
  const [isPrioritySelectOpen, setIsPrioritySelectOpen] = useState(false);
  const [isAssigneeSelectOpen, setIsAssigneeSelectOpen] = useState(false);

  // API hooks
  const [createTask, { isLoading }] = useCreateTaskMutation();
  const { data: membersData } = useGetProjectMembersQuery(projectId, {
    skip: !projectId,
  });

  const projectMembers = membersData?.data?.members || [];

  // Form setup
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "task",
      priority: "medium",
      assignee: null,
    },
  });

  // File upload handlers
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (files.length + acceptedFiles.length > MAX_FILES) {
        toast.error(`Maximum ${MAX_FILES} files allowed`);
        return;
      }

      const newFiles = acceptedFiles.map((file) => ({
        file,
        id: Math.random().toString(36).substring(7),
        preview:
          file.type.startsWith("image/") || file.type.startsWith("video/")
            ? URL.createObjectURL(file)
            : null,
        type: file.type,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files.length]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  const removeFile = (item) => {
    setFiles((prev) => prev.filter((f) => f.id !== item.id));
  };

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

  const handleClose = () => {
    // Only allow closing if no select is open
    if (!isTypeSelectOpen && !isPrioritySelectOpen && !isAssigneeSelectOpen) {
      reset();
      setFiles([]);
      if (onCancel) {
        onCancel();
      }
      if (onOpenChange) {
        onOpenChange(false);
      }
    }
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      
      // Add form fields
      formData.append("project_id", projectId);
      formData.append("title", data.title);
      formData.append("status", defaultStatus);
      formData.append("type", data.type);
      formData.append("priority", data.priority);
      
      if (data.description) {
        formData.append("description", data.description);
      }
      
      if (data.assignee) {
        formData.append("assigned_to", data.assignee);
      }

      // Add files
      files.forEach(({ file }) => {
        formData.append("attachments", file);
      });

      const response = await createTask(formData).unwrap();

      // Dispatch event to notify board view about new task
      if (response.data) {
        window.dispatchEvent(
          new CustomEvent("task_created", {
            detail: { task: response.data },
          })
        );
      }

      toast.success(response.message || "Task created successfully");
      
      // Reset form
      reset();
      setFiles([]);
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to create task:", error);
      toast.error(error.data?.message || "Failed to create task");
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          handleClose();
        } else if (onOpenChange) {
          onOpenChange(newOpen);
        }
      }}
    >
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0"
        onPointerDownOutside={(e) => {
          if (isTypeSelectOpen || isPrioritySelectOpen || isAssigneeSelectOpen) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if (isTypeSelectOpen || isPrioritySelectOpen || isAssigneeSelectOpen) {
            e.preventDefault();
          }
        }}
      >
        {/* Header */}
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <span className="text-xl font-semibold">New Task</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Create a new task for the project
          </DialogDescription>
        </DialogHeader>

        <Separator className="w-[95%] mx-auto" />

        {/* Form Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Title
              </label>
              <Input
                {...register("title")}
                className="bg-background/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all h-11"
                placeholder="Enter task title"
                autoFocus
              />
              {errors.title && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-destructive"></span>
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                Description
                <span className="text-[10px] font-normal normal-case text-muted-foreground/70">
                  (Optional)
                </span>
              </label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextEditor
                    initialContent={field.value}
                    onChange={field.onChange}
                    onSave={() => {}}
                    onCancel={() => {}}
                    className="!bg-background/50 min-h-[120px]"
                  />
                )}
              />
            </div>

            {/* Type and Priority Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Type */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Type
                </label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      open={isTypeSelectOpen}
                      onOpenChange={setIsTypeSelectOpen}
                    >
                      <SelectTrigger className="w-full bg-background/50 hover:bg-muted border-border h-11 focus:ring-2 focus:ring-primary/20">
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
                  )}
                />
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Priority
                </label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      open={isPrioritySelectOpen}
                      onOpenChange={setIsPrioritySelectOpen}
                    >
                      <SelectTrigger className="w-full bg-background/50 hover:bg-muted border-border h-11 focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {PRIORITY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <span className={cn("flex items-center gap-2", option.color)}>
                              <span className="w-2 h-2 rounded-full bg-current"></span>
                              {option.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Assignee */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                Assignee
                <span className="text-[10px] font-normal normal-case text-muted-foreground/70">
                  (Optional)
                </span>
              </label>
              <Controller
                name="assignee"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => field.onChange(value === "unassigned" ? null : value)}
                    value={field.value || "unassigned"}
                    open={isAssigneeSelectOpen}
                    onOpenChange={setIsAssigneeSelectOpen}
                  >
                    <SelectTrigger className="w-full bg-background/50 hover:bg-muted border-border h-11 focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Select assignee">
                        {field.value ? (
                          (() => {
                            const member = projectMembers.find((m) => m._id === field.value);
                            return member ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={member.avatar} />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(member)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate">{getDisplayName(member)}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Unassigned</span>
                            );
                          })()
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="unassigned">
                        <span className="text-muted-foreground">Unassigned</span>
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
                )}
              />
            </div>

            {/* File Attachments */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                Attachments
                <span className="text-[10px] font-normal normal-case text-muted-foreground/70">
                  (Optional)
                </span>
              </label>
              
              {/* Drop Zone */}
              <div
                {...getRootProps()}
                className={cn(
                  "relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200",
                  "hover:border-primary/50 hover:bg-primary/5",
                  isDragActive
                    ? "border-primary bg-primary/10 scale-[1.02]"
                    : "border-border/60 bg-background/50"
                )}
              >
                <input {...getInputProps()} />
                <div
                  className={cn(
                    "w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 transition-colors",
                    isDragActive
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {isDragActive ? "Drop files here" : "Drop files or click to upload"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Images, Videos, Documents • Max 5MB • Up to {MAX_FILES} files
                </p>
              </div>

              {/* File Preview Grid */}
              {files.length > 0 && (
                <div className="space-y-2 mt-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>
                      {files.length} file{files.length > 1 ? "s" : ""} attached
                    </span>
                  </div>
                  <MediaPreviewGrid
                    items={files}
                    onRemove={removeFile}
                    canDelete={true}
                    isLocal={true}
                    size="md"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 bg-muted/30">
            <div className="flex justify-end items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-border/50 hover:bg-muted transition-colors"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all gap-2 px-6"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Task
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
