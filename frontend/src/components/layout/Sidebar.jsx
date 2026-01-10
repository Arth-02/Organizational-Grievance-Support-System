import React, { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Briefcase,
  Building,
  ChevronDown,
  ChevronLeft,
  FolderKanban,
  Home,
  MessageSquareWarning,
  Users,
  MoreHorizontal,
} from "lucide-react";
import { useSelector } from "react-redux";
import { useGetMyProjectsQuery } from "@/services/project.service";

const MenuItem = ({ item, isActive, isCollapsed }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(() => {
    if (!item.children) return false;
    return item.children.some(child => 
      location.pathname === child.path || 
      location.pathname.startsWith(child.path + "/")
    );
  });

  // Automatically open dropdown if a child is active (handles navigation updates)
  useEffect(() => {
    if (item.children) {
      const shouldBeOpen = item.children.some(child => 
        location.pathname === child.path || 
        location.pathname.startsWith(child.path + "/")
      );
      if (shouldBeOpen) {
        setIsOpen(true);
      }
    }
  }, [location.pathname, item.children]);

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
            isOpen ? "max-h-60" : "max-h-0"
          }`}
        >
          <div className="ml-6 mt-1 space-y-1">
            {item.children.map((child, index) => (
              <Link
                key={index}
                to={child.path}
                className={`flex items-center p-2 rounded-lg text-sm transition-all duration-200 ${
                  child.highlight !== false && (location.pathname === child.path ||
                  location.pathname.startsWith(child.path + "/"))
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
  
  // Fetch projects for sidebar
  const { data: projectsData } = useGetMyProjectsQuery();
  const projects = useMemo(() => projectsData?.data || [], [projectsData]);

  const createMenuItem = (icon, label, path, permission) =>
    userPermissions.includes(permission) ? [{ icon, label, path }] : [];

  // Build projects menu item with children
  const projectsMenuItem = useMemo(() => {
    // Show projects to everyone who has projects (either via permission or membership)
    if (projects.length === 0) {
      // If no projects yet, show simple link if user has VIEW_PROJECT permission
      if (userPermissions.includes("VIEW_PROJECT")) {
        return [{ icon: <FolderKanban />, label: "Projects", path: "/projects" }];
      }
      return [];
    }

    // Show first 3 projects as children, with "View All" if more
    const projectChildren = projects.slice(0, 3).map((project) => ({
      // Use project icon image if available, otherwise default FolderKanban
      icon: project.icon ? (
        <img 
          key={`${project._id}-${project.icon}`}
          src={project.icon} 
          alt={project.name}
          className="w-4 h-4 rounded object-cover"
        />
      ) : (
        <FolderKanban />
      ),
      label: project.name,
      path: `/projects/${project._id}`,
    }));

    // Add "View All" link if there are more projects or user has permission
    if (projects.length > 3 || userPermissions.includes("VIEW_PROJECT")) {
      projectChildren.push({
        icon: <MoreHorizontal />,
        label: projects.length > 3 ? `+${projects.length - 3} more` : "View All",
        path: "/projects",
        highlight: false,
      });
    }

    return [{
      icon: <FolderKanban />,
      label: "Projects",
      path: "/projects",
      children: projectChildren,
      // Only highlight parent when exactly on /projects, not on child project pages
      exactMatch: true,
    }];
  }, [projects, userPermissions]);

  const menuItems = [
    { icon: <Home />, label: "Dashboard", path: "/" },
    { icon: <MessageSquareWarning />, label: "Grievances", path: "/grievances" },
    ...projectsMenuItem,
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
                    // If exactMatch is true, only match exact path
                    item.exactMatch
                      ? location.pathname === item.path
                      : (
                          location.pathname === item.path ||
                          (item.path !== "/" && location.pathname.startsWith(item.path + "/")) ||
                          (item.children &&
                            item.children.some(
                              (child) => location.pathname === child.path || location.pathname.startsWith(child.path + "/")
                            ))
                        )
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

