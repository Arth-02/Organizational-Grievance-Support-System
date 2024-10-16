import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Briefcase,
  Building,
  ChevronDown,
  ChevronLeft,
  Home,
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
          className={`flex items-center justify-between w-full p-2 rounded-lg text-gray-700 hover:text-primary ${
            isActive
              ? "bg-primary/10 hover:bg-primary/15 text-primary font-medium"
              : "hover:bg-primary/10"
          }`}
        >
          <span className="flex items-center">
            <span
              className={`transition-all duration-300 flex justify-center items-center ${
                isCollapsed ? "w-10 h-10" : "w-8 h-8 mr-2"
              }`}
            >
              {React.cloneElement(item.icon, {
                size: isCollapsed ? 24 : 20,
              })}
            </span>
            {!isCollapsed && item.label}
          </span>
          <ChevronDown
            size={20}
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
                className={`flex items-center p-2 rounded-lg text-gray-700 hover:text-primary ${
                  location.pathname === child.path
                    ? "bg-primary/10 hover:bg-primary/15 text-primary font-medium"
                    : "hover:bg-primary/10"
                }`}
              >
                <span
                  className={`transition-all duration-300 flex justify-center items-center ${
                    isCollapsed ? "w-10 h-10" : "w-6 h-6 mr-2"
                  }`}
                >
                  {React.cloneElement(child.icon, {
                    size: isCollapsed ? 24 : 20,
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
      className={`flex items-center p-2 rounded-lg text-gray-700 hover:text-primary ${
        isActive
          ? "bg-primary/10 hover:bg-primary/15 text-primary font-medium"
          : "hover:bg-primary/10"
      }`}
    >
      <span
        className={`transition-all duration-300 flex justify-center items-center ${
          isCollapsed ? "w-10 h-10" : "w-8 h-8 mr-2"
        }`}
      >
        {React.cloneElement(item.icon, {
          size: isCollapsed ? 24 : 20,
        })}
      </span>
      {!isCollapsed && item.label}
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
    ...createMenuItem(<Users />, "Employees", "/employees", "VIEW_USER"),
    ...createMenuItem(<Briefcase />, "Roles", "/roles", "VIEW_ROLE"),
    ...createMenuItem(<Building />, "Departments", "/departments", "VIEW_DEPARTMENT"),
  ];
  

  return (
    <aside className={`fixed lg:relative transition-all duration-300 mt-2 z-20 h-screen bg-white top-0 left-0 ${
      isSidebarOpen ? "translate-x-0" : "-translate-x-full"
    } lg:translate-x-0`}>
      <button className="hidden lg:block p-1 z-30 absolute top-0 -right-4 bg-white shadow-md text-primary/80 hover:text-primary hover:bg-primary/15 transition-all backdrop-blur-3xl duration-200 rounded-full" onClick={() => setIsCollapsed((prev) => !prev)}>
        <ChevronLeft size={28} className={`transition-all duration-300 ${isCollapsed ? 'rotate-180 ml-[2px]' : 'rotate-0 mr-[2px]'}`} />
      </button>
    <div
      className={`pt-5 h-full shadow-lg lg:h-full bg-white z-40 transition-all duration-300 ease-in-out overflow-y-auto overflow-x-hidden ${isCollapsed ? "w-[84px]" : "w-[256px]"}`}
    >
      <div className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => {
            if (item.children && isCollapsed) return null;
            return (
              <li key={index}>
                <MenuItem
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
              </li>
            );
          })}
        </ul>
      </div>
    </div>
    </aside>
  );
};

export default Sidebar;
