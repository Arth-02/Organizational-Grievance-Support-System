import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Edit2,Eye } from "lucide-react";
import { useState } from "react";
import PermissionsModal from "./PermissionModal";
import { useUpdateRoleMutation, useUpdateUserMutation } from "@/services/api.service";
import toast from "react-hot-toast";
import ViewPermissionsModal from "./ViewPermissionsModal";
import { useSelector } from "react-redux";

const ManagePermissions = ({ permissions, removePermissions=[], isEditable=false, id="none", edit="none" }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();
  const [updateRole, { isLoading: isUpdatingRole }] = useUpdateRoleMutation();
  const handleEditPermissions = () => {
    setIsModalOpen(true);
  };
  const userPermissions = useSelector((state) => state.user.permissions);



  const handleSavePermissions = async (newPermissions) => {
    newPermissions = newPermissions.map((permission) => permission.slug);
    try {
      if (edit === "employee") {
        const data = { special_permissions: newPermissions };
        const response = await updateUser({ id, data }).unwrap();
        toast.success(response.message);
        setIsModalOpen(false);
      } else if (edit === "role") {
        const data = { permissions: newPermissions };
        const response = await updateRole({ id, data }).unwrap();
        toast.success(response.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to update permissions.");
    }
  };

  return (
    <div>
      {permissions.length === 0 && <div className="text-center">-</div>}
      {permissions.length > 0 && (
        <div className="relative group flex items-center">
          <div
            className={`max-w-64 overflow-hidden text-ellipsis text-nowrap group-hover:pr-2 transition-all duration-200`}
          >
            {permissions.map((permission) => permission.name).join(", ")}
          </div>
          {((isEditable && edit==="employee" && userPermissions.includes("UPDATE_USER"))||(isEditable && edit==="role" && userPermissions.includes("UPDATE_ROLE")))? (
            <Tooltip>
              <TooltipTrigger>
                <Edit2
                  onClick={handleEditPermissions}
                  size={30}
                  className={`cursor-pointer p-[6px] rounded-md hover:bg-primary/10 hover:text-primary transition-all duration-200 ease-in ${
                    isUpdatingRole|| isUpdatingUser ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isUpdatingRole|| isUpdatingUser} // Disable button while updating
                />
              </TooltipTrigger>
              <TooltipContent>Edit Permissions</TooltipContent>
            </Tooltip>
          ):(
            <Tooltip>
              <TooltipTrigger>
                <Eye
                  onClick={() => setIsViewModalOpen(true)}
                  size={30}
                  className={`cursor-pointer p-[6px] rounded-md hover:bg-primary/10 hover:text-primary transition-all duration-200 ease-in ${
                    isUpdatingRole|| isUpdatingUser ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isUpdatingRole|| isUpdatingUser} // Disable button while updating
                />
              </TooltipTrigger>
              <TooltipContent>View Permissions</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
      {isModalOpen && (
        <PermissionsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialPermissions={permissions}
          removePermissions={removePermissions}
          onSave={handleSavePermissions}
          isLoading={isUpdatingRole|| isUpdatingUser} // Pass loading state to modal
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
