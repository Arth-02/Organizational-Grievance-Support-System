import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, Paperclip } from "lucide-react";
import cn from "classnames";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import DOMPurify from "dompurify";

const PRIORITY_CONFIG = {
  low: {
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    label: "Low",
  },
  medium: {
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    label: "Medium",
  },
  high: {
    badge: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
    label: "High",
  },
};

const GrievanceCard = ({ grievance, provided, snapshot }) => {
  const [searchParams] = useSearchParams();
  const priorityConfig = PRIORITY_CONFIG[grievance.priority] || PRIORITY_CONFIG.low;

  // Build link URL with id as search param, preserving existing params
  const buildLinkUrl = () => {
    const params = new URLSearchParams(searchParams);
    params.set("id", grievance._id);
    return `/grievances?${params.toString()}`;
  };

  return (
    <div
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      className="group"
    >
      <Link
        to={buildLinkUrl()}
        className="block"
      >
        <Card
          className={cn(
            "relative overflow-hidden rounded-lg",
            "border border-border",
            "bg-card",
            "hover:border-primary/30 hover:shadow-lg",
            "transition-all duration-200",
            {
              "rotate-1 shadow-xl scale-[1.02] ring-2 ring-primary/40": snapshot?.isDragging,
            }
          )}
        >
          {/* Header with title and badges */}
          <CardHeader className="p-3 pb-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-base text-card-foreground leading-tight line-clamp-2 flex-1">
                {grievance.title}
              </h4>
              <div className="flex items-center gap-1.5 shrink-0">
                {grievance.is_urgent && (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="p-1 rounded-full bg-red-100 dark:bg-red-500/20">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span className="text-red-500 font-medium">Urgent</span>
                    </TooltipContent>
                  </Tooltip>
                )}
                {grievance.priority && (
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
            </div>
          </CardHeader>

          {/* Description */}
          <CardContent className="px-3 pb-3 pt-0 space-y-3">
            <p
              className="text-sm text-muted-foreground line-clamp-2 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(grievance.description),
              }}
            ></p>

            {/* Footer with metadata */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1 bg-muted/50 py-0.5 rounded">
                  <Avatar className="h-7 w-7 ring-2 ring-card shadow-sm transition-transform">
                    <AvatarImage
                      src={grievance.reported_by?.avatar}
                      alt={grievance.reported_by?.username}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                      {grievance.reported_by?.username?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium truncate max-w-[70px]">{grievance.reported_by?.username || "Unknown"}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {new Date(grievance.date_reported).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {grievance.attachments?.length > 0 && (
                  <div className="flex items-center gap-0.5 bg-muted/50 px-1.5 py-0.5 rounded">
                    <Paperclip className="h-3 w-3" />
                    <span className="font-medium">{grievance.attachments.length}</span>
                  </div>
                )}
              </div>

              {grievance.assigned_to &&
                <Tooltip>
                  <TooltipTrigger>
                    <Avatar className="h-7 w-7 ring-2 ring-card shadow-sm transition-transform">
                      <AvatarImage
                        src={grievance.assigned_to?.avatar}
                        alt={grievance.assigned_to?.username}
                      />
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                      {grievance.assigned_to?.username?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  {grievance.assigned_to?.username || "Unknown"}
                </TooltipContent>
              </Tooltip>
              }
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
};

export default GrievanceCard;
