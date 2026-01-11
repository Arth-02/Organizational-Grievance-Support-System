import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
  Plus,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

// Simple Stat Card Component
const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  onClick,
  iconColor,
  isLoading,
}) => {
  const content = (
    <Card
      className={cn(
        "border-border/50 transition-all duration-200",
        (href || onClick) && "hover:border-primary/50 hover:shadow-md cursor-pointer group"
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
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
              "p-2.5 rounded-xl transition-transform duration-200",
              iconColor || "bg-muted text-muted-foreground",
              (href || onClick) && "group-hover:scale-105"
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.5} />
          </div>
        </div>
        
        {(href || onClick) && (
          <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground group-hover:text-primary transition-colors">
            <span>View details</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href && !onClick) {
    return <Link to={href} className="block">{content}</Link>;
  }
  return content;
};

// Welcome Section - Simpler design
const WelcomeSection = ({ userName, isLoading }) => (
  <div className="flex items-center justify-between gap-4 pb-2">
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm text-muted-foreground">{getGreeting()}</span>
        <Sparkles className="h-3.5 w-3.5 text-primary/60" />
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-48" />
      ) : (
        <h1 className="text-2xl font-bold tracking-tight">
          {userName || "User"}
        </h1>
      )}
    </div>
  </div>
);

// Section Header
const SectionHeader = ({ title }) => (
  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
    {title}
  </h2>
);

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const userPermissions = useSelector((state) => state.user.permissions);
  const { data, isLoading, isError } = useGetDashboardStatsQuery();
  const user = useSelector((state) => state.user.user);

  const stats = data?.data || {};

  const hasViewUser = userPermissions.includes("VIEW_USER");
  const hasViewDepartment = userPermissions.includes("VIEW_DEPARTMENT");
  const hasViewRole = userPermissions.includes("VIEW_ROLE");
  const hasViewProject = userPermissions.includes("VIEW_PROJECT");

  const navigateToGrievances = (filter) => {
    dispatch(setGrievanceMyFilter(filter));
    navigate("/grievances");
  };

  if (isError) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-muted-foreground">Failed to load dashboard</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Section */}
      <WelcomeSection
        userName={`${user?.firstname || ""} ${user?.lastname || ""}`.trim()}
        isLoading={isLoading}
      />

      {/* Quick Actions - Subtle card design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* New Grievance - Primary action */}
        <Link 
          to="/grievances/add" 
          state={{ background: location }}
          className="group relative rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">New Grievance</p>
              <p className="text-xs text-muted-foreground">Report an issue</p>
            </div>
          </div>
          <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        {hasViewProject && (
          <Link 
            to="/projects"
            className="group relative rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <FolderKanban className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">Projects</p>
                <p className="text-xs text-muted-foreground">View all projects</p>
              </div>
            </div>
            <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        )}

        {hasViewUser && (
          <Link 
            to="/employees"
            className="group relative rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">Employees</p>
                <p className="text-xs text-muted-foreground">Manage team</p>
              </div>
            </div>
            <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        )}

        {hasViewDepartment && (
          <Link 
            to="/departments"
            className="group relative rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">Departments</p>
                <p className="text-xs text-muted-foreground">View structure</p>
              </div>
            </div>
            <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        )}
      </div>

      {/* My Activity Section */}
      <div>
        <SectionHeader title="My Activity" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="My Grievances"
            value={stats.grievances?.created || 0}
            subtitle={stats.grievances?.open > 0 ? `${stats.grievances.open} open` : "All resolved"}
            icon={MessageSquareWarning}
            onClick={() => navigateToGrievances("reported_by_me")}
            iconColor="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            isLoading={isLoading}
          />

          <StatCard
            title="Assigned to Me"
            value={stats.grievances?.assigned || 0}
            subtitle="Grievances to review"
            icon={Clock}
            onClick={() => navigateToGrievances("assigned_to_me")}
            iconColor="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            isLoading={isLoading}
          />

          <StatCard
            title="My Tasks"
            value={stats.tasks?.assigned || 0}
            subtitle={
              stats.tasks?.overdue > 0
                ? `${stats.tasks.overdue} overdue`
                : `${stats.tasks?.completed || 0} completed`
            }
            icon={CheckSquare}
            iconColor={
              stats.tasks?.overdue > 0
                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Organization Overview */}
      {(hasViewProject || hasViewUser || hasViewDepartment || hasViewRole) && (
        <div>
          <SectionHeader title="Organization" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {hasViewProject && stats.projects !== undefined && (
              <StatCard
                title="Projects"
                value={stats.projects?.total || 0}
                icon={FolderKanban}
                href="/projects"
                iconColor="bg-violet-500/10 text-violet-600 dark:text-violet-400"
                isLoading={isLoading}
              />
            )}

            {hasViewUser && stats.employees !== undefined && (
              <StatCard
                title="Employees"
                value={stats.employees?.total || 0}
                icon={Users}
                href="/employees"
                iconColor="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                isLoading={isLoading}
              />
            )}

            {hasViewDepartment && stats.departments !== undefined && (
              <StatCard
                title="Departments"
                value={stats.departments?.total || 0}
                icon={Building}
                href="/departments"
                iconColor="bg-orange-500/10 text-orange-600 dark:text-orange-400"
                isLoading={isLoading}
              />
            )}

            {hasViewRole && stats.roles !== undefined && (
              <StatCard
                title="Roles"
                value={stats.roles?.total || 0}
                icon={Briefcase}
                href="/roles"
                iconColor="bg-pink-500/10 text-pink-600 dark:text-pink-400"
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
