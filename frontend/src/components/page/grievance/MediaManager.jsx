import { useState } from "react";
import {
  File,
  Maximize2,
  Paperclip,
  Trash2,
  Loader2,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
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

const FILE_TYPES = {
  "application/pdf": {
    icon: <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />,
    color: "bg-red-500/10",
    label: "PDF",
  },
  "application/msword": {
    icon: <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
    color: "bg-blue-500/10",
    label: "Word",
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    icon: <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
    color: "bg-blue-500/10",
    label: "Word",
  },
  "application/vnd.ms-powerpoint": {
    icon: (
      <FileSpreadsheet className="w-6 h-6 text-orange-600 dark:text-orange-400" />
    ),
    color: "bg-orange-500/10",
    label: "PowerPoint",
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    icon: (
      <FileSpreadsheet className="w-6 h-6 text-orange-600 dark:text-orange-400" />
    ),
    color: "bg-orange-500/10",
    label: "PowerPoint",
  },
  "text/plain": {
    icon: <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />,
    color: "bg-green-500/10",
    label: "Text",
  },
  "text/markdown": {
    icon: <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
    color: "bg-purple-500/10",
    label: "Markdown",
  },
};

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
  const [previewModal, setPreviewModal] = useState({
    open: false,
    content: null,
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    attachment: null,
  });
  const [deleting, setDeleting] = useState(false);

  const [updateAttachment] = useUpdateAttachmentMutation();

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleUpload = async () => {
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    files.forEach(({ file }) => formData.append("attachments", file));

    try {
      const response = await updateAttachment({
        id: grievanceId,
        data: formData,
      }).unwrap();
      onUpdate(response.data);
      setFiles([]);
      setUploadModal(false);
      toast.success("Attachments uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.data.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.attachment) return;

    setDeleting(true);
    try {
      const data = { delete_attachments: [deleteDialog.attachment._id] };
      const response = await updateAttachment({
        id: grievanceId,
        data,
      }).unwrap();
      onUpdate(response.data);
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setDeleting(false);
      setDeleteDialog({ open: false, attachment: null });
    }
  };

  const handlePreview = (file) => {
    if (file.filetype?.startsWith("image/")) {
      setPreviewModal({
        open: true,
        content: (
          <img
            src={file.url}
            alt="Preview"
            className="max-h-[80vh] max-w-full"
          />
        ),
      });
    } else if (file.filetype?.startsWith("video/")) {
      setPreviewModal({
        open: true,
        content: (
          <video controls src={file.url} className="max-h-[80vh] max-w-full" />
        ),
      });
    }
  };

  const renderThumbnail = (attachment) => {
    if (attachment.filetype?.startsWith("image/")) {
      return (
        <img
          src={attachment.url}
          alt={attachment.filename}
          className="h-12 w-12 object-cover rounded"
        />
      );
    } else if (attachment.filetype?.startsWith("video/")) {
      return (
        <div className="h-12 w-12 bg-gray-100 dark:bg-slate-700 rounded flex items-center justify-center">
          <video className="h-12 w-12 object-cover rounded">
            <source src={attachment.url} type={attachment.filetype} />
          </video>
        </div>
      );
    } else {
      const fileType = FILE_TYPES[attachment.filetype];
      return (
        <div className="h-12 w-12 bg-gray-100 dark:bg-slate-700 rounded flex items-center justify-center">
          {fileType?.icon || (
            <File className="h-6 w-6 text-gray-500 dark:text-slate-400" />
          )}
        </div>
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
          <Paperclip className="h-5 w-5" /> Attachments (
          {existingAttachments.length})
        </h3>

        {existingAttachments.map((attachment) => (
          <div
            key={attachment._id}
            className="flex items-center gap-3 p-2 rounded bg-white dark:bg-slate-800 border border-gray-200 dark:border-transparent"
          >
            <div
              className="cursor-pointer"
              onClick={() => handlePreview(attachment)}
            >
              {renderThumbnail(attachment)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-700 dark:text-slate-300 truncate">
                {attachment.filename}
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-400">
                {formatFileSize(attachment.filesize)}
              </div>
            </div>
            <div className="flex items-center">
              {(attachment?.filetype?.startsWith("image/") ||
                attachment?.filetype?.startsWith("video/")) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePreview(attachment)}
                  className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/50"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteDialog({ open: true, attachment })}
                  className="text-red-500 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {
          existingAttachments.length === 0 && (
            <div className="text-gray-500 !mt-4 ml-6 dark:text-slate-400 text-sm">
              No attachments found
            </div>
          )
        }
      </div>

      <Dialog open={uploadModal} onOpenChange={setUploadModal}>
        <DialogContent className="bg-white dark:bg-gray-900 max-w-xl">
          <DialogTitle className="text-gray-900 dark:text-white">
            Upload Attachments
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            Add Image, Video or file upto 5 files
          </DialogDescription>
          <FileUploadComponent
            files={files}
            onFilesChange={setFiles}
            onUpload={handleUpload}
            uploading={uploading}
            uploadProgress={uploadProgress}
            existingFiles={existingAttachments}
            shouldShowExistingFiles={false}
            onRemoveExisting={(id) => {
              // Handle existing file removal
              console.log("Remove existing file:", id);
            }}
            canEdit={canEdit}
          />
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog
        open={previewModal.open}
        onOpenChange={() => setPreviewModal({ open: false, content: null })}
      >
        <DialogContent
          shouldRemoveCloseIcon={true}
          className="sm:max-w-3xl w-fit dark:bg-transparent border-none"
        >
          <DialogTitle className="hidden">Attachment Preview</DialogTitle>
          <DialogDescription></DialogDescription>
          <div className="flex justify-center">{previewModal.content}</div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, attachment: deleteDialog.attachment })
        }
      >
        <AlertDialogContent className="bg-slate-900 dark:border-2 dark:border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;
              {deleteDialog.attachment?.filename}&quot;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-transparent dark:hover:bg-slate-800/50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AttachmentManager;
