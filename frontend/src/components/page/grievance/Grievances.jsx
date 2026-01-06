import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GrievanceBoardView from "./GrievanceBoardView";
import GrievanceTableView from "./GrievanceTableView";

const Grievances = () => {
  const [activeView, setActiveView] = useState("board");
  const navigate = useNavigate();

  return (
    <div className="w-full h-full flex flex-col">
      <Tabs value={activeView} onValueChange={setActiveView} className="flex flex-col h-full">
        {/* Header row with title, tabs, and button */}
        <div className="flex justify-between items-center pb-4 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-primary dark:text-gray-200">Grievances</h1>
            <TabsList>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="board">Board</TabsTrigger>
            </TabsList>
          </div>
          <Button size="sm" onClick={() => navigate("/grievances/add")}>
            <Plus size={18} className="mr-2" />
            Add Grievance
          </Button>
        </div>

        {/* Content area - fills remaining height */}
        <div className="flex-1 min-h-0">
          <TabsContent value="table" className="h-full mt-0">
            <GrievanceTableView />
          </TabsContent>
          <TabsContent value="board" className="h-full mt-0 overflow-hidden">
            <GrievanceBoardView />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Grievances;
