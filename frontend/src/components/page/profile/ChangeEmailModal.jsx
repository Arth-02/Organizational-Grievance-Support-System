import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useChangeEmailMutation } from "@/services/user.service";
import toast from "react-hot-toast";

const ChangeEmailModal = ({ isOpen, onClose, currentEmail }) => {
  const [formData, setFormData] = useState({
    password: "",
    newEmail: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const [changeEmail, { isLoading }] = useChangeEmailMutation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    if (!formData.newEmail) {
      newErrors.newEmail = "New email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.newEmail)) {
      newErrors.newEmail = "Please enter a valid email address";
    } else if (formData.newEmail.toLowerCase() === currentEmail?.toLowerCase()) {
      newErrors.newEmail = "New email must be different from current email";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const response = await changeEmail(formData).unwrap();
      toast.success(response.message || "Email changed successfully");
      onClose();
      setFormData({ password: "", newEmail: "" });
    } catch (error) {
      const message = error?.data?.message;
      if (Array.isArray(message)) {
        toast.error(message[0]);
      } else {
        toast.error(message || "Failed to change email");
      }
    }
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      title="Change Email"
      description="Enter your password and new email address"
      confirmText={isLoading ? "Changing..." : "Change Email"}
      onConfirm={handleSubmit}
      className="sm:max-w-[420px]"
    >
      <div className="space-y-4 pr-6">
        <div className="space-y-2">
          <Label htmlFor="password">Current Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              className="pl-9 pr-10"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="newEmail">New Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="newEmail"
              name="newEmail"
              type="email"
              value={formData.newEmail}
              onChange={handleChange}
              className="pl-9"
              placeholder="Enter new email address"
            />
          </div>
          {errors.newEmail && (
            <p className="text-xs text-destructive">{errors.newEmail}</p>
          )}
          {currentEmail && (
            <p className="text-xs text-muted-foreground">
              Current email: {currentEmail}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ChangeEmailModal;
