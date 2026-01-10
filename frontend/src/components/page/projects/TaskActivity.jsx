import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Activity,
  ArrowRight,
  CheckSquare,
  Bug,
  BookOpen,
  Zap,
  GitBranch,
  User,
  AlertCircle,
  Paperclip,
  MessageSquare,
  Edit,
} from "lucide-react";
import cn from "classnames";

// Action type configuration for icons and labels
const ACTION_CONFIG = {
  created: {
    icon: CheckSquare,
    label: "created this task",
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-500/20",
  },
  status_changed: {
    icon: Activity,
    label: "changed status",
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-500/20",
  },
  assignee_changed: {
    icon: User,
    label: "changed assignee",
    color: "text-purple-500",
    bgColor: "bg-purple-100 dark:bg-purple-500/20",
  },
  priority_changed: {
    icon: AlertCircle,
    label: "changed priority",
    color: "text-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-500/20",
  },
  comment_added: {
    icon: MessageSquare,
    label: "added a comment",
    color: "text-cyan-500",
    bgColor: "bg-cyan-100 dark:bg-cyan-500/20",
  },
  attachment_added: {
    icon: Paperclip,
    label: "added an attachment",
    color: "text-amber-500",
    bgColor: "bg-amber-100 dark:bg-amber-500/20",
  },
  updated: {
    icon: Edit,
    label: "updated",
    color: "text-gray-500",
    bgColor: "bg-gray-100 dark:bg-gray-500/20",
  },
};

// Status display configuration
const STATUS_DISPLAY = {
  todo: "To Do",
  "in-progress": "In Progress",
  review: "Review",
  done: "Done",
};

// Priority display configuration
const PRIORITY_DISPLAY = {
  lowest: "Lowest",
  low: "Low",
  medium: "Medium",
  high: "High",
  highest: "Highest",
};

// Task type icons
const TASK_TYPE_ICONS = {
  task: CheckSquare,
  bug: Bug,
  story: BookOpen,
  epic: Zap,
  subtask: GitBranch,
};

/**
 * TaskActivity component for displaying task activity history
 * Requirements: 8.5
 */
function TaskActivity({ activity = [] }) {
  // Helper functions
  const getDisplayName = (user) => {
    if (!user) return "Unknown User";
    if (user.firstname && user.lastname) {
      return `${user.firstname} ${user.lastname}`;
    }
    return user.username || "Unknown User";
  };

  const getInitials = (user) => {
    if (!user) return "?";
    if (user.firstname && user.lastname) {
      return `${user.firstname[0]}${user.lastname[0]}`.toUpperCase();
    }
    return user.username?.slice(0, 2).toUpperCase() || "??";
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

  const formatFullDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Format field value for display
  const formatFieldValue = (action, field, value) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">None</span>;
    }

    // Handle user objects (assignee changes)
    if (typeof value === "object" && (value.firstname || value.username)) {
      return (
        <span className="font-medium text-card-foreground">
          {getDisplayName(value)}
        </span>
      );
    }

    // Handle status values
    if (action === "status_changed" || field === "status") {
      return (
        <span className="font-medium text-card-foreground">
          {STATUS_DISPLAY[value] || value}
        </span>
      );
    }

    // Handle priority values
    if (action === "priority_changed" || field === "priority") {
      return (
        <span className="font-medium text-card-foreground">
          {PRIORITY_DISPLAY[value] || value}
        </span>
      );
    }

    // Handle type values
    if (field === "type") {
      const TypeIcon = TASK_TYPE_ICONS[value] || CheckSquare;
      return (
        <span className="font-medium text-card-foreground inline-flex items-center gap-1">
          <TypeIcon className="h-3 w-3" />
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      );
    }

    // Default string display
    return (
      <span className="font-medium text-card-foreground">
        {String(value)}
      </span>
    );
  };

  // Get action description
  const getActionDescription = (entry) => {
    const config = ACTION_CONFIG[entry.action] || ACTION_CONFIG.updated;

    // For simple actions without from/to values
    if (entry.action === "created" || entry.action === "comment_added" || entry.action === "attachment_added") {
      return <span className="text-muted-foreground">{config.label}</span>;
    }

    // For field changes with from/to values
    if (entry.from !== null || entry.to !== null) {
      return (
        <span className="text-muted-foreground">
          {config.label}{" "}
          {entry.field && entry.action === "updated" && (
            <span className="font-medium text-card-foreground">{entry.field}</span>
          )}{" "}
          from {formatFieldValue(entry.action, entry.field, entry.from)}{" "}
          <ArrowRight className="inline h-3 w-3 mx-1 text-muted-foreground" />
          {formatFieldValue(entry.action, entry.field, entry.to)}
        </span>
      );
    }

    // Default
    return (
      <span className="text-muted-foreground">
        {config.label}
        {entry.field && <span className="font-medium text-card-foreground"> {entry.field}</span>}
      </span>
    );
  };

  // Sort activity by date (most recent first)
  const sortedActivity = [...activity].sort(
    (a, b) => new Date(b.performed_at) - new Date(a.performed_at)
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">
          Activity ({activity.length})
        </h3>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-1">
        {sortedActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No activity yet</p>
        ) : (
          sortedActivity.map((entry, index) => {
            const config = ACTION_CONFIG[entry.action] || ACTION_CONFIG.updated;
            const Icon = config.icon;
            const isLast = index === sortedActivity.length - 1;

            return (
              <div key={entry._id || index} className="flex gap-3 relative">
                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
                )}

                {/* Icon */}
                <div
                  className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10",
                    config.bgColor
                  )}
                >
                  <Icon className={cn("h-4 w-4", config.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-start gap-2 flex-wrap">
                    {/* Performer Avatar and Name */}
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger>
                          <Avatar className="h-5 w-5 ring-1 ring-border">
                            <AvatarImage
                              src={entry.performed_by?.avatar}
                              alt={entry.performed_by?.username}
                            />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-[10px]">
                              {getInitials(entry.performed_by)}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          {entry.performed_by?.username}
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-sm font-medium text-card-foreground">
                        {getDisplayName(entry.performed_by)}
                      </span>
                    </div>

                    {/* Action Description */}
                    <div className="text-sm">{getActionDescription(entry)}</div>
                  </div>

                  {/* Timestamp */}
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {formatDate(entry.performed_at)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {formatFullDate(entry.performed_at)}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default TaskActivity;
