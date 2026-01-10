import { useState } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pencil, Trash2, Loader2, MessageSquare, Paperclip } from "lucide-react";
import toast from "react-hot-toast";
import {
  useAddCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} from "@/services/task.service";
import TextEditor from "@/components/ui/TextEditor";

/**
 * TaskComments component for displaying and managing task comments
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
function TaskComments({ taskId, comments = [], onCommentUpdate }) {
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [showCommentInput, setShowCommentInput] = useState(false);

  // API hooks
  const [addComment, { isLoading: isAdding }] = useAddCommentMutation();
  const [updateComment, { isLoading: isUpdating }] = useUpdateCommentMutation();
  const [deleteComment, { isLoading: isDeleting }] = useDeleteCommentMutation();

  // Get current user
  const user = useSelector((state) => state.user.user);

  // Helper functions
  const getDisplayName = (author) => {
    if (!author) return "Unknown User";
    if (author.firstname && author.lastname) {
      return `${author.firstname} ${author.lastname}`;
    }
    return author.username || "Unknown User";
  };

  const getInitials = (author) => {
    if (!author) return "?";
    if (author.firstname && author.lastname) {
      return `${author.firstname[0]}${author.lastname[0]}`.toUpperCase();
    }
    return author.username?.slice(0, 2).toUpperCase() || "??";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const isCommentOwner = (comment) => {
    return user?._id === comment.author?._id;
  };

  // Handlers
  const handleAddComment = async (content) => {
    if (!content || content === "<p></p>") {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      const response = await addComment({
        taskId,
        data: { message: content },
      }).unwrap();

      toast.success("Comment added");
      setNewComment("");
      setShowCommentInput(false);
      
      if (onCommentUpdate) {
        onCommentUpdate(response.data);
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error(error?.data?.message || "Failed to add comment");
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditingContent(comment.message);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent("");
  };

  const handleSaveEdit = async (content) => {
    if (!content || content === "<p></p>") {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      const response = await updateComment({
        taskId,
        commentId: editingCommentId,
        data: { message: content },
      }).unwrap();

      toast.success("Comment updated");
      setEditingCommentId(null);
      setEditingContent("");
      
      if (onCommentUpdate) {
        onCommentUpdate(response.data);
      }
    } catch (error) {
      console.error("Failed to update comment:", error);
      toast.error(error?.data?.message || "Failed to update comment");
    }
  };

  const handleDeleteClick = (comment) => {
    setCommentToDelete(comment);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!commentToDelete) return;

    try {
      await deleteComment({
        taskId,
        commentId: commentToDelete._id,
      }).unwrap();

      toast.success("Comment deleted");
      setDeleteDialogOpen(false);
      setCommentToDelete(null);
      
      if (onCommentUpdate) {
        // Trigger a refetch by passing null
        onCommentUpdate(null);
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast.error(error?.data?.message || "Failed to delete comment");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="flex gap-3">
              {/* Author Avatar */}
              <Tooltip>
                <TooltipTrigger>
                  <Avatar className="h-8 w-8 ring-2 ring-border shadow-sm flex-shrink-0">
                    <AvatarImage
                      src={comment.author?.avatar}
                      alt={comment.author?.username}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                      {getInitials(comment.author)}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>{comment.author?.username}</TooltipContent>
              </Tooltip>

              {/* Comment Content */}
              <div className="flex-1 min-w-0">
                {/* Author and Timestamp */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-card-foreground">
                    {getDisplayName(comment.author)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(comment.created_at)}
                  </span>
                  {comment.is_edited && (
                    <span className="text-xs text-muted-foreground italic">
                      (edited)
                    </span>
                  )}
                </div>

                {/* Comment Message or Edit Mode */}
                {editingCommentId === comment._id ? (
                  <div className="mt-2">
                    <TextEditor
                      initialContent={editingContent}
                      onSave={handleSaveEdit}
                      onChange={setEditingContent}
                      onCancel={handleCancelEdit}
                      className="min-h-[100px]"
                    />
                    {isUpdating && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Message */}
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none text-sm text-card-foreground bg-muted/50 rounded-lg p-3"
                      dangerouslySetInnerHTML={{ __html: comment.message }}
                    />

                    {/* Attachments */}
                    {comment.attachments?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {comment.attachments.map((attachment) => (
                          <a
                            key={attachment._id}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded"
                          >
                            <Paperclip className="h-3 w-3" />
                            {attachment.name || "Attachment"}
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Actions (Edit/Delete) - Only for comment owner */}
                    {isCommentOwner(comment) && (
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => handleEditComment(comment)}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                          onClick={() => handleDeleteClick(comment)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Section */}
      <div className="pt-4 border-t border-border">
        {showCommentInput ? (
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 ring-2 ring-border shadow-sm flex-shrink-0">
                <AvatarImage src={user?.avatar} alt={user?.username} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                  {getInitials(user)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <TextEditor
                  initialContent={newComment}
                  onSave={handleAddComment}
                  onChange={setNewComment}
                  onCancel={() => {
                    setShowCommentInput(false);
                    setNewComment("");
                  }}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            {isAdding && (
              <div className="flex items-center gap-2 ml-11 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding comment...
              </div>
            )}
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={() => setShowCommentInput(true)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Add a comment...
          </Button>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border border-border dark:border-secondary shadow-xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-500/20">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-lg font-semibold text-card-foreground">
                Delete Comment
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="border-border hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default TaskComments;
