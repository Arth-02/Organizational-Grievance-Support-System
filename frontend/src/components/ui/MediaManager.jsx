import { useState } from "react";
import { Paperclip, Trash2, Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import toast from "react-hot-toast";
import { useUpdateAttachmentMutation } from "@/services/grievance.service";
import FileUploadComponent from "./FileUpload";
import MediaPreviewGrid from "./MediaPreviewGrid";
import UpgradePrompt from "./UpgradePrompt";

const AttachmentManager = ({
  uploadModal,
  setUploadModal,
  grievanceId,
  existingAttachments = [],
  onUpdate,
  canEdit,
}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    attachments: [],
  });
  const [deleting, setDeleting] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  
  // Upgrade prompt state for storage limit reached
  const [upgradePromptOpen, setUpgradePromptOpen] = useState(false);
  const [upgradePromptData, setUpgradePromptData] = useState({
    currentUsage: 0,
    limit: 0,
    currentPlan: "Starter",
  });

  const [updateGrievanceAttachment] = useUpdateAttachmentMutation();

  const handleUpload = async () => {
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    files.forEach(({ file }) => formData.append("attachments", file));

    try {
      let response;
      response = await updateGrievanceAttachment({
        id: grievanceId,
        data: formData,
      }).unwrap();
      onUpdate?.(response.data);
      setFiles([]);
      setUploadModal(false);
      toast.success("Attachments uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      // Check if this is a storage limit error (403)
      if (error?.status === 403 && error?.data?.code === "STORAGE_LIMIT_REACHED") {
        setUpgradePromptData({
          currentUsage: error.data.currentUsage || 0,
          limit: error.data.limit || 0,
          currentPlan: error.data.currentPlan || "Starter",
        });
        setUpgradePromptOpen(true);
      } else {
        toast.error(error?.data?.message || "Failed to upload attachments");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentsToDelete) => {
    if (!attachmentsToDelete || attachmentsToDelete.length === 0) return;

    setDeleting(true);
    try {
      const data = { delete_attachments: attachmentsToDelete };
      let response;
      response = await updateGrievanceAttachment({
        id: grievanceId,
        data,
      }).unwrap();
      onUpdate?.(response.data);
      toast.success("Attachments deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error?.data?.message || "Failed to delete attachments");
    } finally {
      setDeleting(false);
      setDeleteDialog({ open: false, attachments: [] });
      setSelectedAttachments([]);
    }
  };

  const handleRemoveAttachment = (item) => {
    setDeleteDialog({ open: true, attachments: [item._id] });
  };

  const toggleSelectAttachment = (item) => {
    setSelectedAttachments((prev) =>
      prev.includes(item._id)
        ? prev.filter((id) => id !== item._id)
        : [...prev, item._id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedAttachments.length > 0) {
      setDeleteDialog({ open: true, attachments: selectedAttachments });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 relative">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Attachments ({existingAttachments.length})
          </h3>

          <div className="flex items-center gap-2">
            {selectedAttachments.length > 0 && canEdit && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAttachments([])}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteSelected}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete ({selectedAttachments.length})
                </Button>
              </>
            )}
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUploadModal(true)}
                className="text-primary hover:text-primary hover:bg-primary/10"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            )}
          </div>
        </div>

        {/* Attachments Grid */}
        {existingAttachments.length > 0 ? (
          <div className="pt-2">
            <MediaPreviewGrid
              items={existingAttachments}
              onRemove={handleRemoveAttachment}
              canDelete={canEdit}
              isLocal={false}
              size="lg"
              onSelect={canEdit ? toggleSelectAttachment : undefined}
              selectedIds={selectedAttachments}
            />
          </div>
        ) : (
          <div className="text-muted-foreground text-sm py-4 text-center">
            No attachments found
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Dialog open={uploadModal} onOpenChange={setUploadModal}>
        <DialogContent className="bg-card border-border max-w-xl">
          <DialogTitle className="text-card-foreground">
            Upload Attachments
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add images, videos, or files (up to 5 files)
          </DialogDescription>
          <FileUploadComponent
            files={files}
            onFilesChange={setFiles}
            onUpload={handleUpload}
            uploading={uploading}
            uploadProgress={uploadProgress}
            existingFiles={existingAttachments}
            shouldShowExistingFiles={false}
            canEdit={canEdit}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, attachments: deleteDialog.attachments || [] })
        }
      >
        <AlertDialogContent className="bg-card border border-border shadow-xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle className="text-lg font-semibold text-card-foreground">
                Delete Attachments
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {deleteDialog.attachments?.length || 0}
              </span>{" "}
              attachment(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="border-border hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(deleteDialog.attachments)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Upgrade Prompt for Storage Limit Reached */}
      <UpgradePrompt
        open={upgradePromptOpen}
        onOpenChange={setUpgradePromptOpen}
        resourceType="storage"
        currentUsage={upgradePromptData.currentUsage}
        limit={upgradePromptData.limit}
        currentPlan={upgradePromptData.currentPlan}
        recommendedPlan="Professional"
      />
    </div>
  );
};

export default AttachmentManager;
