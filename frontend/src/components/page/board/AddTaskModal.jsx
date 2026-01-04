import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetAllUserNamesQuery } from "@/services/user.service";
import { useAddProjectBoardTaskMutation, useGetProjectBoardTagsQuery } from "@/services/project.service";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import ActionComboBoxButton from "@/components/ui/ActionComboBoxButton";
import { Users } from "lucide-react";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "bg-green-500/10 text-green-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500/10 text-yellow-500" },
  { value: "high", label: "High", color: "bg-red-500/10 text-red-500" },
];

const AddTaskModal = ({ open, onOpenChange, projectId, onTaskAdded }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tag: "",
    priority: "",
    due_date: "",
    assignee_to: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: users } = useGetAllUserNamesQuery();
  const { data: boardTags } = useGetProjectBoardTagsQuery(projectId);
  const [addTask] = useAddProjectBoardTaskMutation();

  const usersList = users?.data?.map((user) => ({
    label: user.username,
    value: user._id,
    image: user.avatar,
    email: user.email,
  })) || [];

  const tagsList = boardTags?.data || [];

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!formData.tag) {
      toast.error("Tag is required");
      return;
    }
    if (!formData.priority) {
      toast.error("Priority is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        tag: formData.tag,
        priority: formData.priority,
        assignee_to: formData.assignee_to.map((a) => a.value),
      };
      if (formData.due_date) {
        payload.due_date = new Date(formData.due_date).toISOString();
      }

      const response = await addTask({ id: projectId, data: payload }).unwrap();
      toast.success("Task created successfully");
      onTaskAdded?.(response.data);
      handleClose();
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error(error?.data?.message || "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      tag: "",
      priority: "",
      due_date: "",
      assignee_to: [],
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {open && <div className="bg-black/80 fixed inset-0 z-50 !mt-0" />}
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Create a new task for this project board.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Enter task description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Tag *</Label>
              <Select value={formData.tag} onValueChange={(value) => handleChange("tag", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tag" />
                </SelectTrigger>
                <SelectContent>
                  {tagsList.map((tag) => (
                    <SelectItem key={tag} value={tag} className="capitalize">
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Priority *</Label>
              <Select value={formData.priority} onValueChange={(value) => handleChange("priority", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className={`px-2 py-1 rounded text-sm ${option.color}`}>
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => handleChange("due_date", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Assignees</Label>
            <ActionComboBoxButton
              buttonLabel="Select Assignees"
              buttonIcon={Users}
              shouldShowUserAvatar={true}
              multiSelect={true}
              selectedOptions={formData.assignee_to}
              options={usersList.filter(
                (u) => !formData.assignee_to.some((a) => a.value === u.value)
              )}
              onSelect={(selectedOptions) => handleChange("assignee_to", selectedOptions)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskModal;
