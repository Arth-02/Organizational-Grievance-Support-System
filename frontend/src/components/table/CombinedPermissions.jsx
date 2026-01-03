import { useState } from "react";
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
import { Check, Settings2, X } from "lucide-react";
import { useSelector } from "react-redux";
import { useUpdateUserMutation } from "@/services/user.service";
import { useGetAllPermissionsQuery } from "@/services/user.service";
import { ScrollArea } from "@/components/ui/scroll-area";
import toast from "react-hot-toast";

const CombinedPermissions = ({
  rolePermissions = [],
  specialPermissions = [],
  userId,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  const handleOpenDialog = () => {
    setSelectedPermissions(specialPermissions.map((p) => p.slug));
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

  // Get available permissions (exclude role permissions for special permissions)
  const rolePermSlugs = rolePermissions.map((p) => p.slug);
  const availableForSpecial =
    allPermissionsData?.data?.filter((p) => !rolePermSlugs.includes(p.slug)) ||
    [];

  const allSelected = selectedPermissions.length === availableForSpecial.length;
  const noneSelected = selectedPermissions.length === 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-wrap gap-1 max-w-[200px]">
        {uniquePermissions.length === 0 ? (
          <span className="text-muted-foreground text-sm">No permissions</span>
        ) : uniquePermissions.length <= 2 ? (
          uniquePermissions.map((permission) => (
            <Badge
              key={permission.slug}
              variant={permission.source === "special" ? "default" : "secondary"}
              className="text-xs"
            >
              {permission.name}
            </Badge>
          ))
        ) : (
          <>
            <Badge variant="secondary" className="text-xs">
              {uniquePermissions[0].name}
            </Badge>
            <Badge variant="outline" className="text-xs">
              +{uniquePermissions.length - 1} more
            </Badge>
          </>
        )}
      </div>

      {canEditPermissions && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleOpenDialog}
            >
              <Settings2 size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Manage Permissions</TooltipContent>
        </Tooltip>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Special Permissions</DialogTitle>
            <DialogDescription>
              Click on permissions to toggle. Role permissions are inherited.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Role Permissions (read-only) */}
            {rolePermissions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  From Role (inherited)
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {rolePermissions.map((p) => (
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
            )}

            {/* Special Permissions (editable with clickable badges) */}
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
                    Remove All
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[250px] rounded-lg border p-3">
                <div className="flex flex-wrap gap-2">
                  {availableForSpecial.map((permission) => {
                    const isSelected = selectedPermissions.includes(
                      permission.slug
                    );
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
              </ScrollArea>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CombinedPermissions;
