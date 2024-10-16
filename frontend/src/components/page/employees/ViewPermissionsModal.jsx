import { Label } from "@/components/ui/label";
import Modal from "@/components/ui/Model";

const ViewPermissionsModal = ({
  isOpen,
  onClose,
  permissions = [],
}) => {
  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      title="View Permissions"
      description="List of permissions assigned to the user"
      confirmText="Close"
      onConfirm={onClose}
      shoudlShowCancel={false}
    >
      <div className="space-y-4 overflow-y-auto max-h-[400px] !pr-4">
        <div className="grid grid-cols-2 gap-4">
          {permissions.length === 0 ? (
            <div>No permissions assigned.</div>
          ) : (
            permissions.map((permission, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 h-10 bg-secondary/20 p-2 rounded-md"
              >
                <Label htmlFor={`permission-${index}`} className="flex-grow">
                  {permission.name}
                </Label>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ViewPermissionsModal;
