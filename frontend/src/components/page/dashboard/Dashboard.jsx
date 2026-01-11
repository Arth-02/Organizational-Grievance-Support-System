import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  MessageSquareWarning,
  CheckSquare,
  FolderKanban,
  Users,
  Building,
  Briefcase,
  AlertCircle,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetDashboardStatsQuery } from "@/services/dashboard.service";
import { setGrievanceMyFilter } from "@/features/grievanceSlice";
import { cn } from "@/lib/utils";

// Greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

// Stat Card Component
const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  onClick,
  gradient,
  iconColor,
  isLoading,
}) => {
  const content = (
    <Card
      className={cn(
        "relative overflow-hidden border-border/50 transition-all duration-300",
        (href || onClick) && "hover:shadow-lg hover:border-primary/30 cursor-pointer group"
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          "absolute inset-0 opacity-50",
          gradient || "bg-gradient-to-br from-primary/5 to-transparent"
        )}
      />
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{value}</p>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div
            className={cn(
              "p-3 rounded-xl transition-transform duration-300",
              iconColor || "bg-primary/10 text-primary",
              (href || onClick) && "group-hover:scale-110"
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
        {(href || onClick) && (
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className="h-4 w-4 text-primary" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href && !onClick) {
    return <Link to={href}>{content}</Link>;
  }
  return content;
};

// Quick Action Button
const QuickAction = ({ icon: Icon, label, href, variant }) => (
  <Button
    asChild
    variant={variant || "outline"}
    className="h-auto py-3 px-4 flex flex-col items-center gap-2 hover:border-primary/50"
  >
    <Link to={href}>
      <Icon className="h-5 w-5" />
      <span className="text-xs font-medium">{label}</span>
    </Link>
  </Button>
);

// Welcome Section
const WelcomeSection = ({ userName, isLoading }) => (
  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 p-6">
    <div className="relative z-10">
      <p className="text-sm text-muted-foreground mb-1">{getGreeting()}</p>
      {isLoading ? (
        <Skeleton className="h-8 w-48 mb-2" />
      ) : (
        <h1 className="text-2xl font-bold text-foreground mb-1">
          {userName || "User"}
        </h1>
      )}
    </div>
    {/* Decorative elements */}
    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
    <div className="absolute bottom-0 left-1/2 w-24 h-24 rounded-full bg-primary/5 blur-xl" />
  </div>
);

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userPermissions = useSelector((state) => state.user.permissions);
  const { data, isLoading, isError } = useGetDashboardStatsQuery();
  const user = useSelector((state) => state.user.user);

  const stats = data?.data || {};

  const hasViewUser = userPermissions.includes("VIEW_USER");
  const hasViewDepartment = userPermissions.includes("VIEW_DEPARTMENT");
  const hasViewRole = userPermissions.includes("VIEW_ROLE");
  const hasViewProject = userPermissions.includes("VIEW_PROJECT");

  // Navigate to grievances with filter
  const navigateToGrievances = (filter) => {
    dispatch(setGrievanceMyFilter(filter));
    navigate("/grievances");
  };

  if (isError) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Failed to load dashboard</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Section */}
      <WelcomeSection
        userName={`${user?.firstname} ${user?.lastname}`}
        isLoading={isLoading}
      />

      {/* Quick Actions */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <QuickAction
              icon={MessageSquareWarning}
              label="New Grievance"
              href="/grievances/add"
              variant="default"
            />
            {hasViewProject && (
              <QuickAction
                icon={FolderKanban}
                label="View Projects"
                href="/projects"
              />
            )}
            {hasViewUser && (
              <QuickAction icon={Users} label="Employees" href="/employees" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* My Activity Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">My Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* My Grievances (Reported by me) */}
          <StatCard
            title="My Grievances"
            value={stats.grievances?.created || 0}
            subtitle={`${stats.grievances?.open || 0} open`}
            icon={MessageSquareWarning}
            onClick={() => navigateToGrievances("reported_by_me")}
            gradient="bg-gradient-to-br from-amber-500/10 to-transparent"
            iconColor="bg-amber-500/10 text-amber-500"
            isLoading={isLoading}
          />

          {/* Assigned Grievances */}
          <StatCard
            title="Assigned to Me"
            value={stats.grievances?.assigned || 0}
            subtitle="Grievances to review"
            icon={Clock}
            onClick={() => navigateToGrievances("assigned_to_me")}
            gradient="bg-gradient-to-br from-blue-500/10 to-transparent"
            iconColor="bg-blue-500/10 text-blue-500"
            isLoading={isLoading}
          />

          {/* Tasks */}
          <StatCard
            title="My Tasks"
            value={stats.tasks?.assigned || 0}
            subtitle={
              stats.tasks?.overdue > 0
                ? `${stats.tasks.overdue} overdue`
                : `${stats.tasks?.completed || 0} completed`
            }
            icon={CheckSquare}
            gradient="bg-gradient-to-br from-emerald-500/10 to-transparent"
            iconColor={
              stats.tasks?.overdue > 0
                ? "bg-red-500/10 text-red-500"
                : "bg-emerald-500/10 text-emerald-500"
            }
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Organization Overview - Only show if user has relevant permissions */}
      {(hasViewProject || hasViewUser || hasViewDepartment || hasViewRole) && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Organization Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {hasViewProject && stats.projects !== undefined && (
              <StatCard
                title="Projects"
                value={stats.projects?.total || 0}
                icon={FolderKanban}
                href="/projects"
                gradient="bg-gradient-to-br from-violet-500/10 to-transparent"
                iconColor="bg-violet-500/10 text-violet-500"
                isLoading={isLoading}
              />
            )}

            {hasViewUser && stats.employees !== undefined && (
              <StatCard
                title="Employees"
                value={stats.employees?.total || 0}
                icon={Users}
                href="/employees"
                gradient="bg-gradient-to-br from-cyan-500/10 to-transparent"
                iconColor="bg-cyan-500/10 text-cyan-500"
                isLoading={isLoading}
              />
            )}

            {hasViewDepartment && stats.departments !== undefined && (
              <StatCard
                title="Departments"
                value={stats.departments?.total || 0}
                icon={Building}
                href="/departments"
                gradient="bg-gradient-to-br from-orange-500/10 to-transparent"
                iconColor="bg-orange-500/10 text-orange-500"
                isLoading={isLoading}
              />
            )}

            {hasViewRole && stats.roles !== undefined && (
              <StatCard
                title="Roles"
                value={stats.roles?.total || 0}
                icon={Briefcase}
                href="/roles"
                gradient="bg-gradient-to-br from-pink-500/10 to-transparent"
                iconColor="bg-pink-500/10 text-pink-500"
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
