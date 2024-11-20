import { Route, Routes, useLocation } from "react-router-dom";
import Login from "./components/auth/Login";
import RegisterOrg from "./components/auth/RegisterOrg";
import SuperAdmin from "./components/auth/SuperAdmin";
import Layout from "./components/layout/Layout";
import Employees from "./components/page/employees/Employees";
import Departments from "./components/page/departments/Departments";
import Roles from "./components/page/roles/Roles";
import AddUpdateEmployee from "./components/page/employees/AddUpdateEmployee";
import AddUpdateDepartment from "./components/page/departments/AddUpdateDepartment";
import AddUpdateRole from "./components/page/roles/AddUpdateRole";
import PrivateRoute from "./PrivateRoute";
import Unauthorized from "./Unauthorized";
import PermissionGuard from "./PermissionGuard";
import Grievances from "./components/page/grievance/Grievances";
import AddUpdateGrievance from "./components/page/grievance/AddUpdateGrievance";
import useSocket from "./utils/useSocket";
import { ThemeProvider } from "./components/ui/theme-provider";
import { ModalProvider } from "./components/ui/RoutedModal";
import GrievanceModal from "./components/page/grievance/GrievanceCardModal";
import AllProjects from "./components/page/projects/AllProjects";
import BoardPage from "./components/page/board/BoardPage";
import AddUpdateProject from "./components/page/projects/AddUpdateProject";

function App() {
  useSocket();

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
              <Route path="/grievances" element={<Grievances />} />
              <Route path="/grievances/add" element={<AddUpdateGrievance />} />
              <Route path="/projects" element={<AllProjects />} />
              <Route path="/projects/add" element={<AddUpdateProject />} />
              <Route path="/projects/:id/edit" element={<AddUpdateProject />} />
              <Route path="/projects/:projectId/board/:boardId" element={<BoardPage />} />
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
                path="/departments/add"
                element={
                  <PermissionGuard requiredPermissions={["CREATE_DEPARTMENT"]}>
                    <AddUpdateDepartment />
                  </PermissionGuard>
                }
              />
              <Route
                path="/departments/update/:id"
                element={
                  <PermissionGuard requiredPermissions={["UPDATE_DEPARTMENT"]}>
                    <AddUpdateDepartment />
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
                path="/roles/add"
                element={
                  <PermissionGuard requiredPermissions={["CREATE_ROLE"]}>
                    <AddUpdateRole />
                  </PermissionGuard>
                }
              />
              <Route
                path="/roles/update/:id"
                element={
                  <PermissionGuard requiredPermissions={["UPDATE_ROLE"]}>
                    <AddUpdateRole />
                  </PermissionGuard>
                }
              />
            </Route>
            <Route path="*" element={<Unauthorized />} />
          </Routes>
          {background && (
          <Routes>
            <Route path="/grievances/:id" element={<PrivateRoute><GrievanceModal /></PrivateRoute>} />
          </Routes>
        )}
        </ModalProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
