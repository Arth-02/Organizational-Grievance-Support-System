import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Briefcase,
  Building,
  ChevronDown,
  Home,
  Lock,
  LogIn,
  Users,
} from "lucide-react";

const menuItems = [
  { icon: <Home size={20} />, label: "Dashboard", path: "/dashboard" },
  { icon: <Users size={20} />, label: "Employees", path: "/employees" },
  { icon: <Building size={20} />, label: "Departments", path: "/departments" },
  {
    icon: <Lock size={20} />,
    label: "Authentication",
    children: [
      { label: "Login", path: "/login", icon: <LogIn size={20} /> },
      { label: "Register", path: "/register", icon: <LogIn size={20} /> },
    ],
  },
  { icon: <Briefcase size={20} />, label: "Roles", path: "/roles" },
];

const MenuItem = ({ item, isActive }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between w-full p-2 rounded-lg text-gray-700 hover:text-primary ${
            isActive
              ? "bg-primary/10 hover:bg-primary/15 text-primary font-medium"
              : "hover:bg-primary/10"
          }`}
        >
          <span className="flex items-center">
            <span className="mr-3">{item.icon}</span> {item.label}
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-300 ${
              isOpen && "rotate-180"
            } `}
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
                <span className="mr-3">{child.icon}</span> {child.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
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
      <span className={`mr-3 ${isActive && "text-primary"}`}>{item.icon}</span>{" "}
      {item.label}
    </Link>
  );
};

const Sidebar = ({ isOpen }) => {
  const location = useLocation();

  return (
    <aside
      className={`absolute top-0 left-0 h-screen shadow-lg lg:static lg:h-full bg-white text-gray- z-40 min-w-64 transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 overflow-y-auto`}
    >
      <div className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <MenuItem
                item={item}
                isActive={
                  location.pathname === item.path ||
                  (item.children &&
                    item.children.some(
                      (child) => location.pathname === child.path
                    ))
                }
              />
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
