import { useNavigate } from "react-router-dom";
import { Button } from "./components/ui/button";

const Unauthorized = () => {

  const naviagte = useNavigate();

    return (
      <div className="flex flex-col items-center justify-center bg-gray-100 absolute inset-0 m-5">
        <h1 className="text-4xl font-bold text-primary mb-4">Unauthorized</h1>
        <p className="text-lg text-gray-700">
          You do not have permission to access this page.
        </p>
        <Button
          onClick={() => naviagte(-1)}
          className="mt-6 px-4 py-2"
        >
          Go Back
        </Button>
      </div>
    );
  };
  
  export default Unauthorized;
  