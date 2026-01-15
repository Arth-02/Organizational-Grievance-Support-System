import { Route, Routes, useLocation } from "react-router-dom";
import Login from "./components/auth/Login";
import RegisterOrg from "./components/auth/RegisterOrg";
import SuperAdmin from "./components/auth/SuperAdmin";
import Layout from "./components/layout/Layout";
import PublicLayout from "./components/layout/PublicLayout";
import ScrollToTop from "./components/layout/ScrollToTop";
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

// Landing page (public)
import LandingPage from "./components/page/landing/LandingPage";

// Contact Sales page (public)
import ContactSales from "./components/page/contact/ContactSales";
import PrivacyPolicy from "./components/page/static/PrivacyPolicy";
import TermsOfService from "./components/page/static/TermsOfService";
import AboutUs from "./components/page/static/AboutUs";

// Dashboard component
import Dashboard from "./components/page/dashboard/Dashboard";

// Project components
import Projects from "./components/page/projects/Projects";
import ProjectBoard from "./components/page/projects/ProjectBoard";
import ProjectSettings from "./components/page/projects/ProjectSettings";
import ProjectForm from "./components/page/projects/ProjectForm";

// Organization components
import OrganizationSettings from "./components/page/organization/OrganizationSettings";

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
import AdminProjectsList from "./components/admin/projects/AdminProjectsList";
import AdminProjectDetails from "./components/admin/projects/AdminProjectDetails";
import AuditLogsList from "./components/admin/audit/AuditLogsList";
import AuditLogDetails from "./components/admin/audit/AuditLogDetails";
import AdminSettings from "./components/admin/settings/AdminSettings";

function App() {
  useSocket();

  const location = useLocation();
  const background = location.state && location.state.background;

  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <ModalProvider>
          <ScrollToTop />
          <Routes location={background || location}>
            {/* Public layout used for landing and static pages to persist navbar */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/about" element={<AboutUs />} />
            </Route>

            {/* Public contact sales page - standalone */}
            <Route path="/contact" element={<ContactSales />} />
            
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterOrg />} />
            <Route
              path="/organization/super-admin/create"
              element={<SuperAdmin />}
            />
            <Route
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
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
                element={<Projects />}
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
                element={<ProjectBoard />}
              />
              <Route
                path="/projects/:projectId/settings"
                element={
                  <PermissionGuard requiredPermissions={["UPDATE_PROJECT"]}>
                    <ProjectSettings />
                  </PermissionGuard>
                }
              />
              <Route
                path="/organization/settings"
                element={<OrganizationSettings />}
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
              <Route path="projects" element={<AdminProjectsList />} />
              <Route path="projects/:id" element={<AdminProjectDetails />} />
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
