import React, { useRef, useState } from "react";
import { Bell, LogOut, Settings, User, User2 } from "lucide-react";
import { logout } from "../utils";
import { Link } from "react-router-dom";
import useOutsideClick from "../hooks/useOutSideClick";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useOutsideClick(menuRef, () => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  });

  return (
    <header className="flex justify-between items-center py-3 px-5 h-12">
      <div className="flex gap-2 items-center">
        <img
          src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png"
          alt="Google Logo"
          width={100}
          height={50}
        />
        <h1>Google</h1>
      </div>
      <div className="relative flex items-center gap-1" ref={menuRef}>
        <Bell size={34} className="cursor-pointer p-2 hover:bg-muted rounded-lg transition-colors duration-300" />
        <User2 size={34} className="cursor-pointer p-2 hover:bg-muted hover:text-red rounded-lg transition-colors duration-300" onClick={() => setIsMenuOpen(!isMenuOpen)} />
        <div
          className={`absolute top-full mt-2 right-0 flex flex-col bg-muted text-muted-foreground p-2 min-w-40 rounded-lg shadow-md ${
            isMenuOpen ? "flex" : "hidden"
          }`}
        >
          <Link
            to={"#"}
            className="flex justify-between items-center py-1 px-2 hover:bg-muted-hover cursor-pointer rounded-md"
          >
            <User size={16} />
            <span>John Doe</span>
          </Link>
          <Link
            to={"#"}
            className="flex justify-between items-center py-1 px-2 hover:bg-muted-hover cursor-pointer rounded-md group"
          >
            <Settings
              className="group-hover:rotate-90 transition-transform duration-200"
              size={16}
            />
            <span>Settings</span>
          </Link>
          <Link
            to={"#"}
            className="flex justify-between items-center py-1 px-2 hover:bg-muted-hover cursor-pointer rounded-md"
            onClick={logout}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
