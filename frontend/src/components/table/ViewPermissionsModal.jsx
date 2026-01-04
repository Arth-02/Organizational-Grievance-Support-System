import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { ScrollArea } from "@/components/ui/scroll-area";

const ViewPermissionsModal = ({ isOpen, onClose, permissions = [] }) => {
  // Helper function to extract category from permission name
  const getCategoryFromPermission = (permission) => {
    const parts = permission.name.split(" ");
    if (parts.length <= 1) return "General";

    const category = parts.slice(1).join(" ");
    // Normalize categories - group "Grievance Assignee" under "Grievance"
    if (category.toLowerCase().startsWith("grievance")) {
      return "Grievance";
    }
    return category;
  };

  // Group permissions by category (extracted from permission name)
  const groupedPermissions = useMemo(() => {
    const groups = {};
    permissions.forEach((permission) => {
      const category = getCategoryFromPermission(permission);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(permission);
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

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      title="View Permissions"
      description="Permissions assigned to this role"
      confirmText="Close"
      onConfirm={onClose}
      shoudlShowCancel={false}
      className="sm:max-w-[550px]"
    >
      <div className="space-y-4">
        {/* Stats bar */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-secondary/50 to-secondary/30 dark:from-secondary/30 dark:to-secondary/10 border border-secondary/50 dark:border-secondary/20">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {permissions.length}{" "}
              {permissions.length === 1 ? "Permission" : "Permissions"}
            </span>
          </div>
        </div>

        {/* Permissions grouped by category */}
        <ScrollArea className="h-[350px] -mr-5 pr-5">
          {permissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
              <Shield className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">No permissions assigned</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="space-y-2">
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
                        className="px-3 py-1.5 bg-secondary/50 dark:bg-secondary/30 cursor-default"
                      >
                        <span className="text-xs font-medium">
                          {permission.name}
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </Modal>
  );
};

export default ViewPermissionsModal;
