import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, Paperclip, User } from "lucide-react";
import cn from "classnames";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipContent } from "@radix-ui/react-tooltip";
import DOMPurify from "dompurify";

const PRIORITY_BADGES = {
  low: { color: "bg-green-500/10 text-green-500", label: "Low" },
  medium: { color: "bg-yellow-500/10 text-yellow-500", label: "Medium" },
  high: { color: "bg-red-500/10 text-red-500", label: "High" },
};

const GrievanceCard = ({ grievance, provided, snapshot, location }) => {
  return (
    <div
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      className="group"
    >
      <Link
        to={`/grievances/${grievance._id}`}
        state={{ background: location }}
        className="block"
      >
        <Card
          className={cn(
            "border border-slate-200 dark:border-slate-800",
            "hover:shadow dark:hover:shadow-white/10",
            "transition-all duration-200",
            "bg-white dark:bg-gray-600/40",
            { "rotate-2": snapshot?.isDragging }
          )}
        >
          <CardHeader className="p-4 pb-2 space-y-2">
            <div className="flex items-start justify-between">
              <h4 className="font-semibold text-lg group-hover:underline transition-colors">
                {grievance.title}
              </h4>
              {grievance.priority && (
                <Badge
                  className={cn(
                    "ml-2",
                    PRIORITY_BADGES[grievance.priority].color
                  )}
                >
                  {PRIORITY_BADGES[grievance.priority].label}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            <p
              className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(grievance.description),
              }}
            ></p>

            <div className="flex items-center justify-between text-sm text-slate-500">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <User className="h-[14px] w-[14px]" />
                  <span>{grievance.reported_by.username}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Clock className="h-[14px] w-[14px]" />
                  <span>
                    {new Date(grievance.date_reported).toLocaleDateString()}
                  </span>
                </div>

                {grievance.attachments?.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Paperclip className="h-[14px] w-[14px]" />
                    <span>{grievance.attachments.length}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Tooltip>
                  <TooltipTrigger>
                    <Avatar>
                      <AvatarImage
                        src={grievance.reported_by.avatar}
                        alt={grievance.reported_by.username}
                      />
                      <AvatarFallback>
                        {grievance.reported_by.username[0]}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    {grievance.reported_by.username}
                  </TooltipContent>
                </Tooltip>
                {grievance.is_urgent && (
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
};

export default GrievanceCard;
