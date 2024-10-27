/* eslint-disable no-unused-vars */
import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RoutableModal } from "@/components/ui/RoutedModal";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Menu,
  User,
  Users,
  Building2,
  AlertTriangle,
  Clock,
  Paperclip,
  X,
  Bold,
  Italic,
  MoreHorizontal,
  Link,
  Image,
  Plus,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetGrievanceByIdQuery } from "@/services/api.service";
import cn from "classnames";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const PRIORITY_BADGES = {
  low: { color: "bg-green-500/10 text-green-500", label: "Low" },
  medium: { color: "bg-yellow-500/10 text-yellow-500", label: "Medium" },
  high: { color: "bg-red-500/10 text-red-500", label: "High" },
};

const STATUS_BADGES = {
  submitted: { color: "bg-blue-500/10 text-blue-500", label: "Submitted" },
  "in-progress": { color: "bg-yellow-500/10 text-yellow-500", label: "In Progress" },
  resolved: { color: "bg-green-500/10 text-green-500", label: "Resolved" },
  dismissed: { color: "bg-slate-500/10 text-slate-500", label: "Dismissed" },
};

function GrievanceModal() {
  const { id: grievanceId } = useParams();
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  const navigate = useNavigate();

  const { data: grievanceData } = useGetGrievanceByIdQuery(grievanceId, {
    skip: !grievanceId,
  });

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setAttachments((prev) => [...prev, ...files]);
  };

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <RoutableModal backTo="/grievances" shouldRemoveCloseIcon={true}>
      <div className="bg-slate-800 rounded-lg w-[768px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="p-4 flex items-start justify-between border-slate-700">
            <div className="flex-1">
              <EditableTitle grievanceData={grievanceData} />
              <DialogDescription></DialogDescription>
                <div className="flex items-center gap-2 mt-3">
                  {grievanceData?.data?.priority && (
                    <Badge
                      className={cn(
                        "font-medium",
                        PRIORITY_BADGES[grievanceData.data.priority].color
                      )}
                    >
                      {PRIORITY_BADGES[grievanceData.data.priority].label}
                    </Badge>
                  )}
                  {grievanceData?.data?.status && (
                    <Badge
                      className={cn(
                        "font-medium",
                        STATUS_BADGES[grievanceData.data.status].color
                      )}
                    >
                      {STATUS_BADGES[grievanceData.data.status].label}
                    </Badge>
                  )}
                </div>
              {/* </DialogDescription> */}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Separator className="w-[97%] mx-auto dark:bg-white/10 h-[1px]" />

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 flex gap-6">
            {/* Left Column - Main Content */}
            <div className="flex-1 space-y-6">
              <div className="flex flex-wrap gap-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-2">
                    Reported By
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="text-slate-300">
                      {grievanceData?.data?.reported_by?.name || "User"}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-2">
                    Assigned To
                  </h3>
                  <div className="flex items-center gap-2">
                    {grievanceData?.data?.assigned_to ? (
                      <>
                        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="text-slate-300">
                          {grievanceData.data.assigned_to.name}
                        </span>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        className="text-slate-400 hover:text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Assign
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-2">
                    Department
                  </h3>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-300">
                      {grievanceData?.data?.department_id?.name || "Department"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Menu className="h-5 w-5" /> Description
                </h3>
                <div className="rounded-lg border border-slate-700 overflow-hidden">
                  <div className="bg-slate-900/50 p-2 border-b border-slate-700 flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Link className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Image className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  <textarea
                    className="w-full min-h-[100px] p-3 bg-transparent text-slate-300 resize-none focus:outline-none"
                    placeholder="Add a more detailed description..."
                    defaultValue={grievanceData?.data?.description}
                  />
                </div>
              </div>

              {/* Attachments */}
              {(grievanceData?.data?.attachments?.length > 0 ||
                attachments.length > 0) && (
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <Paperclip className="h-5 w-5" /> Attachments
                  </h3>
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded bg-slate-700/50"
                      >
                        <Paperclip className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-300 flex-1 truncate">
                          {file.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white"
                          onClick={() => {
                            /* Handle remove */
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Actions */}
            <div className="w-48 space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-400">Status</h4>
                <Select
                  value={grievanceData?.data?.status}
                  onValueChange={(value) => {
                    /* Handle status change */
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_BADGES).map(
                      ([value, { label, color }]) => (
                        <SelectItem key={value} value={value}>
                          <span
                            className={cn("px-2 py-1 rounded text-sm", color)}
                          >
                            {label}
                          </span>
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>

                <h4 className="text-sm font-medium text-slate-400 mt-4">
                  Priority
                </h4>
                <Select
                  value={grievanceData?.data?.priority}
                  onValueChange={(value) => {
                    /* Handle priority change */
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_BADGES).map(
                      ([value, { label, color }]) => (
                        <SelectItem key={value} value={value}>
                          <span
                            className={cn("px-2 py-1 rounded text-sm", color)}
                          >
                            {label}
                          </span>
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-400">
                  Add to card
                </h4>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attachment
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  onChange={handleFileUpload}
                />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-400">Actions</h4>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Change Assignee
                </Button>
                {grievanceData?.data?.is_active && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Close Grievance
                  </Button>
                )}
              </div>

              <div className="pt-4 border-t border-slate-700">
                <div className="text-sm text-slate-400 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Created{" "}
                  {new Date(
                    grievanceData?.data?.date_reported
                  ).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoutableModal>
  );
}

const EditableTitle = ({ grievanceData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  const handleTitleChange = async (newTitle) => {
    try {
      // Implement title update
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update title:", error);
    }
  };

  return (
    <div>
      {isEditing ? (
        <Input
          ref={inputRef}
          defaultValue={grievanceData?.data?.title}
          onBlur={(e) => handleTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleTitleChange(e.target.value);
            if (e.key === "Escape") setIsEditing(false);
          }}
          className="text-xl font-medium bg-transparent border-slate-700 text-white"
          autoFocus
        />
      ) : (
        <h2
          onClick={() => setIsEditing(true)}
          className="text-xl font-medium text-white cursor-pointer hover:underline"
        >
          {grievanceData?.data?.title || "Grievance Title"}
        </h2>
      )}
    </div>
  );
};

export default GrievanceModal;
