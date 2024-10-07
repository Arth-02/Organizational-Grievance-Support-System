import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import Modal from "@/components/ui/Model";

const PermissionsModal = ({
  isOpen,
  onClose,
  initialPermissions = [],
  onSave,
}) => {
  const [permissions, setPermissions] = useState(initialPermissions);
  const [newPermission, setNewPermission] = useState("");

  const handleAddPermission = () => {
    if (newPermission && !permissions.includes(newPermission)) {
      setPermissions([...permissions, newPermission]);
      setNewPermission("");
    }
  };

  const handleRemovePermission = (permission) => {
    setPermissions(permissions.filter((p) => p !== permission));
  };

  const handleSave = () => {
    onSave(permissions);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      title="Manage Permissions"
      description="Add, remove, or modify user permissions"
      confirmText="Save Changes"
      onConfirm={handleSave}
    >
      <div className="space-y-4">
        <div className="flex space-x-2">
          <Input
            placeholder="Enter new permission"
            value={newPermission}
            onChange={(e) => setNewPermission(e.target.value)}
          />
          <Button onClick={handleAddPermission} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {permissions.map((permission, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 bg-secondary/20 p-2 rounded-md"
            >
              <Checkbox id={`permission-${index}`} />
              <Label htmlFor={`permission-${index}`} className="flex-grow">
                {permission}
              </Label>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemovePermission(permission)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default PermissionsModal;
