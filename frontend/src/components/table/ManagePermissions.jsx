import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Edit2, Eye, Plus, Shield, ShieldCheck } from "lucide-react";
import { useState } from "react";
import PermissionsModal from "./PermissionModal";
import toast from "react-hot-toast";
import ViewPermissionsModal from "./ViewPermissionsModal";
import { useSelector } from "react-redux";
import { useUpdateUserMutation } from "@/services/user.service";
import { useUpdateRoleMutation } from "@/services/role.service";
import { Button } from "@/components/ui/button";

const ManagePermissions = ({
  permissions,
  removePermissions = [],
  rolePermissions = [],
  isEditable = false,
  id = "none",
  edit = "none",
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();
  const [updateRole, { isLoading: isUpdatingRole }] = useUpdateRoleMutation();
  const userPermissions = useSelector((state) => state.user.permissions);

  const isUpdating = isUpdatingUser || isUpdatingRole;

  const handleEditPermissions = () => setIsModalOpen(true);
  const handleViewPermissions = () => setIsViewModalOpen(true);

  const hasEditPermission =
    (isEditable &&
      edit === "employee" &&
      (userPermissions.includes("UPDATE_USER")|| userPermissions.includes("UPDATE_PERMISSION"))) ||
    (isEditable && edit === "role" && userPermissions.includes("UPDATE_ROLE"));

  const handleSavePermissions = async (newPermissions) => {
    newPermissions = newPermissions.map((permission) => permission.slug);
    try {
      const data =
        edit === "employee"
          ? { special_permissions: newPermissions }
          : { permissions: newPermissions };

      const response =
        edit === "employee"
          ? await updateUser({ id, data }).unwrap()
          : await updateRole({ id, data }).unwrap();

      toast.success(response.message);
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update permissions.");
    }
  };

  // Get the display permissions (show first 2, then "+X more")
  const displayPermissions = permissions.slice(0, 1);
  const remainingCount = permissions.length - 1;

  return (
    <div className="min-w-[280px]">
      {permissions.length === 0 ? (
        hasEditPermission ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditPermissions}
                disabled={isUpdating}
                className="group border-dashed border-2 border-muted-foreground/30 hover:border-primary/50 bg-transparent hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-muted-foreground group-hover:text-primary transition-colors">
                  Add Permissions
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Click to add permissions</TooltipContent>
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
                {permissions.length}
              </span>
            </div>

            {displayPermissions.map((permission, index) => (
              <Badge
                key={permission.slug || index}
                variant="secondary"
                className="text-xs font-medium px-2.5 py-1 bg-secondary/50 dark:bg-secondary/30 hover:bg-secondary/70 dark:hover:bg-secondary/50 transition-colors cursor-default"
              >
                {permission.name}
              </Badge>
            ))}

            {remainingCount > 0 && (
              <Badge
                variant="outline"
                className="text-xs font-medium px-2 py-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={
                  hasEditPermission
                    ? handleEditPermissions
                    : handleViewPermissions
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
                  isUpdating ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={
                  hasEditPermission
                    ? handleEditPermissions
                    : handleViewPermissions
                }
                disabled={isUpdating}
              >
                {hasEditPermission ? (
                  <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {hasEditPermission ? "Edit Permissions" : "View Permissions"}
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {isModalOpen && (
        <PermissionsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialPermissions={permissions}
          removePermissions={removePermissions}
          rolePermissions={rolePermissions}
          onSave={handleSavePermissions}
          isLoading={isUpdating}
        />
      )}
      {isViewModalOpen && (
        <ViewPermissionsModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          permissions={permissions}
        />
      )}
    </div>
  );
};

export default ManagePermissions;
