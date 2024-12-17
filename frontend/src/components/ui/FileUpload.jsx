import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  X,
  Upload,
  File,
  Image as ImageIcon,
  Video,
  FileText,
  FileSpreadsheet,
  Loader2,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = {
  "image/*": [".png", ".jpg", ".jpeg", ".gif"],
  "video/*": [".mp4", ".webm"],
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/vnd.ms-powerpoint": [".ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
    ".pptx",
  ],
  "text/plain": [".txt"],
  "text/markdown": [".md"],
};

const FILE_ICONS = {
  image: <ImageIcon className="w-5 h-5" />,
  video: <Video className="w-5 h-5" />,
  pdf: <FileText className="w-5 h-5 text-red-600" />,
  document: <FileText className="w-5 h-5 text-blue-600" />,
  presentation: <FileSpreadsheet className="w-5 h-5 text-orange-600" />,
  text: <FileText className="w-5 h-5 text-green-600" />,
  default: <File className="w-5 h-5" />,
};

const FileUploadComponent = ({
  files = [],
  onFilesChange,
  onUpload,
  uploading = false,
  uploadProgress = 0,
  showUploadButton = true,
  maxFiles = 5,
  existingFiles = [],
  shouldShowExistingFiles = true,
  onRemoveExisting,
  canEdit = true,
}) => {
  const [previewModal, setPreviewModal] = useState({
    open: false,
    content: null,
  });

  const onDrop = useCallback(
    (acceptedFiles) => {
      const totalFiles =
        files.length + existingFiles.length + acceptedFiles.length;

      if (totalFiles > maxFiles) {
        toast.error(`You can only upload up to ${maxFiles} files.`);
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
    [existingFiles.length, files, maxFiles, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    multiple: true,
    maxFiles: maxFiles - files.length,
  });

  const getFileIcon = (type) => {
    if (type?.startsWith("image/")) return FILE_ICONS.image;
    if (type?.startsWith("video/")) return FILE_ICONS.video;
    if (type?.startsWith("application/pdf")) return FILE_ICONS.pdf;
    if (type?.includes("word")) return FILE_ICONS.document;
    if (type?.includes("powerpoint")) return FILE_ICONS.presentation;
    if (type?.startsWith("text/")) return FILE_ICONS.text;
    return FILE_ICONS.default;
  };

  const removeFile = (fileId) => {
    onFilesChange(files.filter((f) => f.id !== fileId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const renderThumbnail = (file) => {
    if (
      file.type?.startsWith("image/") ||
      file.filetype?.startsWith("image/")
    ) {
      return (
        <img
          src={file.preview || file.url}
          alt={file.file?.name || file.filename}
          className="h-12 w-12 object-cover rounded"
        />
      );
    }
    else if (file.type?.startsWith("video/") || file.filetype?.startsWith("video/")) {
      return (
        <video className="h-12 w-12 object-cover rounded">
          <source src={file.preview || file.url} type={file.type} />
        </video>
      )
    }

    return (
      <div className="h-12 w-12 bg-gray-100 dark:bg-slate-700 rounded flex items-center justify-center">
        {getFileIcon(file.type || file.filetype)}
      </div>
    );
  };

  const handlePreview = (file) => {
    if (file.type?.startsWith("image/")) {
      setPreviewModal({
        open: true,
        content: (
          <img
            src={file.preview || file.url}
            alt={file.file?.name || file.filename}
            className="max-h-[80vh] max-w-full"
          />
        ),
      });
    } else if (file.type?.startsWith("video/")) {
      setPreviewModal({
        open: true,
        content: (
          <video
            controls
            src={file.preview}
            className="max-h-[80vh] max-w-full"
          />
        ),
      });
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isDragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
            : "border-gray-300 dark:border-slate-600"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-400" />
        <p className="mt-2 text-gray-700 dark:text-slate-300">
          Drag & drop files here, or click to select files
        </p>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Supports images and documents up to 5MB
        </p>
      </div>

      {/* Existing Files */}
      {shouldShowExistingFiles && existingFiles.length > 0 && (
        <div className="space-y-2">
          {existingFiles.map((file) => (
            <div
              key={file._id}
              className="flex items-center p-2 rounded bg-white dark:bg-slate-800 border border-gray-200 dark:border-transparent"
            >
              {renderThumbnail(file)}
              <div className="flex-1 min-w-0 ml-3">
                <div className="text-sm text-gray-700 dark:text-slate-300 truncate">
                  {file.filename}
                </div>
                <div className="text-xs text-gray-500 dark:text-slate-400">
                  {formatFileSize(file.filesize)}
                </div>
              </div>
              {canEdit && onRemoveExisting && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveExisting(file._id)}
                  className="text-red-500 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center p-2 rounded bg-white dark:bg-slate-800 border border-gray-200 dark:border-transparent"
            >
              {renderThumbnail(file)}
              <div className="flex-1 min-w-0 ml-3">
                <div className="text-sm text-gray-700 dark:text-slate-300 truncate">
                  {file.file.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-slate-400">
                  {formatFileSize(file.file.size)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePreview(file)}
                className="text-blue-500 hover:text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(file.id)}
                className="text-red-500 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400 text-center">
            {Math.round(uploadProgress)}% uploaded
          </p>
        </div>
      )}

      {showUploadButton && files.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={onUpload} disabled={uploading}>
            {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Upload
          </Button>
        </div>
      )}

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
    </div>
  );
};

export default FileUploadComponent;
