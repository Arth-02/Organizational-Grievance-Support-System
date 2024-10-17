// import {
//   Tooltip,
//   TooltipContent,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
// import { Edit2, Eye, SquarePlus } from "lucide-react";
// import { useState } from "react";
// import PermissionsModal from "./PermissionModal";
// import {
//   useUpdateRoleMutation,
//   useUpdateUserMutation,
// } from "@/services/api.service";
// import toast from "react-hot-toast";
// import ViewPermissionsModal from "./ViewPermissionsModal";
// import { useSelector } from "react-redux";

// const ManagePermissions = ({
//   permissions,
//   removePermissions = [],
//   isEditable = false,
//   id = "none",
//   edit = "none",
// }) => {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isViewModalOpen, setIsViewModalOpen] = useState(false);
//   const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();
//   const [updateRole, { isLoading: isUpdatingRole }] = useUpdateRoleMutation();
//   const handleEditPermissions = () => {
//     setIsModalOpen(true);
//   };
//   const userPermissions = useSelector((state) => state.user.permissions);

//   const handleSavePermissions = async (newPermissions) => {
//     newPermissions = newPermissions.map((permission) => permission.slug);
//     try {
//       if (edit === "employee") {
//         const data = { special_permissions: newPermissions };
//         const response = await updateUser({ id, data }).unwrap();
//         toast.success(response.message);
//         setIsModalOpen(false);
//       } else if (edit === "role") {
//         const data = { permissions: newPermissions };
//         const response = await updateRole({ id, data }).unwrap();
//         toast.success(response.message);
//       }
//     } catch (error) {
//       console.log(error);
//       toast.error("Failed to update permissions.");
//     }
//   };

//   return (
//     <div>

//       {permissions.length === 0 && (
//         ((isEditable &&
//           edit === "employee" &&
//           userPermissions.includes("UPDATE_USER")) ||
//         (isEditable &&
//           edit === "role" &&
//           userPermissions.includes("UPDATE_ROLE"))) ? (
//             <Tooltip>
//               <TooltipTrigger>
//                 <div className="w-60 flex items-center justify-center">
//                 <SquarePlus
//                   onClick={handleEditPermissions}
//                   size={30}
//                   className={`cursor-pointer p-[6px] items-center rounded-md text-black/50 hover:bg-primary/10 hover:text-primary transition-all duration-200 ease-in ${
//                     isUpdatingRole || isUpdatingUser
//                       ? "opacity-50 cursor-not-allowed"
//                       : ""
//                   }`}
//                   disabled={isUpdatingRole || isUpdatingUser} // Disable button while updating
//                 />
//                 </div>
//               </TooltipTrigger>
//               <TooltipContent>Add Permissions</TooltipContent>
//             </Tooltip>
//           ):(
//             <div className="text-center">-</div>
//           )
//       )}

//       {permissions.length > 0 && (
//         <div className="relative group flex items-center">
//           <div
//             className={`w-60 overflow-hidden text-ellipsis text-nowrap pr-1 transition-all duration-200`}
//           >
//             {permissions.map((permission) => permission.name).join(", ")}
//           </div>
//           {(isEditable &&
//             edit === "employee" &&
//             userPermissions.includes("UPDATE_USER")) ||
//           (isEditable &&
//             edit === "role" &&
//             userPermissions.includes("UPDATE_ROLE")) ? (
//             <Tooltip>
//               <TooltipTrigger>
//                 <Edit2
//                   onClick={handleEditPermissions}
//                   size={30}
//                   className={`cursor-pointer p-[6px] rounded-md text-black/50 hover:bg-primary/10 hover:text-primary transition-all duration-200 ease-in ${
//                     isUpdatingRole || isUpdatingUser
//                       ? "opacity-50 cursor-not-allowed"
//                       : ""
//                   }`}
//                   disabled={isUpdatingRole || isUpdatingUser} // Disable button while updating
//                 />
//               </TooltipTrigger>
//               <TooltipContent>Edit Permissions</TooltipContent>
//             </Tooltip>
//           ) : (
//             <Tooltip>
//               <TooltipTrigger>
//                 <Eye
//                   onClick={() => setIsViewModalOpen(true)}
//                   size={30}
//                   className={`cursor-pointer p-[6px] rounded-md text-black/50 hover:bg-primary/10 hover:text-primary transition-all duration-200 ease-in ${
//                     isUpdatingRole || isUpdatingUser
//                       ? "opacity-50 cursor-not-allowed"
//                       : ""
//                   }`}
//                   disabled={isUpdatingRole || isUpdatingUser} // Disable button while updating
//                 />
//               </TooltipTrigger>
//               <TooltipContent>View Permissions</TooltipContent>
//             </Tooltip>
//           )}
//         </div>
//       )}
//       {isModalOpen && (
//         <PermissionsModal
//           isOpen={isModalOpen}
//           onClose={() => setIsModalOpen(false)}
//           initialPermissions={permissions}
//           removePermissions={removePermissions}
//           onSave={handleSavePermissions}
//           isLoading={isUpdatingRole || isUpdatingUser} // Pass loading state to modal
//         />
//       )}
//       {isViewModalOpen && (
//         <ViewPermissionsModal
//           isOpen={isViewModalOpen}
//           onClose={() => setIsViewModalOpen(false)}
//           permissions={permissions}
//         />
//       )}
//     </div>
//   );
// };

