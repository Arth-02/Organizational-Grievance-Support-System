import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  Paperclip,
  User
} from 'lucide-react';
import cn from 'classnames';

const PRIORITY_BADGES = {
  low: { color: "bg-green-500/10 text-green-500", label: "Low" },
  medium: { color: "bg-yellow-500/10 text-yellow-500", label: "Medium" },
  high: { color: "bg-red-500/10 text-red-500", label: "High" }
};

const GrievanceCard = ({ 
  grievance, 
  provided, 
  snapshot, 
  location 
}) => {
  return (
    <div
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      className="transition-all duration-200 group"
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
            {"rotate-2": snapshot?.isDragging}
          )}
        >
          <CardHeader className="p-4 pb-2 space-y-2">
            <div className="flex items-start justify-between">
              <h4 className="font-semibold text-lg group-hover:underline transition-colors">
                {grievance.title}
              </h4>
              {grievance.priority && (
                <Badge className={cn("ml-2", PRIORITY_BADGES[grievance.priority].color)}>
                  {PRIORITY_BADGES[grievance.priority].label}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
              {grievance.description}
            </p>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{grievance.reported_by.username}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {new Date(grievance.date_reported).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {grievance.attachments?.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Paperclip className="h-3 w-3" />
                    <span>{grievance.attachments.length}</span>
                  </div>
                )}
                
                {grievance.comments?.length > 0 && (
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{grievance.comments.length}</span>
                  </div>
                )}

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