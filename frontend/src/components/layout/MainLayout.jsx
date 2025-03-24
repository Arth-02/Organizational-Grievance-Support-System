import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";

const MainLayout = ({ title, buttonTitle, buttonLink, children }) => {
  return (
    <div className="w-full h-full">
      <div className="flex justify-between items-center pb-4">
        <h1 className="text-xl font-semibold text-primary dark:text-gray-200">{title}</h1>
        {buttonTitle && buttonLink && (
          <Link to={buttonLink}>
            <Button size='sm'>
              <Plus size={18} className="mr-2" />
              {buttonTitle}
            </Button>
          </Link>
        )}
      </div>
      <div>
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