// export default ManagePermissions;

import { useState, useCallback, memo } from "react";
import { useSelector } from "react-redux";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Edit2, Eye, SquarePlus } from "lucide-react";
import {
  useUpdateRoleMutation,
  useUpdateUserMutation,
} from "@/services/api.service";
import { toast } from "react-hot-toast";
import PermissionsModal from "./PermissionModal";
import ViewPermissionsModal from "./ViewPermissionsModal";

// Separate component for action button
const ActionButton = memo(
  ({ icon: Icon, onClick, tooltip, disabled, className }) => (
    <Tooltip>
      <TooltipTrigger>
        <Icon
          onClick={onClick}
          size={30}
          className={`cursor-pointer p-[6px] rounded-md text-black/50 hover:bg-primary/10 hover:text-primary transition-all duration-200 ease-in ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          } ${className}`}
          disabled={disabled}
        />
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
);

ActionButton.displayName = "ActionButton";

const ManagePermissions = ({
  permissions = [],
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

  const isLoading = isUpdatingRole || isUpdatingUser;
  const canEditUser =
    isEditable &&
    edit === "employee" &&
    userPermissions.includes("UPDATE_USER");
  const canEditRole =
    isEditable && edit === "role" && userPermissions.includes("UPDATE_ROLE");
  const canEdit = canEditUser || canEditRole;

  const handleEditPermissions = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleSavePermissions = useCallback(
    async (newPermissions) => {
      const permissionSlugs = newPermissions.map(
        (permission) => permission.slug
      );

      try {
        let response;

        if (edit === "employee") {
          response = await updateUser({
            id,
            data: { special_permissions: permissionSlugs },
          }).unwrap();
        } else if (edit === "role") {
          response = await updateRole({
            id,
            data: { permissions: permissionSlugs },
          }).unwrap();
        }

        toast.success(response.message);
        setIsModalOpen(false);
      } catch (error) {
        console.error("Failed to update permissions:", error);
        toast.error("Failed to update permissions.");
      }
    },
    [edit, id, updateUser, updateRole]
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleCloseViewModal = useCallback(() => {
    setIsViewModalOpen(false);
  }, []);

  if (permissions.length === 0) {
    return canEdit ? (
      <div className="w-60 flex items-center justify-center">
        <ActionButton
          icon={SquarePlus}
          onClick={handleEditPermissions}
          tooltip="Add Permissions"
          disabled={isLoading}
        />
      </div>
    ) : (
      <div className="text-center">-</div>
    );
  }

  return (
    <div>
      <div className="relative group flex items-center">
        <div className="w-60 overflow-hidden text-ellipsis text-nowrap pr-1 transition-all duration-200">
          {permissions.map((permission) => permission.name).join(", ")}
        </div>

        {canEdit ? (
          <ActionButton
            icon={Edit2}
            onClick={handleEditPermissions}
            tooltip="Edit Permissions"
            disabled={isLoading}
          />
        ) : (
          <ActionButton
            icon={Eye}
            onClick={() => setIsViewModalOpen(true)}
            tooltip="View Permissions"
            disabled={isLoading}
          />
        )}
      </div>

      {isModalOpen && (
        <PermissionsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          initialPermissions={permissions}
          removePermissions={removePermissions}
          onSave={handleSavePermissions}
          isLoading={isLoading}
        />
      )}

      {isViewModalOpen && (
        <ViewPermissionsModal
          isOpen={isViewModalOpen}
          onClose={handleCloseViewModal}
          permissions={permissions}
        />
      )}
    </div>
  );
};

ManagePermissions.displayName = "ManagePermissions";

const MemoizedManagePermissions = memo(ManagePermissions);
MemoizedManagePermissions.displayName = "MemoizedManagePermissions";

export default MemoizedManagePermissions;
