import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Paperclip, CheckSquare, Bug, BookOpen, Zap } from "lucide-react";
import cn from "classnames";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

// Task type configuration
const TASK_TYPE_CONFIG = {
  task: { icon: CheckSquare, color: "text-blue-500" },
  bug: { icon: Bug, color: "text-red-500" },
  story: { icon: BookOpen, color: "text-green-500" },
  epic: { icon: Zap, color: "text-purple-500" },
};

// Priority configuration
const PRIORITY_CONFIG = {
  lowest: {
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400",
    label: "Lowest",
  },
  low: {
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    label: "Low",
  },
  medium: {
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    label: "Medium",
  },
  high: {
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
    label: "High",
  },
  highest: {
    badge: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
    label: "Highest",
  },
};

const TaskCard = ({ task, provided, snapshot }) => {
  const [searchParams] = useSearchParams();
  
  const typeConfig = TASK_TYPE_CONFIG[task.type] || TASK_TYPE_CONFIG.task;
  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const TypeIcon = typeConfig.icon;

  // Build link URL with taskId as search param
  const buildLinkUrl = () => {
    const params = new URLSearchParams(searchParams);
    params.set("taskId", task._id);
    return `?${params.toString()}`;
  };

  return (
    <div
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      className="group"
    >
      <Link to={buildLinkUrl()} className="block">
        <Card
          className={cn(
            "relative overflow-hidden rounded-lg",
            "border border-border",
            "bg-card",
            "hover:border-primary/30 hover:shadow-lg",
            "transition-all duration-200",
            {
              "rotate-1 shadow-xl scale-[1.02] ring-2 ring-primary/40":
                snapshot?.isDragging,
            }
          )}
        >
          {/* Header with issue key and priority */}
          <CardHeader className="p-3 pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Task Type Icon */}
                <Tooltip>
                  <TooltipTrigger>
                    <TypeIcon className={cn("h-4 w-4", typeConfig.color)} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <span className="capitalize">{task.type || "Task"}</span>
                  </TooltipContent>
                </Tooltip>
                {/* Issue Key */}
                <span className="text-xs font-medium text-muted-foreground">
                  {task.issue_key}
                </span>
              </div>
              {/* Priority Badge */}
              {task.priority && (
                <Badge
                  className={cn(
                    "text-[10px] font-semibold px-1.5 py-0.5 uppercase tracking-wide",
                    priorityConfig.badge
                  )}
                >
                  {priorityConfig.label}
                </Badge>
              )}
            </div>
          </CardHeader>

          {/* Title */}
          <CardContent className="px-3 pb-3 pt-0 space-y-3">
            <h4 className="font-medium text-sm text-card-foreground leading-tight line-clamp-2">
              {task.title}
            </h4>

            {/* Footer with metadata */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {/* Attachment count */}
                {task.attachments?.length > 0 && (
                  <div className="flex items-center gap-0.5 bg-muted/50 px-1.5 py-0.5 rounded">
                    <Paperclip className="h-3 w-3" />
                    <span className="text-xs font-medium">
                      {task.attachments.length}
                    </span>
                  </div>
                )}
              </div>

              {/* Assignee Avatar */}
              {task.assigned_to && (
                <Tooltip>
                  <TooltipTrigger>
                    <Avatar className="h-7 w-7 ring-2 ring-card shadow-sm transition-transform">
                      <AvatarImage
                        src={task.assigned_to?.avatar}
                        alt={task.assigned_to?.username}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                        {task.assigned_to?.username?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    {task.assigned_to?.username || "Unknown"}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
};

export default TaskCard;
