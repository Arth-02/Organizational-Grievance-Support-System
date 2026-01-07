/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
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
  Users,
  Building2,
  AlertTriangle,
  Clock,
  Paperclip,
  X,
  Loader2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import cn from "classnames";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import GrievanceModalSkeleton from "./GreievanceCardModalSkeleton";
import AttachmentManager from "@/components/ui/MediaManager";
import toast from "react-hot-toast";
import { useSelector, useDispatch } from "react-redux";
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
  grievanceApi,
  useDeleteGrievanceByIdMutation,
  useGetGrievanceByIdQuery,
  useUpdateGrievanceAssigneeMutation,
  useUpdateGrievanceMutation,
  useUpdateGrievanceStatusMutation,
} from "@/services/grievance.service";
import EditableDescription from "../../ui/EditableDescription";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ActionComboBoxButton from "../../ui/ActionComboBoxButton";
import { useGetAllDepartmentNameQuery } from "@/services/department.service";
import { useGetAllUserNamesQuery } from "@/services/user.service";
import EditableTitle from "../../ui/EditableTitle";
import useSocket from "@/utils/useSocket";

const PRIORITY_BADGES = {
  low: { 
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400", 
    label: "Low" 
  },
  medium: { 
    color: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400", 
    label: "Medium" 
  },
  high: { 
    color: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400", 
    label: "High" 
  },
};

const STATUS_BADGES = {
  submitted: { 
    color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400", 
    label: "Submitted" 
  },
  "in-progress": {
    color: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    label: "In Progress",
  },
  resolved: { 
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400", 
    label: "Resolved" 
  },
  dismissed: { 
    color: "bg-gray-200 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400", 
    label: "Dismissed" 
  },
};

