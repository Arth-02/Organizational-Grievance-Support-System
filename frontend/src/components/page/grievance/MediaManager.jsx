import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  X,
  Upload,
  File,
  Image as ImageIcon,
  Video,
  Maximize2,
  Paperclip,
  Trash2,
  Loader2,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
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

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = {
  "image/*": [".png", ".jpg", ".jpeg", ".gif"],
  "video/*": [".mp4", ".webm"],
};

const AttachmentManager = ({
  uploadModal,
  setUploadModal,
  grievanceId,
  existingAttachments = [],
  onUpdate,
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
      preview: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null,
      type: file.type,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    multiple: true,
  });

  const handleUpload = async () => {
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    files.forEach(({ file }) => formData.append("files", file));

    try {
      const response = await fetch(
        `/update/attachment/${grievanceId}`,
        {
          method: "PUT",
          body: formData,
          onUploadProgress: (progressEvent) => {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            setUploadProgress(progress);
          },
        }
      );

      if (!response.ok) throw new Error("Upload failed");

      const result = await response.json();
      onUpdate(result.data);
      setFiles([]);
      setUploadModal(false);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.attachment) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/grievances/${grievanceId}/attachments/${deleteDialog.attachment._id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Delete failed");

      const result = await response.json();
      onUpdate(result.data);
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setDeleting(false);
      setDeleteDialog({ open: false, attachment: null });
    }
  };

  const removeFile = (fileId) => {
    setFiles(files.filter((f) => f.id !== fileId));
  };

  const getFileIcon = (type) => {
    if (type?.startsWith("image/")) return <ImageIcon className="w-5 h-5" />;
    if (type?.startsWith("video/")) return <Video className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
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
        <div className="h-12 w-12 bg-slate-700 rounded flex items-center justify-center">
          <Video className="h-6 w-6 text-slate-400" />
        </div>
      );
    } else {
      return (
        <div className="h-12 w-12 bg-slate-700 rounded flex items-center justify-center">
          <File className="h-6 w-6 text-slate-400" />
        </div>
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing Attachments */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
          <Paperclip className="h-5 w-5" /> Attachments ({existingAttachments.length})
        </h3>

        {existingAttachments.map((attachment) => (
          <div
            key={attachment._id}
            className="flex items-center gap-3 p-2 rounded bg-slate-800"
          >
            <div
              className="cursor-pointer"
              onClick={() => handlePreview(attachment)}
            >
              {renderThumbnail(attachment)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-slate-300 truncate">
                {attachment.filename}
              </div>
              <div className="text-xs text-slate-400">
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
                  className="text-slate-400 hover:text-white dark:hover:bg-slate-700/50"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteDialog({ open: true, attachment })}
                className="dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      <Dialog open={uploadModal} onOpenChange={setUploadModal}>
        <DialogContent className="sm:max-w-md bg-gray-900">
            <DialogTitle>Upload Attachments</DialogTitle>
            <DialogDescription>Add Image, Video or file upto 5</DialogDescription>
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                isDragActive
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-slate-600"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-2 text-slate-300">
                Drag & drop files here, or click to select files
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Supports images and videos up to 5MB
              </p>
            </div>

            {/* Selected Files */}
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 p-2 rounded bg-slate-800"
                  >
                    {getFileIcon(file.type)}
                    <span className="flex-1 truncate text-slate-300">
                      {file.file.name}
                    </span>
                    {file.preview && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setPreviewModal({
                            open: true,
                            content: (
                              <img
                                src={file.preview}
                                alt="Preview"
                                className="max-h-[80vh] max-w-full"
                              />
                            ),
                          })
                        }
                        className="text-slate-400 hover:text-white dark:hover:bg-slate-700/50"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-slate-400 text-center">
                  {Math.round(uploadProgress)}% uploaded
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setUploadModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={files.length === 0 || uploading}
              >
                {uploading && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog
        open={previewModal.open}
        onOpenChange={() => setPreviewModal({ open: false, content: null })}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogTitle>Attachment Preview</DialogTitle>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDialog.attachment?.filename}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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