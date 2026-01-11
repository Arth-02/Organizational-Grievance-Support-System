import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RoutableModal } from "@/components/ui/RoutedModal";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  X, 
  Loader2, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  FileText, 
  Settings2,
  Upload,
  Paperclip
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TextEditor from "../../ui/TextEditor";
import MediaPreviewGrid from "../../ui/MediaPreviewGrid";
import toast from "react-hot-toast";
import { useCreateGrievanceMutation } from "@/services/grievance.service";
import { useGetAllDepartmentNameQuery } from "@/services/department.service";
import { cn } from "@/lib/utils";
import { useDropzone } from "react-dropzone";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "text-green-500", bgColor: "bg-green-500/10", borderColor: "border-green-500/30" },
  { value: "medium", label: "Medium", color: "text-yellow-500", bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/30" },
  { value: "high", label: "High", color: "text-red-500", bgColor: "bg-red-500/10", borderColor: "border-red-500/30" },
];

const STEPS = [
  { id: 1, title: "Details", icon: FileText },
  { id: 2, title: "Settings", icon: Settings2 },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = {
  "image/*": [".png", ".jpg", ".jpeg", ".gif"],
  "video/*": [".mp4", ".webm"],
  "application/pdf": [".pdf"],
};

// Step Indicator Component
const StepIndicator = ({ currentStep, steps }) => {
  return (
    <div className="flex items-center justify-center w-full px-8 py-5">
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

// Enhanced File Upload Component using MediaPreviewGrid
const EnhancedFileUpload = ({ files, onFilesChange, maxFiles = 5 }) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (files.length + acceptedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newFiles = acceptedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
      preview: file.type.startsWith("image/") || file.type.startsWith("video/")
        ? URL.createObjectURL(file)
        : null,
      type: file.type,
    }));
    onFilesChange([...files, ...newFiles]);
  }, [files, maxFiles, onFilesChange]);

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
        <div className={cn(
          "w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 transition-colors",
          isDragActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
        )}>
          <Upload className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-foreground">
          {isDragActive ? "Drop files here" : "Drop files or click to upload"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Images, Videos, PDF • Max 5MB • Up to {maxFiles} files
        </p>
      </div>

      {/* File Grid using MediaPreviewGrid */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <Paperclip className="w-3.5 h-3.5" />
            <span>{files.length} file{files.length > 1 ? "s" : ""} attached</span>
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

export default function AddGrievanceModal() {
  const navigate = useNavigate();
  const [createGrievance, { isLoading }] = useCreateGrievanceMutation();
  const { data: departments } = useGetAllDepartmentNameQuery();

  const [currentStep, setCurrentStep] = useState(1);
  const [slideDirection, setSlideDirection] = useState("right");
  const [files, setFiles] = useState([]);
  
  // Separate form data storage for both steps
  const [step1Data, setStep1Data] = useState({ title: "", description: "" });
  
  // Select open states
  const [isDepartmentSelectOpen, setIsDepartmentSelectOpen] = useState(false);
  const [isPrioritySelectOpen, setIsPrioritySelectOpen] = useState(false);

  // Step 1 Form
  const step1Form = useForm({
    defaultValues: { title: "", description: "" },
  });

  // Step 2 Form
  const step2Form = useForm({
    defaultValues: { department_id: "", priority: "low" },
  });

  const handleClose = () => {
    if (!isDepartmentSelectOpen && !isPrioritySelectOpen) {
      navigate(-1);
    }
  };

  const handleNextStep = useCallback(async () => {
    const isValid = await step1Form.trigger();
    
    if (isValid) {
      // Save step 1 data
      setStep1Data(step1Form.getValues());
      setSlideDirection("right");
      setCurrentStep(2);
    }
  }, [step1Form]);

  const handlePrevStep = useCallback(() => {
    setSlideDirection("left");
    setCurrentStep(1);
  }, []);

  const onSubmit = async () => {
    // Validate step 2
    const isStep2Valid = await step2Form.trigger();
    if (!isStep2Valid) return;

    try {
      const formData = new FormData();
      
      // Add step 1 data
      formData.append("title", step1Data.title);
      formData.append("description", step1Data.description);
      
      // Add step 2 data
      const step2Values = step2Form.getValues();
      formData.append("department_id", step2Values.department_id);
      formData.append("priority", step2Values.priority);

      // Add files
      files.forEach(({ file }) => {
        formData.append("attachments", file);
      });

      const response = await createGrievance(formData).unwrap();
      
      // Dispatch event to notify board/table views about new grievance
      if (response.data) {
        window.dispatchEvent(
          new CustomEvent("grievance_created", {
            detail: { grievance: response.data },
          })
        );
      }
      
      toast.success(response.message);
      navigate("/grievances");
    } catch (error) {
      console.error("Failed to create grievance:", error);
      toast.error(error.data?.message || "Failed to create grievance");
    }
  };

  const getAnimationClass = () => {
    return slideDirection === "right" ? "step-slide-in-right" : "step-slide-in-left";
  };

  return (
    <RoutableModal
      width="max-w-2xl"
      shouldRemoveCloseIcon={true}
      onPointerDownOutside={(e) => {
        if (isDepartmentSelectOpen || isPrioritySelectOpen) {
          e.preventDefault();
        }
      }}
    >
      <div className="bg-card form-glass-card rounded-xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-border/50">
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="p-4 pb-2 flex items-center justify-between">
            <span className="text-xl font-semibold text-card-foreground">
              New Grievance
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogTitle>
          <DialogDescription className="hidden"></DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} steps={STEPS} />

        <Separator className="w-[95%] mx-auto bg-border/50" />

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 multi-step-form-container min-h-[380px]">
            {/* Step 1: Grievance Details */}
            {currentStep === 1 && (
              <div key="step-1" className={cn("space-y-5", getAnimationClass())}>
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Title
                  </label>
                  <Input
                    {...step1Form.register("title", { required: "Title is required" })}
                    className="bg-background/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all h-11"
                    placeholder="Brief summary of your grievance"
                  />
                  {step1Form.formState.errors.title && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-destructive"></span>
                      {step1Form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                {/* Description with TextEditor */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Description
                  </label>
                  <div className="grievance-text-editor">
                    <Controller
                      name="description"
                      control={step1Form.control}
                      rules={{ 
                        required: "Description is required",
                        validate: (value) => {
                          // Check if content is empty or just empty TipTap tags
                          const isEmpty = !value || value === "<p></p>" || value.replace(/<[^>]*>/g, "").trim() === "";
                          return !isEmpty || "Description is required";
                        }
                      }}
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
                  {step1Form.formState.errors.description && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-destructive"></span>
                      {step1Form.formState.errors.description.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Classification & Attachments */}
            {currentStep === 2 && (
              <div key="step-2" className={cn("space-y-5", getAnimationClass())}>
                <div className="grid grid-cols-2 gap-4">
                  {/* Department */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      Department
                    </label>
                    <Controller
                      name="department_id"
                      control={step2Form.control}
                      rules={{ required: "Department is required" }}
                      render={({ field }) => (
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          open={isDepartmentSelectOpen}
                          onOpenChange={setIsDepartmentSelectOpen}
                        >
                          <SelectTrigger className="w-full bg-background/50 hover:bg-muted border-border h-11 focus:ring-2 focus:ring-primary/20">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {departments?.data?.map((dept) => (
                              <SelectItem key={dept._id} value={dept._id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {step2Form.formState.errors.department_id && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-destructive"></span>
                        {step2Form.formState.errors.department_id.message}
                      </p>
                    )}
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
                      rules={{ required: "Priority is required" }}
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
                    {step2Form.formState.errors.priority && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-destructive"></span>
                        {step2Form.formState.errors.priority.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Attachments */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                    Attachments
                    <span className="text-[10px] font-normal normal-case text-muted-foreground/70">(Optional)</span>
                  </label>
                  <EnhancedFileUpload
                    files={files}
                    onFilesChange={setFiles}
                    maxFiles={5}
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
                    Create Grievance
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoutableModal>
  );
}