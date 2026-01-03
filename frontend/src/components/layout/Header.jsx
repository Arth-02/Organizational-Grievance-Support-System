import { Button } from "@/components/ui/button";
import { logout } from "@/features/userSlice";
import { LogOut, Menu } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "../ui/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const Header = ({ setIsSidebarOpen }) => {
  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <header className="bg-card border-b border-border/50 px-4 lg:px-6 flex justify-between items-center h-14 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
        >
          <Menu size={20} />
        </Button>
        <h1 className="text-lg font-semibold text-primary hidden sm:block">
          Grievance System
        </h1>
      </div>
      
      <div className="flex items-center gap-2">
        <ThemeToggle />
        
        <div className="flex items-center gap-3 pl-2 border-l border-border/50">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar} alt={user?.username} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {user?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground hidden md:block">
              {user?.username}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut size={18} className="mr-1.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
