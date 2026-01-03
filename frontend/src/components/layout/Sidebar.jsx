import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Briefcase,
  Building,
  ChevronDown,
  ChevronLeft,
  FolderOpenDot,
  Home,
  MessageSquareWarning,
  Users,
} from "lucide-react";
import { useSelector } from "react-redux";

const MenuItem = ({ item, isActive, isCollapsed }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (item.children && !isCollapsed) {
    return (
      <>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg transition-all duration-200 ${
            isActive
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <span className="flex items-center">
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
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-300 ${
              isOpen && "rotate-180"
            }`}
          />
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? "max-h-40" : "max-h-0"
          }`}
        >
          <div className="ml-6 mt-1 space-y-1">
            {item.children.map((child, index) => (
              <Link
                key={index}
                to={child.path}
                className={`flex items-center p-2 rounded-lg text-sm transition-all duration-200 ${
                  location.pathname === child.path
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <span
                  className={`transition-all duration-300 flex justify-center items-center ${
                    isCollapsed ? "w-10 h-10" : "w-6 h-6 mr-2"
                  }`}
                >
                  {React.cloneElement(child.icon, {
                    size: isCollapsed ? 22 : 16,
                    strokeWidth: 1.75,
                  })}
                </span>
                {!isCollapsed && child.label}
              </Link>
            ))}
          </div>
        </div>
      </>
    );
  }

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

const Sidebar = ({ isSidebarOpen, isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const userPermissions = useSelector((state) => state.user.permissions);

  const createMenuItem = (icon, label, path, permission) =>
    userPermissions.includes(permission) ? [{ icon, label, path }] : [];

  const menuItems = [
    { icon: <Home />, label: "Dashboard", path: "/" },
    { icon: <FolderOpenDot />, label: "Projects", path: "/projects" },
    { icon: <MessageSquareWarning />, label: "Grievances", path: "/grievances" },
    ...createMenuItem(<Users />, "Employees", "/employees", "VIEW_USER"),
    ...createMenuItem(<Briefcase />, "Roles", "/roles", "VIEW_ROLE"),
    ...createMenuItem(<Building />, "Departments", "/departments", "VIEW_DEPARTMENT"),
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
          <nav className="space-y-1">
            {menuItems.map((item, index) => {
              if (item.children && isCollapsed) return null;
              return (
                <MenuItem
                  key={index}
                  item={item}
                  isCollapsed={isCollapsed}
                  isActive={
                    location.pathname === item.path ||
                    (item.children &&
                      item.children.some(
                        (child) => location.pathname === child.path
                      ))
                  }
                />
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
