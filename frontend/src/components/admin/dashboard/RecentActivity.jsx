import { formatDistanceToNow } from "date-fns";
import { Building2, UserPlus, LogIn } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const activityIcons = {
  organization_created: Building2,
  user_created: UserPlus,
  user_login: LogIn,
};

const activityColors = {
  organization_created: "bg-blue-500/10 text-blue-500",
  user_created: "bg-green-500/10 text-green-500",
  user_login: "bg-purple-500/10 text-purple-500",
};

const RecentActivity = ({ activities = [], isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-5">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-10 h-10 bg-muted rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/50 rounded-xl p-5">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recent activity
            </p>
          ) : (
            activities.map((activity, index) => {
              const Icon = activityIcons[activity.type] || Building2;
              const colorClass = activityColors[activity.type] || "bg-muted text-muted-foreground";
              
              // Safely parse timestamp
              const timestamp = activity.timestamp || activity.created_at || activity.createdAt;
              const date = timestamp ? new Date(timestamp) : null;
              const isValidDate = date && !isNaN(date.getTime());
              
              return (
                <div key={index} className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isValidDate 
                        ? formatDistanceToNow(date, { addSuffix: true })
                        : 'Recently'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default RecentActivity;
