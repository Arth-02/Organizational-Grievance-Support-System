import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import MainLayout from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Building,
  Building2,
  Calendar,
  Clock,
  IdCard,
  KeyRound,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCog,
} from "lucide-react";
import ChangePasswordModal from "./ChangePasswordModal";
import ChangeEmailModal from "./ChangeEmailModal";

const Profile = () => {
  const user = useSelector((state) => state.user.user);
  const role = useSelector((state) => state.user.role);
  const department = useSelector((state) => state.user.department);
  const permissions = useSelector((state) => state.user.permissions);

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);

  // Helper function to extract category from permission name
  const getCategoryFromPermission = (permissionSlug) => {
    // Convert slug to readable format: VIEW_USER -> View User
    const name = permissionSlug
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");

    const parts = name.split(" ");
    if (parts.length <= 1) return "General";

    const category = parts.slice(1).join(" ");
    // Normalize categories - group "Grievance Assignee" under "Grievance"
    if (category.toLowerCase().startsWith("grievance")) {
      return "Grievance";
    }
    return category;
  };

  // Group permissions by category
  const groupedPermissions = useMemo(() => {
    const groups = {};
    permissions.forEach((permissionSlug) => {
      const category = getCategoryFromPermission(permissionSlug);
      if (!groups[category]) {
        groups[category] = [];
      }
      // Convert slug to readable name
      const name = permissionSlug
        .split("_")
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(" ");
      groups[category].push({ slug: permissionSlug, name });
    });

    // Sort categories alphabetically
    const sortedGroups = {};
    Object.keys(groups)
      .sort()
      .forEach((key) => {
        sortedGroups[key] = groups[key].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      });

    return sortedGroups;
  }, [permissions]);

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (user?.firstname && user?.lastname) {
      return `${user.firstname[0]}${user.lastname[0]}`.toUpperCase();
    }
    return user?.username?.[0]?.toUpperCase() || "U";
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const InfoItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 py-2">
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 dark:bg-primary/20">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value || "-"}</p>
      </div>
    </div>
  );

  return (
    <MainLayout title="My Profile">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold">
                  {user?.firstname && user?.lastname
                    ? `${user.firstname} ${user.lastname}`
                    : user?.username}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  @{user?.username}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/20"
                  >
                    <UserCog className="h-3 w-3 mr-1" />
                    {role?.name || "No Role"}
                  </Badge>
                  {user?.is_active ? (
                    <Badge
                      variant="secondary"
                      className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                    >
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                    >
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoItem
                icon={Building}
                label="Organization"
                value={user?.organization_id?.name}
              />
              <Separator />
              <InfoItem icon={Mail} label="Email" value={user?.email} />
              <Separator />
              <InfoItem
                icon={Phone}
                label="Phone"
                value={user?.phone_number}
              />
              <Separator />
              <InfoItem
                icon={IdCard}
                label="Employee ID"
                value={user?.employee_id}
              />
              <Separator />
              <InfoItem
                icon={Building2}
                label="Department"
                value={department?.name}
              />
              <Separator />
              <InfoItem
                icon={Calendar}
                label="Joined"
                value={formatDate(user?.created_at)}
              />
              <Separator />
              <InfoItem
                icon={Clock}
                label="Last Login"
                value={formatDateTime(user?.last_login)}
              />
            </CardContent>
          </Card>

          {/* Account Actions Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowChangeEmailModal(true)}
              >
                <Mail className="h-4 w-4 mr-2" />
                Change Email
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowChangePasswordModal(true)}
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Permissions */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    My Permissions
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Permissions granted through your role and special
                    assignments
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border border-primary/20">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">
                    {permissions.length}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Permission source info */}
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 dark:bg-secondary/30">
                  <UserCog className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">
                      {user?.role?.permissions?.length || 0}
                    </span>{" "}
                    from Role
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 dark:bg-secondary/30">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">
                      {user?.special_permissions?.length || 0}
                    </span>{" "}
                    Special
                  </span>
                </div>
              </div>

              {/* Permissions grouped by category */}
              <ScrollArea className="h-[450px] -mr-4 pr-4">
                {permissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                    <Shield className="h-16 w-16 mb-4 opacity-30" />
                    <p className="text-base font-medium">
                      No permissions assigned
                    </p>
                    <p className="text-sm mt-1">
                      Contact your administrator for access
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {Object.entries(groupedPermissions).map(
                      ([category, perms]) => (
                        <div key={category} className="space-y-2.5">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {category}
                            </h4>
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-xs text-muted-foreground">
                              {perms.length}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {perms.map((permission) => (
                              <Badge
                                key={permission.slug}
                                variant="secondary"
                                className="px-3 py-1.5 bg-secondary/50 dark:bg-secondary/30 cursor-default transition-colors hover:bg-secondary/70 dark:hover:bg-secondary/50"
                              >
                                <span className="text-xs font-medium">
                                  {permission.name}
                                </span>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
      <ChangeEmailModal
        isOpen={showChangeEmailModal}
        onClose={() => setShowChangeEmailModal(false)}
        currentEmail={user?.email}
      />
    </MainLayout>
  );
};

export default Profile;

