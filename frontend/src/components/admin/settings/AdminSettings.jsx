import { useState } from "react";
import { useSelector } from "react-redux";
import { 
  User, 
  Shield, 
  Database, 
  Trash2, 
  AlertTriangle,
  Server,
  Clock,
  CheckCircle,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import toast from "react-hot-toast";
import { 
  useGetDashboardStatsQuery,
  useGetAuditLogStatsQuery,
  useClearOldAuditLogsMutation 
} from "@/services/admin.service";

const AdminSettings = () => {
  const user = useSelector((state) => state.user.user);
  const role = useSelector((state) => state.user.role);
  const { data: statsData } = useGetDashboardStatsQuery();
  const { data: auditStatsData } = useGetAuditLogStatsQuery();
  const [clearAuditLogs, { isLoading: isClearing }] = useClearOldAuditLogsMutation();
  
  const [daysToKeep, setDaysToKeep] = useState(30);
  
  const stats = statsData?.data || {};
  const auditStats = auditStatsData?.data || {};

  const handleClearAuditLogs = async () => {
    try {
      await clearAuditLogs({ daysToKeep }).unwrap();
      toast.success(`Audit logs older than ${daysToKeep} days have been cleared.`);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to clear audit logs");
    }
  };

  const systemInfo = [
    { label: "Total Organizations", value: stats.organizations?.total || 0, icon: Database },
    { label: "Total Users", value: stats.users?.total || 0, icon: User },
    { label: "Total Audit Logs", value: auditStats.totalLogs || 0, icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your admin account and system settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Admin Profile
            </CardTitle>
            <CardDescription>Your admin account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {user?.username?.[0]?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{user?.username}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <Badge variant="default" className="mt-1">
                  <Shield className="h-3 w-3 mr-1" />
                  {role?.name || "DEV"}
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="grid gap-3">
              <div>
                <Label className="text-muted-foreground text-xs">Organization</Label>
                <p className="text-sm">{user?.organization_id?.name || "Platform Admin"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Role</Label>
                <p className="text-sm">{role?.name || "DEV"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Account Status</Label>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Active
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Overview
            </CardTitle>
            <CardDescription>Platform statistics at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {systemInfo.map((item, index) => (
                <div key={index} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <item.icon className="h-4 w-4" />
                    <span className="text-xs">{item.label}</span>
                  </div>
                  <p className="text-2xl font-bold">{item.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Platform Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground">Platform Name</p>
              <p className="font-semibold">Grievance Support System</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground">Version</p>
              <p className="font-semibold">1.0.0</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground">Environment</p>
              <Badge variant="outline">Development</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions. Please proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Clear Old Audit Logs */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
            <div className="space-y-1">
              <p className="font-medium">Clear Old Audit Logs</p>
              <p className="text-sm text-muted-foreground">
                Remove audit logs older than specified days to free up database space.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Label htmlFor="daysToKeep" className="text-sm">Keep logs from last</Label>
                <Input
                  id="daysToKeep"
                  type="number"
                  min="7"
                  max="365"
                  value={daysToKeep}
                  onChange={(e) => setDaysToKeep(parseInt(e.target.value) || 30)}
                  className="w-20 h-8"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isClearing}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isClearing ? "Clearing..." : "Clear Logs"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Old Audit Logs?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all audit logs older than {daysToKeep} days.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAuditLogs}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Clear Logs
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
