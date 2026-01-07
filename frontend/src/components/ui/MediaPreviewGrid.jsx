import { useState } from "react";
import {
  Maximize2,
  Trash2,
  FileText,
  Download,
  ImageIcon,
  Film,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// File type configurations
const FILE_TYPES = {
  "application/pdf": {
    icon: <FileText className="w-6 h-6 text-red-500" />,
    color: "bg-red-500/10",
    label: "PDF",
  },
  "application/msword": {
    icon: <FileText className="w-6 h-6 text-blue-500" />,
    color: "bg-blue-500/10",
    label: "Word",
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    icon: <FileText className="w-6 h-6 text-blue-500" />,
    color: "bg-blue-500/10",
    label: "Word",
  },
};

// Media type indicator badge
const MediaTypeIndicator = ({ type }) => {
  let icon = <FileText className="w-4 h-4 text-white" />;
  let label = "File";

  if (type?.startsWith("image/")) {
    icon = <ImageIcon className="w-4 h-4 text-white" />;
    label = "Image";
  } else if (type?.startsWith("video/")) {
    icon = <Film className="w-4 h-4 text-white" />;
    label = "Video";
  } else if (FILE_TYPES[type]) {
    label = FILE_TYPES[type].label;
  }

  return (
    <Tooltip>
      <TooltipTrigger className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm p-1 rounded-md z-10">
        {icon}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
};

/**
 * MediaPreviewGrid - A reusable component for displaying media items in a grid
 * 
 * @param {Array} items - Array of media items to display
 * @param {Function} onRemove - Callback when remove button is clicked (item) => void
 * @param {boolean} canDelete - Whether to show delete button
 * @param {boolean} isLocal - Whether items are local files (with file object) or remote (with url)
 * @param {string} size - Size variant: "sm" (w-24 h-24), "md" (w-28 h-28), "lg" (w-32 h-32)
 * @param {Function} onSelect - Optional callback for selection mode (item) => void
 * @param {Array} selectedIds - Array of selected item IDs for selection mode
 */
const MediaPreviewGrid = ({
  items = [],
  onRemove,
  canDelete = true,
  isLocal = false,
  size = "md",
  onSelect,
  selectedIds = [],
}) => {
  const [previewModal, setPreviewModal] = useState({ open: false, content: null });
  const [loadingMedia, setLoadingMedia] = useState({});

  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-28 h-28",
    lg: "w-32 h-32",
  };

  const getItemId = (item) => isLocal ? item.id : item._id;
  const getItemUrl = (item) => isLocal ? item.preview : item.url;
  const getItemName = (item) => isLocal ? item.file?.name : item.filename;
  const getItemType = (item) => isLocal ? item.type : item.filetype;

  const handleMediaLoad = (itemId) => {
    setLoadingMedia((prev) => ({ ...prev, [itemId]: false }));
  };

  const handleMediaError = (itemId) => {
    setLoadingMedia((prev) => ({ ...prev, [itemId]: false }));
  };

  const handlePreview = (item) => {
    const type = getItemType(item);
    const url = getItemUrl(item);
    const name = getItemName(item);

    if (type?.startsWith("image/")) {
      setPreviewModal({
        open: true,
        content: (
          <img src={url} alt={name} className="max-h-[80vh] max-w-full rounded-lg" />
        ),
      });
    } else if (type?.startsWith("video/")) {
      setPreviewModal({
        open: true,
        content: (
          <video controls src={url} className="max-h-[80vh] max-w-full rounded-lg" />
        ),
      });
    }
  };

  const renderImageVideo = (item) => {
    const itemId = getItemId(item);
    const type = getItemType(item);
    const url = getItemUrl(item);
    const name = getItemName(item);
    const isSelected = selectedIds.includes(itemId);

    // Initialize loading state
    if (loadingMedia[itemId] === undefined && !isLocal) {
      setLoadingMedia((prev) => ({ ...prev, [itemId]: true }));
    }

    return (
      <div
        className={cn(
          "relative group bg-muted rounded-lg overflow-hidden cursor-pointer transition-all",
          sizeClasses[size],
          isSelected && "ring-2 ring-primary"
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelect) {
            onSelect(item);
          } else {
            handlePreview(item);
          }
        }}
      >
        <MediaTypeIndicator type={type} />

        {/* Loading state for remote media */}
        {loadingMedia[itemId] && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Media content */}
        {type?.startsWith("image/") ? (
          <img
            src={url}
            alt={name}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              loadingMedia[itemId] ? "opacity-0" : "opacity-100"
            )}
            onLoad={() => handleMediaLoad(itemId)}
            onError={() => handleMediaError(itemId)}
          />
        ) : (
          <video
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              loadingMedia[itemId] ? "opacity-0" : "opacity-100"
            )}
            onLoadedData={() => handleMediaLoad(itemId)}
            onError={() => handleMediaError(itemId)}
          >
            <source src={url} type={type} />
          </video>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
            <Maximize2 className="h-4 w-4 text-white" />
          </div>
          {canDelete && onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item);
              }}
              className="p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:text-red-400 hover:bg-red-500/30 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderFile = (item) => {
    const itemId = getItemId(item);
    const type = getItemType(item);
    const url = getItemUrl(item);
    const isSelected = selectedIds.includes(itemId);

    return (
      <div
        className={cn(
          "relative group bg-muted rounded-lg overflow-hidden cursor-pointer transition-all",
          sizeClasses[size],
          isSelected && "ring-2 ring-primary"
        )}
        onClick={() => onSelect?.(item)}
      >
        <MediaTypeIndicator type={type} />

        {/* File icon */}
        <div className="w-full h-full flex items-center justify-center">
          {FILE_TYPES[type]?.icon || <FileText className="w-8 h-8 text-muted-foreground" />}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:text-blue-400 hover:bg-blue-500/30 transition-colors"
            >
              <Download className="h-4 w-4" />
            </a>
          )}
          {canDelete && onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item);
              }}
              className="p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:text-red-400 hover:bg-red-500/30 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  if (items.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {items.map((item) => {
          const itemId = getItemId(item);
          const type = getItemType(item);
          const name = getItemName(item);
          const isMediaType = type?.startsWith("image/") || type?.startsWith("video/");

          return (
            <div key={itemId} className="flex flex-col items-center">
              {isMediaType ? renderImageVideo(item) : renderFile(item)}
              
              {/* Filename tooltip */}
              <Tooltip>
                <TooltipTrigger 
                  className={cn(
                    "text-xs text-center text-muted-foreground mt-1.5 truncate px-1",
                    size === "sm" ? "w-24" : size === "md" ? "w-28" : "w-32"
                  )}
                >
                  {name}
                </TooltipTrigger>
                <TooltipContent>{name}</TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      <Dialog open={previewModal.open} onOpenChange={() => setPreviewModal({ open: false, content: null })}>
        <DialogContent 
          shouldRemoveCloseIcon={true}
          className="sm:max-w-4xl w-fit bg-transparent border-none shadow-none p-0"
        >
          <DialogTitle className="sr-only">Media Preview</DialogTitle>
          <DialogDescription className="sr-only">Preview of the selected media</DialogDescription>
          <div className="relative flex justify-center items-center">
            <div className="rounded-lg overflow-hidden shadow-2xl">
              {previewModal.content}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MediaPreviewGrid;
