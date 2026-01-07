import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, LayoutGrid, Table2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import GrievanceBoardView from "./GrievanceBoardView";
import GrievanceTableView from "./GrievanceTableView";

const Grievances = () => {
  const [activeView, setActiveView] = useState("board");
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="w-full h-full flex flex-col">
      <Tabs value={activeView} onValueChange={setActiveView} className="flex flex-col h-full">
        {/* Header row with title, tabs, and button */}
        <div className="flex justify-between items-center pb-4 shrink-0">
          <h1 className="text-xl font-semibold text-foreground">Grievances</h1>
          
          <div className="flex items-center gap-3">
            {/* View Toggle - Theme colors without slate */}
            <TabsList>
              <TabsTrigger 
                value="table"
              >
                <Table2 className="h-4 w-4 mr-1" />
                Table
              </TabsTrigger>
              <TabsTrigger 
                value="board"
              >
                <LayoutGrid className="h-4 w-4 mr-1" />
                Board
              </TabsTrigger>
            </TabsList>
            
            <Button size="sm" onClick={() => navigate("/grievances/add", { state: { background: location } })}>
              <Plus size={18} className="mr-2" />
              Add Grievance
            </Button>
          </div>
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
