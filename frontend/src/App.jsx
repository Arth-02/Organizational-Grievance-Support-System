import { Route, Routes, useLocation } from "react-router-dom";
import Login from "./components/auth/Login";
import RegisterOrg from "./components/auth/RegisterOrg";
import SuperAdmin from "./components/auth/SuperAdmin";
import Layout from "./components/layout/Layout";
import Employees from "./components/page/employees/Employees";
import Departments from "./components/page/departments/Departments";
import Roles from "./components/page/roles/Roles";
import AddUpdateEmployee from "./components/page/employees/AddUpdateEmployee";
import PrivateRoute from "./PrivateRoute";
import AdminRoute from "./AdminRoute";
import Unauthorized from "./Unauthorized";
import PermissionGuard from "./PermissionGuard";

import Grievances from "./components/page/grievance/Grievances";
import AddUpdateGrievance from "./components/page/grievance/AddUpdateGrievance";
import useSocket from "./utils/useSocket";
import { ThemeProvider } from "./components/ui/theme-provider";
import { ModalProvider } from "./components/ui/RoutedModal";
import Profile from "./components/page/profile/Profile";

// Dashboard component
import Dashboard from "./components/page/dashboard/Dashboard";

// Project components
import Projects from "./components/page/projects/Projects";
import ProjectBoard from "./components/page/projects/ProjectBoard";
import ProjectSettings from "./components/page/projects/ProjectSettings";
import ProjectForm from "./components/page/projects/ProjectForm";

// Admin components
import AdminLayout from "./components/admin/layout/AdminLayout";
import AdminDashboard from "./components/admin/dashboard/AdminDashboard";
import OrganizationsList from "./components/admin/organizations/OrganizationsList";
import OrganizationDetails from "./components/admin/organizations/OrganizationDetails";
import AdminUsersList from "./components/admin/users/AdminUsersList";
import AdminUserDetails from "./components/admin/users/AdminUserDetails";
import AdminRolesList from "./components/admin/roles/AdminRolesList";
import AdminRoleDetails from "./components/admin/roles/AdminRoleDetails";
import AdminGrievancesList from "./components/admin/grievances/AdminGrievancesList";
import AdminGrievanceDetails from "./components/admin/grievances/AdminGrievanceDetails";
import AuditLogsList from "./components/admin/audit/AuditLogsList";
import AuditLogDetails from "./components/admin/audit/AuditLogDetails";
import AdminSettings from "./components/admin/settings/AdminSettings";

function App() {
  useSocket();
  console.log("App rendered");

  const location = useLocation();
  const background = location.state && location.state.background;

  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <ModalProvider>
          <Routes location={background || location}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterOrg />} />
            <Route
              path="/organization/super-admin/create"
              element={<SuperAdmin />}
            />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/grievances" element={<Grievances />} />
              <Route path="/grievances/add" element={<AddUpdateGrievance />} />
              <Route
                path="/employees"
                element={
                  <PermissionGuard requiredPermissions={["VIEW_USER"]}>
                    <Employees />
                  </PermissionGuard>
                }
              />
              <Route
                path="/employees/add"
                element={
                  <PermissionGuard requiredPermissions={["CREATE_USER"]}>
                    <AddUpdateEmployee />
                  </PermissionGuard>
                }
              />
              <Route
                path="/employees/update/:id"
                element={
                  <PermissionGuard requiredPermissions={["UPDATE_USER"]}>
                    <AddUpdateEmployee />
                  </PermissionGuard>
                }
              />
              <Route
                path="/departments"
                element={
                  <PermissionGuard requiredPermissions={["VIEW_DEPARTMENT"]}>
                    <Departments />
                  </PermissionGuard>
                }
              />
              <Route
                path="/roles"
                element={
                  <PermissionGuard requiredPermissions={["VIEW_ROLE"]}>
                    <Roles />
                  </PermissionGuard>
                }
              />
              <Route
                path="/projects"
                element={
                  <PermissionGuard requiredPermissions={["VIEW_PROJECT"]}>
                    <Projects />
                  </PermissionGuard>
                }
              />
              <Route
                path="/projects/add"
                element={
                  <PermissionGuard requiredPermissions={["CREATE_PROJECT"]}>
                    <ProjectForm />
                  </PermissionGuard>
                }
              />
              <Route
                path="/projects/:projectId"
                element={
                  <PermissionGuard requiredPermissions={["VIEW_PROJECT"]}>
                    <ProjectBoard />
                  </PermissionGuard>
                }
              />
              <Route
                path="/projects/:projectId/settings"
                element={
                  <PermissionGuard requiredPermissions={["UPDATE_PROJECT"]}>
                    <ProjectSettings />
                  </PermissionGuard>
                }
              />
            </Route>

            {/* Admin Routes - DEV only */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="organizations" element={<OrganizationsList />} />
              <Route path="organizations/:id" element={<OrganizationDetails />} />
              <Route path="users" element={<AdminUsersList />} />
              <Route path="users/:id" element={<AdminUserDetails />} />
              <Route path="roles" element={<AdminRolesList />} />
              <Route path="roles/:id" element={<AdminRoleDetails />} />
              <Route path="grievances" element={<AdminGrievancesList />} />
              <Route path="grievances/:id" element={<AdminGrievanceDetails />} />
              <Route path="audit-logs" element={<AuditLogsList />} />
              <Route path="audit-logs/:id" element={<AuditLogDetails />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={<Unauthorized />} />
          </Routes>
          
          {/* Modal routes - render when navigating with background state */}
          {background && (
            <Routes>
              <Route path="/grievances/add" element={<PrivateRoute><AddUpdateGrievance /></PrivateRoute>} />
              <Route path="/projects/add" element={<PrivateRoute><ProjectForm /></PrivateRoute>} />
            </Routes>
          )}
        </ModalProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
