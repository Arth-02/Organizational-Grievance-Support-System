import { useState } from "react";
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
import { X, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TextEditor from "../../ui/TextEditor";
import toast from "react-hot-toast";
import { useCreateGrievanceMutation } from "@/services/grievance.service";
import { useGetAllDepartmentNameQuery } from "@/services/department.service";
import FileUploadComponent from "../../ui/FileUpload";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export default function AddGrievanceModal() {
  const navigate = useNavigate();
  const [createGrievance, { isLoading }] = useCreateGrievanceMutation();
  const { data: departments } = useGetAllDepartmentNameQuery();

  const [files, setFiles] = useState([]);
  // Add states to track select open states
  const [isDepartmentSelectOpen, setIsDepartmentSelectOpen] = useState(false);
  const [isPrioritySelectOpen, setIsPrioritySelectOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      department_id: "",
      priority: "low",
    },
  });

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();

      Object.keys(data).forEach((key) => {
        formData.append(key, data[key]);
      });

      files.forEach(({ file }) => {
        formData.append("attachments", file);
      });

      const response = await createGrievance(formData).unwrap();
      toast.success(response.message);
      navigate("/grievances");
    } catch (error) {
      console.error("Failed to create grievance:", error);
      toast.error(error.data?.message || "Failed to create grievance");
    }
  };

  const handleClose = () => {
    // Only allow closing if no select is open
    if (!isDepartmentSelectOpen && !isPrioritySelectOpen) {
      navigate(-1);
    }
  };

  return (
    <RoutableModal
      backTo="/grievances"
      width="max-w-4xl"
      shouldRemoveCloseIcon={true}
      onPointerDownOutside={(e) => {
        // Prevent modal from closing if any select is open
        if (isDepartmentSelectOpen || isPrioritySelectOpen) {
          e.preventDefault();
        }
      }}
    >
      <div className="bg-card rounded-xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl border border-border">
        <DialogHeader>
          <DialogTitle className="p-4 flex items-center justify-between">
            <span className="text-xl font-semibold text-card-foreground">New Grievance</span>
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

        <Separator className="w-[97%] mx-auto bg-border" />

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto"
        >
          <div className="p-4 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Title *
              </label>
              <Input
                {...register("title", { required: "Title is required" })}
                className="bg-background border-border focus:ring-2 focus:ring-primary/20 transition-shadow"
                placeholder="Enter grievance title"
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Description *
              </label>
              <Controller
                name="description"
                control={control}
                rules={{ required: "Description is required" }}
                render={({ field }) => (
                  <TextEditor
                    initialContent={field.value}
                    onSave={field.onChange}
                  />
                )}
              />
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Department */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Department *
                </label>
                <Controller
                  name="department_id"
                  control={control}
                  rules={{ required: "Department is required" }}
                  render={({ field }) => (
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      open={isDepartmentSelectOpen}
                      onOpenChange={setIsDepartmentSelectOpen}
                    >
                      <SelectTrigger className="w-full bg-background hover:bg-muted border-border">
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
                {errors.department_id && (
                  <p className="text-sm text-red-500">
                    {errors.department_id.message}
                  </p>
                )}
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Priority *
                </label>
                <Controller
                  name="priority"
                  control={control}
                  rules={{ required: "Priority is required" }}
                  render={({ field }) => (
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      open={isPrioritySelectOpen}
                      onOpenChange={setIsPrioritySelectOpen}
                    >
                      <SelectTrigger className="w-full bg-background hover:bg-muted border-border">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {PRIORITY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.priority && (
                  <p className="text-sm text-red-500">
                    {errors.priority.message}
                  </p>
                )}
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Attachments (Optional)
                </label>
              </div>
              <FileUploadComponent
                files={files}
                onFilesChange={setFiles}
                showUploadButton={false}
                maxFiles={5}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-border hover:bg-muted transition-colors"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 shadow-sm hover:shadow-md transition-all"
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Grievance
              </Button>
            </div>
          </div>
        </form>
      </div>
    </RoutableModal>
  );
}