import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Edit2 } from "lucide-react";
import { useState } from "react";
import PermissionsModal from "./PermissionModal";

const ManagePermissions = ({ permissions, isEditable }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEditPermissions = () => {
    setIsModalOpen(true);
  };

    const handleSavePermissions = (newPermissions) => {
    console.log(newPermissions);
    };

  return (
    <div>
      {permissions.length === 0 && <div className="text-center">-</div>}
      {permissions.length > 0 && (
        <div className="relative group flex items-center">
          <div
            className={`max-w-64 overflow-hidden text-ellipsis text-nowrap group-hover:pr-2 transition-all duration-200`}
          >
            {permissions}
          </div>
          {isEditable && (
            <Tooltip>
              <TooltipTrigger>
                <Edit2
                  onClick={handleEditPermissions}
                  size={30}
                  className="cursor-pointer invisible scale-0 group-hover:visible group-hover:scale-100 p-[6px] rounded-md hover:bg-primary/10 hover:text-primary transition-all duration-200 ease-in"
                />
              </TooltipTrigger>
              <TooltipContent>Edit Permissions</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
      <PermissionsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialPermissions={permissions}
        onSave={handleSavePermissions}
      />
    </div>
  );
};

export default ManagePermissions;
