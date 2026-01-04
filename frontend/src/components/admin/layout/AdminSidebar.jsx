import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Building2,
  ChevronLeft,
  LayoutDashboard,
  Users,
  FolderKanban,
  Shield,
  MessageSquareWarning,
  ScrollText,
  Settings,
} from "lucide-react";

const MenuItem = ({ item, isActive, isCollapsed }) => {
  return (
    <Link
      to={item.path}
      className={`flex items-center px-2.5 py-1.5 rounded-lg transition-all duration-200 ${
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      <span
        className={`transition-all duration-300 flex justify-center items-center ${
          isCollapsed ? "w-10 h-10" : "w-8 h-8 mr-2.5"
        }`}
      >
        {React.cloneElement(item.icon, {
          size: isCollapsed ? 22 : 18,
          strokeWidth: 1.75,
        })}
      </span>
      {!isCollapsed && <span className="text-sm">{item.label}</span>}
    </Link>
  );
};

const AdminSidebar = ({ isSidebarOpen, isCollapsed, setIsCollapsed }) => {
  const location = useLocation();

  const menuItems = [
    { icon: <LayoutDashboard />, label: "Dashboard", path: "/admin" },
    { icon: <Building2 />, label: "Organizations", path: "/admin/organizations" },
    { icon: <Users />, label: "Users", path: "/admin/users" },
    { icon: <FolderKanban />, label: "Projects", path: "/admin/projects" },
    { icon: <Shield />, label: "Roles", path: "/admin/roles" },
    { icon: <MessageSquareWarning />, label: "Grievances", path: "/admin/grievances" },
    { icon: <ScrollText />, label: "Audit Logs", path: "/admin/audit-logs" },
    { icon: <Settings />, label: "Settings", path: "/admin/settings" },
  ];

  return (
    <aside
      className={`fixed lg:relative transition-all duration-300 z-20 h-full ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
    >
      <button
        className="hidden lg:flex items-center justify-center w-6 h-6 absolute top-4 -right-3 bg-card border border-border shadow-sm text-muted-foreground hover:text-foreground transition-all duration-200 rounded-full z-10"
        onClick={() => setIsCollapsed((prev) => !prev)}
      >
        <ChevronLeft
          size={14}
          className={`transition-transform duration-300 ${
            isCollapsed ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>
      <div
        className={`h-full bg-card border-r border-border/50 transition-all duration-300 ease-in-out overflow-y-auto overflow-x-hidden ${
          isCollapsed ? "w-[72px]" : "w-[240px]"
        }`}
      >
        <div className="p-3">
          {/* Admin Badge */}
          {!isCollapsed && (
            <div className="mb-4 px-2.5 py-2 bg-primary/10 rounded-lg">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Admin Panel
              </span>
            </div>
          )}
          <nav className="space-y-1">
            {menuItems.map((item, index) => (
              <MenuItem
                key={index}
                item={item}
                isCollapsed={isCollapsed}
                isActive={location.pathname === item.path}
              />
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
