import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu } from "lucide-react";

const Header = ({ setIsSidebarOpen }) => {
  
  // const organization = useSelector((state) => state.user.organization);
  // const role = useSelector((state) => state.user.role);
  // const department = useSelector((state) => state.user.department);
  // const user = useSelector((state) => state.user.user);
  // console.log(organization, role, department, user);

    return (
      <header className="bg-white shadow p-4 flex justify-between items-center h-[50px]">
        <Button
          variant="ghost"
          className="lg:hidden"
          onClick={() => setIsSidebarOpen(prev => !prev)}
        >
          <Menu size={24} />
        </Button>
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost">🇺🇸 Eng (US)</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>🇺🇸 English (US)</DropdownMenuItem>
              <DropdownMenuItem>🇪🇸 Español</DropdownMenuItem>
              <DropdownMenuItem>🇫🇷 Français</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost">🔔</Button>
          <div className="flex items-center space-x-2">
            <img src="/api/placeholder/32/32" alt="User Avatar" className="w-8 h-8 rounded-full" />
            <span>Musfiq</span>
          </div>
        </div>
      </header>
    );
  };

export default Header;