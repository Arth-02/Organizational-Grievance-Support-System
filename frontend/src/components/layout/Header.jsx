import { Button } from "@/components/ui/button";
import { logout } from "@/features/userSlice";
import { LogOut, Menu, User, Shield } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "../ui/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const Header = ({ setIsSidebarOpen }) => {
  const user = useSelector((state) => state.user.user);
  const role = useSelector((state) => state.user.role);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isDev = role?.name === "DEV";
  const isAdminRoute = location.pathname.startsWith("/admin");

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
          {isAdminRoute ? "Admin Panel" : "Grievance System"}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Admin Panel Toggle for DEV users */}
        {isDev && (
          <Button
            variant={isAdminRoute ? "default" : "outline"}
            size="sm"
            onClick={() => navigate(isAdminRoute ? "/" : "/admin")}
            className="gap-2"
          >
            <Shield size={16} />
            <span className="hidden sm:inline">
              {isAdminRoute ? "Exit Admin" : "Admin Panel"}
            </span>
          </Button>
        )}

        <ThemeToggle />

        <div className="flex items-center gap-3 pl-2 border-l border-border/50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} alt={user?.username} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {user?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground hidden md:block">
                  {user?.username}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {user?.firstname && user?.lastname
                      ? `${user.firstname} ${user.lastname}`
                      : user?.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate("/profile")}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;

