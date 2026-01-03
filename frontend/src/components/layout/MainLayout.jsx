import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";

const MainLayout = ({ title, buttonTitle, buttonLink, onButtonClick, children }) => {
  const navigate = useNavigate();

  const handleButtonClick = () => {
    if (onButtonClick) {
      onButtonClick();
    } else if (buttonLink) {
      navigate(buttonLink);
    }
  };

  return (
    <div className="w-full h-full">
      <div className="flex justify-between items-center pb-4">
        <h1 className="text-xl font-semibold text-primary dark:text-gray-200">{title}</h1>
        {buttonTitle && (buttonLink || onButtonClick) && (
          <Button size='sm' onClick={handleButtonClick}>
            <Plus size={18} className="mr-2" />
            {buttonTitle}
          </Button>
        )}
      </div>
      <div>
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
