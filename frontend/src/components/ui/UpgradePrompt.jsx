import { useNavigate } from "react-router-dom";
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
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  ArrowUpRight,
  Users,
  FolderKanban,
  HardDrive,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * UpgradePrompt Component
 * Contextual prompt shown when subscription limits are reached
 * Displays current usage, limit, and upgrade CTA
 * 
 * @requirements 9.7
 */

// Resource type configurations
const resourceConfig = {
  users: {
    icon: Users,
    label: "Users",
    singularLabel: "user",
    description: "You've reached your user limit",
    upgradeMessage: "Upgrade to add more team members",
  },
  projects: {
    icon: FolderKanban,
    label: "Projects",
    singularLabel: "project",
    description: "You've reached your project limit",
    upgradeMessage: "Upgrade to create unlimited projects",
  },
  storage: {
    icon: HardDrive,
    label: "Storage",
    singularLabel: "storage",
    description: "You've reached your storage limit",
    upgradeMessage: "Upgrade for more storage space",
  },
};

// Format storage bytes
const formatStorage = (bytes) => {
  if (bytes === undefined || bytes === null) return "0 B";
  if (bytes === 0) return "0 B";
  
  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
};

/**
 * UpgradePrompt - Modal dialog for limit reached scenarios
 */
const UpgradePrompt = ({
  open,
  onOpenChange,
  resourceType = "users",
  currentUsage = 0,
  limit = 0,
  currentPlan = "Starter",
  recommendedPlan = "Professional",
}) => {
  const navigate = useNavigate();
  const config = resourceConfig[resourceType] || resourceConfig.users;
  const Icon = config.icon;

  const percentage = limit > 0 ? Math.min(Math.round((currentUsage / limit) * 100), 100) : 100;
  const isStorage = resourceType === "storage";

  const formatValue = (value) => {
    if (isStorage) return formatStorage(value);
    return value.toString();
  };

  const handleUpgrade = () => {
    onOpenChange?.(false);
    navigate("/organization/settings?tab=subscription");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 rounded-full bg-orange-500/10">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <AlertDialogTitle className="text-center">
            {config.description}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Your <span className="font-medium text-foreground capitalize">{currentPlan}</span> plan 
            allows up to {formatValue(limit)} {config.label.toLowerCase()}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Usage Display */}
        <div className="my-4 p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{config.label} Usage</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {percentage}%
            </span>
          </div>
          <Progress value={percentage} className="h-2 mb-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatValue(currentUsage)} used</span>
            <span>{formatValue(limit)} limit</span>
          </div>
        </div>

        {/* Upgrade Benefits */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Upgrade to {recommendedPlan}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {config.upgradeMessage} and unlock advanced features for your team.
          </p>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="w-full sm:w-auto">
            Maybe Later
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUpgrade}
            className="w-full sm:w-auto gap-2"
          >
            <ArrowUpRight className="h-4 w-4" />
            View Plans
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

/**
 * UpgradePromptBanner - Inline banner for limit warnings
 */
export const UpgradePromptBanner = ({
  resourceType = "users",
  currentUsage = 0,
  limit = 0,
  onUpgrade,
  onDismiss,
  className,
}) => {
  const config = resourceConfig[resourceType] || resourceConfig.users;
  const Icon = config.icon;
  const isStorage = resourceType === "storage";

  const percentage = limit > 0 ? Math.min(Math.round((currentUsage / limit) * 100), 100) : 100;
  const isLimitReached = percentage >= 100;

  const formatValue = (value) => {
    if (isStorage) return formatStorage(value);
    return value.toString();
  };

  if (percentage < 80) return null;

  return (
    <div
      className={cn(
        "relative flex items-center gap-4 p-4 rounded-lg border",
        isLimitReached 
          ? "bg-red-500/10 border-red-500/30" 
          : "bg-orange-500/10 border-orange-500/30",
        className
      )}
    >
      {/* Icon */}
      <div className={cn(
        "p-2 rounded-full shrink-0",
        isLimitReached ? "bg-red-500/20" : "bg-orange-500/20"
      )}>
        <Icon className={cn(
          "h-5 w-5",
          isLimitReached ? "text-red-500" : "text-orange-500"
        )} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium text-sm",
          isLimitReached ? "text-red-600" : "text-orange-600"
        )}>
          {isLimitReached 
            ? `${config.label} limit reached` 
            : `${config.label} limit warning`}
        </p>
        <p className="text-sm text-muted-foreground">
          {formatValue(currentUsage)} of {formatValue(limit)} {config.label.toLowerCase()} used ({percentage}%)
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant={isLimitReached ? "default" : "outline"}
          onClick={onUpgrade}
          className="gap-1"
        >
          <ArrowUpRight className="h-3 w-3" />
          Upgrade
        </Button>
        {onDismiss && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * UpgradePromptInline - Compact inline prompt for forms
 */
export const UpgradePromptInline = ({
  resourceType = "users",
  message,
  onUpgrade,
  className,
}) => {
  const config = resourceConfig[resourceType] || resourceConfig.users;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 p-3 rounded-lg",
        "bg-orange-500/10 border border-orange-500/30",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
        <span className="text-sm text-orange-600">
          {message || config.description}
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onUpgrade}
        className="shrink-0 gap-1 text-orange-600 border-orange-500/30 hover:bg-orange-500/10"
      >
        <ArrowUpRight className="h-3 w-3" />
        Upgrade
      </Button>
    </div>
  );
};

export default UpgradePrompt;