function GrievanceModal() {
  const dispatch = useDispatch();
  const { id: grievanceId } = useParams();
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [grievance, setGrievance] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Add states to track select open states
  const [isStatusSelectOpen, setIsStatusSelectOpen] = useState(false);
  const [isPrioritySelectOpen, setIsPrioritySelectOpen] = useState(false);

  const [updateGrievance] = useUpdateGrievanceMutation();
  const [updateGrievanceAssignee] = useUpdateGrievanceAssigneeMutation();
  const [updateGrievanceStatus] = useUpdateGrievanceStatusMutation();
  const [deleteGrievance] = useDeleteGrievanceByIdMutation();
  const { data: departments, isLoading: departmentLoading } =
    useGetAllDepartmentNameQuery();
  const { data: users, isLoading: usersLoading } = useGetAllUserNamesQuery();
  const navigate = useNavigate();

  const socket = useSocket();

  const {
    data: grievanceData,
    isLoading,
    refetch,
  } = useGetGrievanceByIdQuery(grievanceId, {
    skip: !grievanceId,
  });

  useEffect(() => {
    if (grievanceData) {
      setGrievance(grievanceData);
    }
  }, [grievanceData]);

  const userPermissions = useSelector((state) => state.user.permissions);
  const user = useSelector((state) => state.user.user);

  const canEditStatus =
    userPermissions.includes("UPDATE_GRIEVANCE") ||
    user._id === grievance?.data?.assigned_to?._id.toString();
  const canEditPriority =
    userPermissions.includes("UPDATE_GRIEVANCE") ||
    user._id === grievance?.data?.reported_by?._id;
  const canEditAssignee = userPermissions.includes("UPDATE_GRIEVANCE_ASSIGNEE");
  const canEditAttachments = user._id.toString() === grievance?.data?.reported_by?._id.toString();
  const canEditGrievance = userPermissions.includes("UPDATE_GRIEVANCE");
  const canEditTitleAndDescription =
    user._id === grievance?.data?.reported_by?._id;
  const canDeleteGrievance =
    userPermissions.includes("DELETE_GRIEVANCE") ||
    user._id === grievance?.data?.assigned_to?._id.toString();

  // Dispatch custom event for cross-component optimistic updates
  const dispatchGrievanceUpdate = (updatedData) => {
    window.dispatchEvent(
      new CustomEvent("grievance_optimistic_update", {
        detail: { grievanceId, updatedData },
      })
    );
  };

  // Optimistic update helper - updates UI immediately, calls API in background
  const optimisticUpdate = (localData, apiCall, successMsg, errorMsg) => {
    // Store previous state for rollback
    const previousGrievance = grievance ? { ...grievance, data: { ...grievance.data } } : null;
    const fullUpdatedData = { ...grievance?.data, ...localData };
    
    // Optimistic update - apply changes immediately to modal
    setGrievance((prev) => ({
      ...prev,
      data: { ...prev.data, ...localData },
    }));

    // Dispatch event for board/table view to update immediately
    dispatchGrievanceUpdate(fullUpdatedData);
    
    // Call API in background (don't await)
    apiCall()
      .then((response) => {
        toast.success(response.message || successMsg);
      })
      .catch((error) => {
        // Rollback on error
        console.error(errorMsg, error);
        if (previousGrievance) {
          setGrievance(previousGrievance);
          // Dispatch rollback event
          dispatchGrievanceUpdate(previousGrievance.data);
        }
        toast.error(error.data?.message || errorMsg);
      });
  };

  const handleUpdateGrievance = (data) => {
    optimisticUpdate(
      data,
      () => updateGrievance({ id: grievanceId, data }).unwrap(),
      "Grievance updated",
      "Failed to update grievance"
    );
  };

  const handleUpdateGrievanceAssignee = (assigneeId, assigneeData) => {
    const data = { assigned_to: assigneeData || { _id: assigneeId } };
    optimisticUpdate(
      data,
      () => updateGrievanceAssignee({ id: grievanceId, data: { assigned_to: assigneeId } }).unwrap(),
      "Assignee updated",
      "Failed to update assignee"
    );
  };

  const handleUpdateGrievanceStatus = (status) => {
    optimisticUpdate(
      { status },
      () => updateGrievanceStatus({ id: grievanceId, data: { status } }).unwrap(),
      "Status updated",
      "Failed to update status"
    );
  };

  const handleCloseGrievance = async () => {
    setDeleting(true);
    try {
      const response = await deleteGrievance(grievanceId).unwrap();

      // Dispatch event to notify board/table views
      window.dispatchEvent(
        new CustomEvent("grievance_deleted", {
          detail: { grievanceId, status: grievance?.data?.status },
        })
      );

      toast.success(response.message);

      // Navigate close - check for background location
      if (location.state?.background) {
        navigate(location.state.background.pathname + location.state.background.search);
      } else {
        navigate("/grievances");
      }
    } catch (error) {
      console.error("Failed to close grievance:", error);
      toast.error("Failed to close grievance");
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    // Only allow closing if no select is open
    if (!isStatusSelectOpen && !isPrioritySelectOpen) {
      if (location.state?.background) {
        navigate(location.state.background.pathname + location.state.background.search);
      } else {
        navigate("/grievances");
      }
    }
  };

  // exclude the current assignee and reported user from the list of users
  const usersList = users?.data
    ?.map((user) => {
      return {
        label: user.username,
        value: user._id,
        image: user.avatar,
      };
    })
    .filter((user) => {
      return (
        user.value !== grievance?.data?.assigned_to?._id &&
        user.value !== grievance?.data?.reported_by?._id
      );
    });

  // exclude the current department from the list of departments
  const departmentsList = departments?.data
    ?.map((department) => {
      return {
        label: department.name,
        value: department._id,
      };
    })
    .filter((department) => {
      return department.value !== grievance?.data?.department_id?._id;
    });

  const handleGrievanceUpdate = (data) => {
    if (grievanceId === data.grievanceId) {
      // update data but not the attachments
      setGrievance((prevGrievance) => {
        const updatedData = {
          ...prevGrievance,
          data: {
            ...prevGrievance.data,
            ...data.updatedData,
          },
        };
        return updatedData;
      });
    }
  };

  const handleDeleteGrievance = (data) => {
    if (grievanceId === data.grievanceId) {
      navigate(-1);
    }
  };

  useEffect(() => {
    socket.on("update_grievance", handleGrievanceUpdate);
    socket.on("update_grievance_assignee", handleGrievanceUpdate);
    socket.on("update_grievance_status", handleGrievanceUpdate);
    socket.on("delete_grievance", handleDeleteGrievance);
    return () => {
      socket.off("update_grievance");
      socket.off("update_grievance_assignee");
      socket.off("update_grievance_status");
      socket.off("delete_grievance");
    };
  }, [socket]);

  return (
    <RoutableModal
      backTo="/grievances"
      width="max-w-5xl"
      shouldRemoveCloseIcon={true}
      onPointerDownOutside={(e) => {
        // Prevent modal from closing if any select is open
        if (isStatusSelectOpen || isPrioritySelectOpen) {
          e.preventDefault();
        }
      }}
    >
      {isLoading && <GrievanceModalSkeleton />}
      {!isLoading && (
        <div className="bg-card rounded-xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl border border-border">
          <DialogHeader>
            <DialogTitle className="p-4 flex items-start justify-between">
              <div className="flex-1">
                <EditableTitle
                  title={grievance?.data.title}
                  canEditTitle={canEditTitleAndDescription}
                  updateTitle={handleUpdateGrievance}
                />
                <div className="flex items-center gap-2 mt-3">
                  {grievance?.data?.priority && (
                    <Badge
                      className={cn(
                        "text-xs font-semibold px-2 py-0.5 uppercase",
                        PRIORITY_BADGES[grievance.data.priority].color
                      )}
                    >
                      {PRIORITY_BADGES[grievance.data.priority].label}
                    </Badge>
                  )}
                  {grievance?.data?.status && (
                    <Badge
                      className={cn(
                        "text-xs font-semibold px-2 py-0.5 uppercase",
                        STATUS_BADGES[grievance.data.status].color
                      )}
                    >
                      {STATUS_BADGES[grievance.data.status].label}
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
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>

          <Separator className="w-[97%] mx-auto bg-border" />

          <div className="flex-1 overflow-y-auto">
            <div className="p-4 flex gap-6">
              {/* Left Column - Main Content */}
              <div className="flex-1 space-y-6">
                <div className="flex flex-wrap gap-6">
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Reported By
                    </h3>
                    <div className="flex items-center gap-2.5">
                      <Tooltip>
                        <TooltipTrigger>
                          <Avatar className="h-7 w-7 ring-2 ring-border shadow-sm">
                            <AvatarImage
                              src={grievance?.data?.reported_by?.avatar}
                              alt={grievance?.data?.reported_by?.username}
                            />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {grievance?.data?.reported_by?.username[0]}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          {grievance?.data?.reported_by?.username}
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-sm font-medium text-card-foreground">
                        {grievance?.data?.reported_by?.username || "User"}
                      </span>
                    </div>
                  </div>
                  {grievance?.data?.assigned_to && (
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Assigned To
                      </h3>
                      <div className="flex items-center gap-2.5">
                        <Tooltip>
                          <TooltipTrigger>
                            <Avatar className="h-7 w-7 ring-2 ring-border shadow-sm">
                              <AvatarImage
                                src={grievance?.data?.assigned_to?.avatar}
                                alt={grievance?.data?.assigned_to?.username}
                              />
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {grievance?.data?.assigned_to?.username[0]}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            {grievance?.data?.assigned_to?.username}
                          </TooltipContent>
                        </Tooltip>
                        <span className="text-sm font-medium text-card-foreground">
                          {grievance.data.assigned_to.username}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Department
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted dark:bg-slate-600/50">
                        <Building2 className="h-4 w-4 dark:text-slate-300" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {grievance?.data?.department_id?.name || "Department"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <EditableDescription
                  description={grievance?.data?.description}
                  canEdit={canEditTitleAndDescription}
                  onSave={(content) => {
                    handleUpdateGrievance({ description: content });
                  }}
                />

                {/* Attachments section remains the same */}
                <AttachmentManager
                  grievanceId={grievanceId}
                  existingAttachments={grievance?.data?.attachments || []}
                  uploadModal={attachmentModalOpen}
                  setUploadModal={setAttachmentModalOpen}
                  canEdit={canEditAttachments}
                  onUpdate={(updatedGrievance) => {
                    // Handle the updated grievance data
                  }}
                />
              </div>

              {/* Right Column - Actions */}
              <div className="w-56 space-y-4 bg-muted/50 border border-border p-4 rounded-xl">
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </h4>
                  {canEditStatus ? (
                    <Select
                      value={grievance?.data?.status}
                      modal={false}
                      onValueChange={(value) => {
                        handleUpdateGrievanceStatus(value);
                      }}
                      onOpenChange={setIsStatusSelectOpen}
                    >
                      <SelectTrigger className="w-full bg-background hover:bg-muted border-border">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {Object.entries(STATUS_BADGES).map(
                          ([value, { label, color }]) => (
                            <SelectItem
                              key={value}
                              value={value}
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
                      className={`px-2 py-2 rounded-md w-full text-sm bg-background border border-border ${
                        STATUS_BADGES[grievance?.data?.status]?.color
                      }`}
                    >
                      {STATUS_BADGES[grievance?.data?.status]?.label}
                    </div>
                  )}

                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">
                    Priority
                  </h4>
                  {canEditPriority ? (
                    <Select
                      value={grievance?.data?.priority}
                      onValueChange={(value) => {
                        handleUpdateGrievance({ priority: value });
                      }}
                      onOpenChange={setIsPrioritySelectOpen}
                    >
                      <SelectTrigger className="w-full bg-background hover:bg-muted border-border">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {Object.entries(PRIORITY_BADGES).map(
                          ([value, { label, color }]) => (
                            <SelectItem
                              key={value}
                              value={value}
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
                      className={`px-2 py-2 rounded-md w-full text-sm bg-background border border-border ${
                        PRIORITY_BADGES[grievance?.data?.priority]?.color
                      }`}
                    >
                      {PRIORITY_BADGES[grievance?.data?.priority]?.label}
                    </div>
                  )}
                </div>

                {canEditAttachments && (
                  <div className="space-y-3 pt-3 border-t border-border">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Add to card
                    </h4>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700/50 transition-colors"
                      onClick={() => setAttachmentModalOpen(true)}
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      Attachment
                    </Button>
                  </div>
                )}

                {(canEditGrievance ||
                  canEditAssignee ||
                  canDeleteGrievance) && (
                  <div className="space-y-3 pt-3 border-t border-border">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Actions
                    </h4>
                    {canEditAssignee && (
                      <ActionComboBoxButton
                        buttonLabel="Change Assignee"
                        buttonIcon={Users}
                        shouldShowUserAvatar={true}
                        options={usersList}
                        onSelect={(option) => {
                          handleUpdateGrievanceAssignee(option.value);
                        }}
                      />
                    )}
                    {canEditGrievance && (
                      <ActionComboBoxButton
                        buttonLabel="Change Department"
                        buttonIcon={Building2}
                        options={departmentsList}
                        onSelect={(selectedOption) => {
                          handleUpdateGrievance({
                            department_id: selectedOption.value,
                          });
                        }}
                      />
                    )}
                    {canDeleteGrievance && grievance?.data?.is_active && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-200/30 dark:text-red-400 dark:hover:bg-red-500/10"
                        onClick={() => {
                          setDeleteDialog(true);
                        }}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Close Grievance
                      </Button>
                    )}
                  </div>
                )}
                <div className="pt-3 border-t border-border">
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Created{" "}
                    {new Date(
                      grievance?.data?.date_reported
                    ).toLocaleDateString()}
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
        <AlertDialogContent className="bg-card border border-border dark:border-secondary shadow-xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-lg font-semibold text-card-foreground">
                Close Grievance
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to close &quot;
              <span className="font-medium text-foreground">{grievance?.data?.title}</span>
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="border-border hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseGrievance}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Close Grievance
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RoutableModal>
  );
}

export default GrievanceModal;
