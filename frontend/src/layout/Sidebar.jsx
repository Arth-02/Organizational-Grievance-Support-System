import React from "react";
import { isAdmin } from "../utils";
import { Link } from "react-router-dom";
import { LayoutDashboard, MessageSquareDot, Users } from "lucide-react";

const Sidebar = () => {
  const sidebarItems = [
    {
      name: "Dashboard",
      link: "/dashboard",
      isAdminOnly: false,
      icon: <LayoutDashboard size={18}/>,
    },
    {
      name: "Complains",
      link: "/complains",
      isAdminOnly: true,
      icon: <MessageSquareDot size={18}/>,
    },
    {
      name: "Employees",
      link: "/employees",
      isAdminOnly: false,
      icon: <Users size={18}/>,
    },
  ];

  const filteredSidebarItems = sidebarItems.filter((item) => {
    if (item.isAdminOnly) {
      return isAdmin();
    } else {
      return true;
    }
  });

  return (
    <aside className="w-56 bg-gray-800 text-white h-[calc(100vh-48px)] py-2">
      <nav>
        <ul>
          {filteredSidebarItems.map((item, index) => (
            <li key={index} className="hover:bg-gray-700">
              <Link to={item.link} className="px-3 py-2 w-full flex gap-4 items-center">
                {item.icon}
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
