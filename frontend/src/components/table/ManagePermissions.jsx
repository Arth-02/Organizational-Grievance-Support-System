import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Edit2, Eye, SquarePlus } from "lucide-react";
import { useState } from "react";
import PermissionsModal from "./PermissionModal";
import toast from "react-hot-toast";
import ViewPermissionsModal from "./ViewPermissionsModal";
import { useSelector } from "react-redux";
import { useUpdateUserMutation } from "@/services/user.service";
import { useUpdateRoleMutation } from "@/services/role.service";

const ManagePermissions = ({
  permissions,
  removePermissions = [],
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

  // Render the action button (Edit or View)
  const renderActionButton = (IconComponent, tooltipText, onClickHandler) => (
    <Tooltip>
      <TooltipTrigger>
        <IconComponent
          onClick={onClickHandler}
          size={30}
          className={`cursor-pointer p-[6px] rounded-md text-black dark:text-white/50 hover:bg-primary/10 dark:hover:bg-secondary/30 hover:text-primary transition-all duration-200 ease-in ${
            isUpdating ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isUpdating}
        />
      </TooltipTrigger>
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  );

  return (
    <div>
      {permissions.length === 0 ? (
        hasEditPermission ? (
          <div className="w-60 flex items-center justify-center">
            {renderActionButton(SquarePlus, "Add Permissions", handleEditPermissions)}
          </div>
        ) : (
          <div className="text-center">-</div>
        )
      ) : (
        <div className="relative group flex items-center">
          <div
            className={`w-60 overflow-hidden text-ellipsis text-nowrap pr-1 transition-all duration-200`}
          >
            {permissions.map((permission) => permission.name).join(", ")}
          </div>
          {hasEditPermission
            ? renderActionButton(Edit2, "Edit Permissions", handleEditPermissions)
            : renderActionButton(Eye, "View Permissions", handleViewPermissions)}
        </div>
      )}

      {isModalOpen && (
        <PermissionsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialPermissions={permissions}
          removePermissions={removePermissions}
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
