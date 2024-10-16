import { Button } from "@/components/ui/button";
import { logout } from "@/features/userSlice";
import { Menu } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const Header = ({ setIsSidebarOpen }) => {
  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <header className="bg-white shadow p-4 flex justify-between items-center h-[50px]">
      <Button
        variant="ghost"
        className="lg:hidden"
        onClick={() => setIsSidebarOpen((prev) => !prev)}
      >
        <Menu size={24} />
      </Button>
      <div className="flex items-center justify-between w-full p-4 bg-gray-50 shadow-sm rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-primary-foreground bg-primary px-4 py-2 rounded-full shadow-md border border-primary-foreground transition-transform transform hover:scale-105">
            {user.username}
          </span>
        </div>
        <div>
          <Button onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
