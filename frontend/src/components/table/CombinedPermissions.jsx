import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, Edit2, Eye, Plus, Shield, ShieldCheck, X } from "lucide-react";
import { useSelector } from "react-redux";
import { useUpdateUserMutation } from "@/services/user.service";
import { useGetAllPermissionsQuery } from "@/services/user.service";
import { ScrollArea } from "@/components/ui/scroll-area";
import toast from "react-hot-toast";

// Helper function to extract category from permission name
const getCategoryFromPermission = (permissionName) => {
  const parts = permissionName.split(" ");
  if (parts.length <= 1) return "General";
  const category = parts.slice(1).join(" ");
  // Normalize categories - group "Grievance Assignee" under "Grievance"
  if (category.toLowerCase().startsWith("grievance")) {
    return "Grievance";
  }
  return category;
};

const CombinedPermissions = ({
  rolePermissions = [],
  specialPermissions = [],
  userId,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [updateUser, { isLoading }] = useUpdateUserMutation();
  const { data: allPermissionsData } = useGetAllPermissionsQuery();

  const userPermissions = useSelector((state) => state.user.permissions);
  const canEditPermissions =
    userPermissions.includes("UPDATE_USER") ||
    userPermissions.includes("UPDATE_PERMISSION");

  // Combine all permissions for display
  const allUserPermissions = [
    ...rolePermissions.map((p) => ({ ...p, source: "role" })),
    ...specialPermissions.map((p) => ({ ...p, source: "special" })),
  ];

  // Remove duplicates by slug
  const uniquePermissions = allUserPermissions.filter(
    (p, index, self) => index === self.findIndex((t) => t.slug === p.slug)
  );

  // Get available permissions (exclude role permissions for special permissions)
  const availableForSpecial = useMemo(() => {
    const rolePermSlugs = rolePermissions.map((p) => p.slug);
    return (
      allPermissionsData?.data?.filter((p) => !rolePermSlugs.includes(p.slug)) ||
      []
    );
  }, [allPermissionsData?.data, rolePermissions]);

  // Group available permissions by category
  const groupedAvailablePermissions = useMemo(() => {
    const groups = {};
    availableForSpecial.forEach((permission) => {
      const category = getCategoryFromPermission(permission.name);
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
  }, [availableForSpecial]);

  // Group role permissions by category
  const groupedRolePermissions = useMemo(() => {
    const groups = {};
    rolePermissions.forEach((permission) => {
      const category = getCategoryFromPermission(permission.name);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(permission);
    });
    const sortedGroups = {};
    Object.keys(groups)
      .sort()
      .forEach((key) => {
        sortedGroups[key] = groups[key].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      });
    return sortedGroups;
  }, [rolePermissions]);

  const handleOpenDialog = (viewOnly = false) => {
    setSelectedPermissions(specialPermissions.map((p) => p.slug));
    setIsViewMode(viewOnly);
    setIsDialogOpen(true);
  };

  const handleTogglePermission = (slug) => {
    setSelectedPermissions((prev) =>
      prev.includes(slug)
        ? prev.filter((p) => p !== slug)
        : [...prev, slug]
    );
  };

  const handleSelectAll = () => {
    setSelectedPermissions(availableForSpecial.map((p) => p.slug));
  };

  const handleRemoveAll = () => {
    setSelectedPermissions([]);
  };

  const handleSave = async () => {
    try {
      const response = await updateUser({
        id: userId,
        data: { special_permissions: selectedPermissions },
      }).unwrap();
      toast.success(response.message || "Permissions updated successfully");
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update permissions");
    }
  };

  const allSelected = selectedPermissions.length === availableForSpecial.length;
  const noneSelected = selectedPermissions.length === 0;

  // Display logic - show first 2, then "+X more"
  const displayPermissions = uniquePermissions.slice(0, 2);
  const remainingCount = uniquePermissions.length - 2;

  return (
    <div className="min-w-[280px]">
      {uniquePermissions.length === 0 ? (
        canEditPermissions ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenDialog(false)}
                disabled={isLoading}
                className="group border-dashed border-2 border-muted-foreground/30 hover:border-primary/50 bg-transparent hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-muted-foreground group-hover:text-primary transition-colors">
                  Add Permissions
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Click to add special permissions</TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-4 w-4 opacity-50" />
            <span className="text-sm italic">No permissions</span>
          </div>
        )
      ) : (
        <div className="flex items-center gap-2">
          {/* Permission badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border border-primary/20">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">
                {uniquePermissions.length}
              </span>
            </div>

            {displayPermissions.map((permission, index) => (
              <Badge
                key={permission.slug || index}
                variant={permission.source === "special" ? "default" : "secondary"}
                className="text-xs font-medium px-2.5 py-1 bg-secondary/50 dark:bg-secondary/30 hover:bg-secondary/70 dark:hover:bg-secondary/50 transition-colors cursor-default"
              >
                {permission.name}
              </Badge>
            ))}

            {remainingCount > 0 && (
              <Badge
                variant="outline"
                className="text-xs font-medium px-2 py-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={() =>
                  handleOpenDialog(!canEditPermissions)
                }
              >
                +{remainingCount} more
              </Badge>
            )}
          </div>

          {/* Action button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 transition-all duration-200 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={() => handleOpenDialog(!canEditPermissions)}
                disabled={isLoading}
              >
                {canEditPermissions ? (
                  <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {canEditPermissions ? "Edit Permissions" : "View Permissions"}
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {isViewMode ? "View Permissions" : "Manage Special Permissions"}
            </DialogTitle>
            <DialogDescription>
              {isViewMode
                ? "Permissions assigned to this user"
                : "Click on permissions to toggle. Role permissions are inherited."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Role Permissions (read-only) */}
            {rolePermissions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    From Role (inherited) · {rolePermissions.length}
                  </h4>
                </div>
                <ScrollArea className="max-h-[150px] rounded-lg border p-3">
                  <div className="space-y-3">
                    {Object.entries(groupedRolePermissions).map(([category, perms]) => (
                      <div key={category} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {category}
                          </span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {perms.map((p) => (
                            <Badge
                              key={p.slug}
                              variant="secondary"
                              className="text-xs py-1 px-2"
                            >
                              {p.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Special Permissions */}
            {!isViewMode && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">
                    Special Permissions
                    {selectedPermissions.length > 0 && (
                      <span className="ml-2 text-muted-foreground font-normal">
                        ({selectedPermissions.length} selected)
                      </span>
                    )}
                  </h4>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={handleSelectAll}
                      disabled={allSelected}
                      className="text-xs"
                    >
                      <Check size={12} className="mr-1" />
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={handleRemoveAll}
                      disabled={noneSelected}
                      className="text-xs"
                    >
                      <X size={12} className="mr-1" />
                      Clear All
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[250px] rounded-lg border p-3">
                  {Object.keys(groupedAvailablePermissions).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                      <Shield className="h-10 w-10 mb-2 opacity-30" />
                      <p className="text-sm">All permissions are included in the role</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(groupedAvailablePermissions).map(([category, perms]) => (
                        <div key={category} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {category}
                            </span>
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-xs text-muted-foreground">{perms.length}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {perms.map((permission) => {
                              const isSelected = selectedPermissions.includes(permission.slug);
                              return (
                                <Badge
                                  key={permission.slug}
                                  variant={isSelected ? "default" : "outline"}
                                  className={`cursor-pointer py-1.5 px-3 text-sm transition-all ${
                                    isSelected
                                      ? "bg-primary hover:bg-primary/90"
                                      : "hover:bg-muted"
                                  }`}
                                  onClick={() => handleTogglePermission(permission.slug)}
                                >
                                  {isSelected && <Check size={12} className="mr-1.5" />}
                                  {permission.name}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            {/* View-only special permissions */}
            {isViewMode && specialPermissions.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">
                  Special Permissions · {specialPermissions.length}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {specialPermissions.map((p) => (
                    <Badge key={p.slug} variant="default" className="text-xs py-1 px-2">
                      {p.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              {isViewMode ? "Close" : "Cancel"}
            </Button>
            {!isViewMode && (
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CombinedPermissions;

