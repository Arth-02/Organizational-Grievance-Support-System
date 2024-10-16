import { useSelector } from "react-redux";
// import { Navigate } from "react-router-dom";
import Unauthorized from "./Unauthorized";

const PermissionGuard = ({ requiredPermissions, children }) => {
  const userPermissions = useSelector((state) => state.user.permissions);
  const hasPermission = requiredPermissions.every((permission) =>
    userPermissions.includes(permission)
  );

  if (!hasPermission) {
    return <Unauthorized />;
  }
  return <>{children}</>;
};

export default PermissionGuard;
