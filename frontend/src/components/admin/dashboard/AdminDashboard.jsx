import { Building2, Users, Shield, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatsCard from "./StatsCard";
import RecentActivity from "./RecentActivity";
import PendingApprovals from "./PendingApprovals";
import {
  useGetDashboardStatsQuery,
  useGetRecentActivityQuery,
  useGetAdminOrganizationsQuery,
} from "@/services/admin.service";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery();
  const { data: activityData, isLoading: activityLoading } = useGetRecentActivityQuery(10);
  const { data: orgsData, isLoading: orgsLoading } = useGetAdminOrganizationsQuery({ limit: 50 });

  const stats = statsData?.data || {};
  const activities = activityData?.data || [];
  const organizations = orgsData?.data?.organizations || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your organization management system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => navigate("/admin/organizations")} className="cursor-pointer">
          <StatsCard
            title="Total Organizations"
            value={statsLoading ? "..." : stats.organizations?.total || 0}
            subtitle={`${stats.organizations?.pending || 0} pending approval`}
            icon={Building2}
          />
        </div>
        <div onClick={() => navigate("/admin/users")} className="cursor-pointer">
          <StatsCard
            title="Total Users"
            value={statsLoading ? "..." : stats.users?.total || 0}
            subtitle={`${stats.users?.active || 0} active users`}
            icon={Users}
          />
        </div>
        <div onClick={() => navigate("/admin/roles")} className="cursor-pointer">
          <StatsCard
            title="Total Roles"
            value={statsLoading ? "..." : stats.roles?.total || 0}
            subtitle={`${stats.departments?.total || 0} departments`}
            icon={Shield}
          />
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div onClick={() => navigate("/admin/organizations?is_approved=false")} className="cursor-pointer">
          <StatsCard
            title="Pending Approvals"
            value={statsLoading ? "..." : stats.organizations?.pending || 0}
            icon={Clock}
            className="bg-yellow-500/5 border-yellow-500/20"
          />
        </div>
        <div onClick={() => navigate("/admin/organizations?is_approved=true")} className="cursor-pointer">
          <StatsCard
            title="Approved Organizations"
            value={statsLoading ? "..." : stats.organizations?.approved || 0}
            icon={CheckCircle}
            className="bg-green-500/5 border-green-500/20"
          />
        </div>
        <div onClick={() => navigate("/admin/grievances")} className="cursor-pointer">
          <StatsCard
            title="Total Grievances"
            value={statsLoading ? "..." : stats.grievances?.total || 0}
            icon={AlertTriangle}
          />
        </div>
      </div>

      {/* Activity and Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity activities={activities} isLoading={activityLoading} />
        <PendingApprovals organizations={organizations} isLoading={orgsLoading} />
      </div>
    </div>
  );
};

export default AdminDashboard;
