import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import MediaPreviewGrid from "./MediaPreviewGrid";
import { cn } from "@/lib/utils";

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

  const removeFile = (item) => {
    onFilesChange(files.filter((f) => f.id !== item.id));
  };

  const removeExistingFile = (item) => {
    if (onRemoveExisting) {
      onRemoveExisting(item._id);
    }
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
          Images, Videos, Documents • Max 5MB • Up to {maxFiles} files
        </p>
      </div>

      {/* Existing Files */}
      {shouldShowExistingFiles && existingFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <Paperclip className="w-3.5 h-3.5" />
            <span>Existing files ({existingFiles.length})</span>
          </div>
          <MediaPreviewGrid
            items={existingFiles}
            onRemove={removeExistingFile}
            canDelete={canEdit && !!onRemoveExisting}
            isLocal={false}
            size="md"
          />
        </div>
      )}

      {/* New Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <Paperclip className="w-3.5 h-3.5" />
            <span>New files ({files.length})</span>
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

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {Math.round(uploadProgress)}% uploaded
          </p>
        </div>
      )}

      {/* Upload Button */}
      {showUploadButton && files.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={onUpload} disabled={uploading}>
            {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Upload
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUploadComponent;
