import { useState, useCallback, useEffect, useRef } from "react";
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
  Loader2,
  Upload,
  Paperclip,
  CheckSquare,
  Bug,
  BookOpen,
  Zap,
  FileText,
  Settings2,
  ChevronRight,
  ChevronLeft,
  Check,
  LayoutGrid,
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
};

// Priority configuration
const PRIORITY_OPTIONS = [
  { value: "lowest", label: "Lowest", color: "text-zinc-500" },
  { value: "low", label: "Low", color: "text-emerald-500" },
  { value: "medium", label: "Medium", color: "text-amber-500" },
  { value: "high", label: "High", color: "text-orange-500" },
  { value: "highest", label: "Highest", color: "text-red-500" },
];

// Step configuration
const STEPS = [
  { id: 1, title: "Details", icon: FileText },
  { id: 2, title: "Settings", icon: Settings2 },
];

// File upload configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;
const ACCEPTED_TYPES = {
  "image/*": [".png", ".jpg", ".jpeg", ".gif"],
  "video/*": [".mp4", ".webm"],
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "text/plain": [".txt"],
};

// Step Indicator Component
const StepIndicator = ({ currentStep, steps }) => {
  return (
    <div className="flex items-center justify-center w-full px-8 py-2">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;
        const isUpcoming = currentStep < step.id;

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "step-indicator-circle",
                  isActive && "active",
                  isCompleted && "completed",
                  isUpcoming && "upcoming"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={cn(
                  "step-label",
                  isActive && "active",
                  isCompleted && "completed",
                  isUpcoming && "upcoming"
                )}
              >
                {step.title}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={cn(
                  "step-connector",
                  isCompleted ? "completed" : "upcoming"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Enhanced File Upload Component
const EnhancedFileUpload = ({ files, onFilesChange, maxFiles = 5 }) => {
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (files.length + acceptedFiles.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
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
      onFilesChange([...files, ...newFiles]);
    },
    [files, maxFiles, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  const removeFile = (item) => {
    onFilesChange(files.filter((f) => f.id !== item.id));
  };

  return (
    <div className="space-y-4">
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
          Images, Videos, Documents • Max 5MB • Up to {maxFiles} files
        </p>
      </div>

      {/* File Grid */}
      {files.length > 0 && (
        <div className="space-y-2">
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
  );
};

export default function TaskForm({
  projectId,
  columns = [],
  onSuccess,
  onCancel,
  open,
  onOpenChange,
  members = [],
}) {
  const [files, setFiles] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [slideDirection, setSlideDirection] = useState("right");

  // Separate form data storage for step 1
  const [step1Data, setStep1Data] = useState({ title: "", description: "" });

  // Track select open states to prevent dialog close
  const [isTypeSelectOpen, setIsTypeSelectOpen] = useState(false);
  const [isPrioritySelectOpen, setIsPrioritySelectOpen] = useState(false);
  const [isStatusSelectOpen, setIsStatusSelectOpen] = useState(false);
  const [isAssigneeSelectOpen, setIsAssigneeSelectOpen] = useState(false);

  // API hooks
  const [createTask, { isLoading }] = useCreateTaskMutation();
  const { data: membersData } = useGetProjectMembersQuery(projectId, {
    skip: !projectId || members.length > 0,
  });

  // Use passed members or fetched members
  const projectMembers = members.length > 0 ? members : membersData?.data || [];

  // Get default status from first column
  const defaultStatus = columns[0]?.key || "todo";

  // Step 1 Form
  const step1Form = useForm({
    defaultValues: { title: "", description: "" },
  });

  // Step 2 Form
  const step2Form = useForm({
    resolver: zodResolver(
      z.object({
        type: z.enum(["task", "bug", "story", "epic"]).default("task"),
        priority: z
          .enum(["lowest", "low", "medium", "high", "highest"])
          .default("medium"),
        status: z.string().min(1, { message: "Column is required" }),
        assignee: z.string().optional().nullable(),
      })
    ),
    defaultValues: {
      type: "task",
      priority: "medium",
      status: defaultStatus,
      assignee: null,
    },
  });

  // Use a ref to track the latest columns value for form reset
  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  // Update status when columns become available (only if status is empty or default)
  useEffect(() => {
    if (columns.length > 0) {
      const currentStatus = step2Form.getValues("status");
      // Only update if current status is "todo" (the hardcoded default) or empty
      if (!currentStatus || currentStatus === "todo") {
        step2Form.setValue("status", columns[0].key);
      }
    }
  }, [columns, step2Form]);

  // Reset form when modal opens (only on open change, not on columns change)
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setStep1Data({ title: "", description: "" });
      step1Form.reset({ title: "", description: "" });
      // Use the ref to get latest columns value
      const currentColumns = columnsRef.current;
      step2Form.reset({
        type: "task",
        priority: "medium",
        status: currentColumns[0]?.key || "todo",
        assignee: null,
      });
      setFiles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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

  const isAnySelectOpen =
    isTypeSelectOpen ||
    isPrioritySelectOpen ||
    isStatusSelectOpen ||
    isAssigneeSelectOpen;

  const handleClose = () => {
    if (!isAnySelectOpen) {
      setCurrentStep(1);
      step1Form.reset();
      step2Form.reset();
      setFiles([]);
      setStep1Data({ title: "", description: "" });
      if (onCancel) {
        onCancel();
      }
      if (onOpenChange) {
        onOpenChange(false);
      }
    }
  };

  const handleNextStep = useCallback(async () => {
    const isValid = await step1Form.trigger();

    if (isValid) {
      const values = step1Form.getValues();
      if (!values.title?.trim()) {
        step1Form.setError("title", { message: "Title is required" });
        return;
      }
      setStep1Data(values);
      setSlideDirection("right");
      setCurrentStep(2);
    }
  }, [step1Form]);

  const handlePrevStep = useCallback(() => {
    setSlideDirection("left");
    setCurrentStep(1);
  }, []);

  const getAnimationClass = () => {
    return slideDirection === "right"
      ? "step-slide-in-right"
      : "step-slide-in-left";
  };

  const onSubmit = async () => {
    // Validate step 2
    const isStep2Valid = await step2Form.trigger();
    if (!isStep2Valid) return;

    try {
      const formData = new FormData();
      const step2Values = step2Form.getValues();

      // Add form fields
      formData.append("project_id", projectId);
      formData.append("title", step1Data.title);
      formData.append("status", step2Values.status);
      formData.append("type", step2Values.type);
      formData.append("priority", step2Values.priority);

      if (step1Data.description) {
        formData.append("description", step1Data.description);
      }

      if (step2Values.assignee) {
        formData.append("assignee", step2Values.assignee);
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
      setCurrentStep(1);
      step1Form.reset();
      step2Form.reset();
      setFiles([]);
      setStep1Data({ title: "", description: "" });

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
        className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-card form-glass-card border border-border/50 shadow-2xl"
        onPointerDownOutside={(e) => {
          if (isAnySelectOpen) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if (isAnySelectOpen) {
            e.preventDefault();
          }
        }}
      >
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="p-4 pb-0 flex items-center justify-between">
            <span className="text-xl font-semibold text-card-foreground">
              New Task
            </span>
          </DialogTitle>
          <DialogDescription className="hidden">
            Create a new task for the project
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} steps={STEPS} />

        <Separator className="w-[95%] mx-auto bg-border/50" />

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 multi-step-form-container min-h-[380px]">
            {/* Step 1: Task Details */}
            {currentStep === 1 && (
              <div
                key="step-1"
                className={cn("space-y-5", getAnimationClass())}
              >
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Title
                  </label>
                  <Input
                    {...step1Form.register("title", {
                      required: "Title is required",
                    })}
                    className="bg-background/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all h-11"
                    placeholder="Enter task title"
                    autoFocus
                  />
                  {step1Form.formState.errors.title && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-destructive"></span>
                      {step1Form.formState.errors.title.message}
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
                  <div className="grievance-text-editor">
                    <Controller
                      name="description"
                      control={step1Form.control}
                      render={({ field }) => (
                        <TextEditor
                          initialContent={field.value}
                          onChange={field.onChange}
                          onSave={() => {}}
                          onCancel={() => {}}
                          className="!bg-background/50"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Settings */}
            {currentStep === 2 && (
              <div
                key="step-2"
                className={cn("space-y-5", getAnimationClass())}
              >
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
                      control={step2Form.control}
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
                      control={step2Form.control}
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
                                <span
                                  className={cn(
                                    "flex items-center gap-2",
                                    option.color
                                  )}
                                >
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

                {/* Column and Assignee Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Column/Status */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      Column
                    </label>
                    <Controller
                      name="status"
                      control={step2Form.control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          open={isStatusSelectOpen}
                          onOpenChange={setIsStatusSelectOpen}
                        >
                          <SelectTrigger className="w-full bg-background/50 hover:bg-muted border-border h-11 focus:ring-2 focus:ring-primary/20">
                            <SelectValue placeholder="Select column">
                              {field.value && (
                                <div className="flex items-center gap-2">
                                  <LayoutGrid className="h-4 w-4 text-primary" />
                                  <span>
                                    {columns.find((c) => c.key === field.value)
                                      ?.label || field.value}
                                  </span>
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {columns.map((column) => (
                              <SelectItem key={column.key} value={column.key}>
                                <div className="flex items-center gap-2">
                                  <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                                  <span>{column.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {step2Form.formState.errors.status && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-destructive"></span>
                        {step2Form.formState.errors.status.message}
                      </p>
                    )}
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
                      control={step2Form.control}
                      render={({ field }) => (
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value === "unassigned" ? null : value)
                          }
                          value={field.value || "unassigned"}
                          open={isAssigneeSelectOpen}
                          onOpenChange={setIsAssigneeSelectOpen}
                        >
                          <SelectTrigger className="w-full bg-background/50 hover:bg-muted border-border h-11 focus:ring-2 focus:ring-primary/20">
                            <SelectValue placeholder="Select assignee">
                              {field.value ? (
                                (() => {
                                  const member = projectMembers.find(
                                    (m) => m._id === field.value
                                  );
                                  return member ? (
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-5 w-5">
                                        <AvatarImage src={member.avatar} />
                                        <AvatarFallback className="text-xs">
                                          {getInitials(member)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="truncate">
                                        {getDisplayName(member)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      Unassigned
                                    </span>
                                  );
                                })()
                              ) : (
                                <span className="text-muted-foreground">
                                  Unassigned
                                </span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="unassigned">
                              <span className="text-muted-foreground">
                                Unassigned
                              </span>
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
                </div>

                {/* Attachments */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                    Attachments
                    <span className="text-[10px] font-normal normal-case text-muted-foreground/70">
                      (Optional)
                    </span>
                  </label>
                  <EnhancedFileUpload
                    files={files}
                    onFilesChange={setFiles}
                    maxFiles={MAX_FILES}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer with Navigation */}
          <div className="p-4 border-t border-border/50 bg-muted/30">
            <div className="flex justify-between items-center">
              {/* Back Button */}
              <div>
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handlePrevStep}
                    className="text-muted-foreground hover:text-foreground gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                )}
              </div>

              {/* Next/Submit Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="border-border/50 hover:bg-muted transition-colors"
                >
                  Cancel
                </Button>

                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all gap-2 px-6"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={onSubmit}
                    disabled={isLoading}
                    className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all gap-2 px-6"
                  >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create Task
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
