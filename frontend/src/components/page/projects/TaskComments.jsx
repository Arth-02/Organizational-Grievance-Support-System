import { useState } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pencil, Loader2, MessageSquare, Paperclip } from "lucide-react";
import toast from "react-hot-toast";
import {
  useAddCommentMutation,
  useUpdateCommentMutation,
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
  const [showCommentInput, setShowCommentInput] = useState(false);

  // API hooks
  const [addComment, { isLoading: isAdding }] = useAddCommentMutation();
  const [updateComment, { isLoading: isUpdating }] = useUpdateCommentMutation();

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

  return (
    <div className="space-y-4">
      {/* Add Comment Section - On Top */}
      <div className="pb-4 border-b border-border">
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

      {/* Comments List - Descending Order */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No comments yet</p>
        ) : (
          [...comments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((comment) => (
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

                    {/* Actions (Edit only) - Only for comment owner */}
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
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TaskComments;
