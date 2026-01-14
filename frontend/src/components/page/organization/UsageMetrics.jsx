import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  FolderKanban,
  HardDrive,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * UsageMetrics Component
 * Displays user count, project count, and storage usage with progress bars
 * Color coding: green (< 60%), yellow (60-80%), red (> 80%)
 * 
 * @requirements 9.2
 */
const UsageMetrics = ({ usage, plan, isLoading }) => {
  // Format storage bytes to human readable
  const formatStorage = (bytes) => {
    if (bytes === undefined || bytes === null) return "0 B";
    if (bytes === 0) return "0 B";
    
    const units = ["B", "KB", "MB", "GB", "TB"];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
  };

  // Calculate percentage
  const calculatePercentage = (current, max) => {
    if (max === -1 || max === 0) return 0; // Unlimited
    return Math.min(Math.round((current / max) * 100), 100);
  };

  // Get color based on percentage
  const getProgressColor = (percentage) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 80) return "bg-orange-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Get status text
  const getStatusText = (percentage, isUnlimited) => {
    if (isUnlimited) return "Unlimited";
    if (percentage >= 100) return "Limit reached";
    if (percentage >= 90) return "Critical";
    if (percentage >= 80) return "Warning";
    return "Good";
  };

  // Get status color class
  const getStatusColorClass = (percentage, isUnlimited) => {
    if (isUnlimited) return "text-blue-600";
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 80) return "text-orange-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-green-600";
  };

  // Metrics configuration
  const metrics = [
    {
      key: "users",
      label: "Users",
      icon: Users,
      current: usage?.userCount || 0,
      max: plan?.limits?.maxUsers || 0,
      format: (v) => v.toString(),
    },
    {
      key: "projects",
      label: "Projects",
      icon: FolderKanban,
      current: usage?.projectCount || 0,
      max: plan?.limits?.maxProjects || 0,
      format: (v) => v.toString(),
    },
    {
      key: "storage",
      label: "Storage",
      icon: HardDrive,
      current: usage?.storageBytes || 0,
      max: plan?.limits?.maxStorageBytes || 0,
      format: formatStorage,
    },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Usage Overview
        </CardTitle>
        <CardDescription>
          Monitor your organization&apos;s resource usage against plan limits
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metrics.map((metric) => {
            const isUnlimited = metric.max === -1;
            const percentage = calculatePercentage(metric.current, metric.max);
            const progressColor = getProgressColor(percentage);
            const statusText = getStatusText(percentage, isUnlimited);
            const statusColorClass = getStatusColorClass(percentage, isUnlimited);
            const Icon = metric.icon;

            return (
              <div
                key={metric.key}
                className={cn(
                  "p-4 rounded-lg border transition-colors",
                  percentage >= 90 && !isUnlimited && "border-red-500/30 bg-red-500/5",
                  percentage >= 80 && percentage < 90 && !isUnlimited && "border-orange-500/30 bg-orange-500/5",
                  (percentage < 80 || isUnlimited) && "border-border bg-card"
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "p-2 rounded-full",
                      percentage >= 90 && !isUnlimited ? "bg-red-500/10" : "bg-primary/10"
                    )}>
                      <Icon className={cn(
                        "h-4 w-4",
                        percentage >= 90 && !isUnlimited ? "text-red-500" : "text-primary"
                      )} />
                    </div>
                    <span className="font-medium">{metric.label}</span>
                  </div>
                  <span className={cn("text-xs font-medium", statusColorClass)}>
                    {statusText}
                  </span>
                </div>

                {/* Usage Numbers */}
                <div className="mb-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">
                      {metric.format(metric.current)}
                    </span>
                    <span className="text-muted-foreground">
                      / {isUnlimited ? "∞" : metric.format(metric.max)}
                    </span>
                  </div>
                  {!isUnlimited && (
                    <span className="text-xs text-muted-foreground">
                      {percentage}% used
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                {!isUnlimited ? (
                  <div className="relative">
                    <Progress 
                      value={percentage} 
                      className="h-2 bg-secondary"
                    />
                    {/* Custom colored indicator overlay */}
                    <div 
                      className={cn(
                        "absolute top-0 left-0 h-2 rounded-full transition-all",
                        progressColor
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                ) : (
                  <div className="h-2 rounded-full bg-blue-500/20 overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-blue-500/50 to-blue-500/20 animate-pulse" />
                  </div>
                )}

                {/* Warning Message */}
                {percentage >= 80 && !isUnlimited && (
                  <div className="flex items-center gap-1 mt-3 text-xs">
                    <AlertTriangle className={cn(
                      "h-3 w-3",
                      percentage >= 90 ? "text-red-500" : "text-orange-500"
                    )} />
                    <span className={cn(
                      percentage >= 90 ? "text-red-600" : "text-orange-600"
                    )}>
                      {percentage >= 100 
                        ? "Limit reached. Upgrade to add more."
                        : percentage >= 90 
                          ? "Almost at limit. Consider upgrading."
                          : "Approaching limit."}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Footer */}
        {plan && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
              <div>
                Current Plan: <span className="font-medium text-foreground capitalize">{plan.displayName || plan.name}</span>
              </div>
              {metrics.some(m => calculatePercentage(m.current, m.max) >= 80 && m.max !== -1) && (
                <div className="flex items-center gap-1 text-orange-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Some resources are nearing their limits</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UsageMetrics;
