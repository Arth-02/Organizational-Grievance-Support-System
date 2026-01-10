import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, LayoutGrid, Table2 } from "lucide-react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import GrievanceBoardView from "./GrievanceBoardView";
import GrievanceTableView from "./GrievanceTableView";
import GrievanceModal from "./GrievanceCardModal";
import {
  setGrievanceView,
  setGrievanceMyFilter,
} from "@/features/grievanceSlice";

const Grievances = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read view and filter from Redux
  const activeView = useSelector((state) => state.grievance.view);
  const myFilter = useSelector((state) => state.grievance.myFilter);
  
  // Read grievance id from search params for modal
  const selectedGrievanceId = searchParams.get("id");

  const handleViewChange = (view) => {
    dispatch(setGrievanceView(view));
  };

  const handleMyFilterChange = (value) => {
    dispatch(setGrievanceMyFilter(value));
  };

  const handleCloseModal = () => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.delete("id");
      return newParams;
    });
  };

  return (
    <div className="w-full h-full flex flex-col">
      <Tabs value={activeView} onValueChange={handleViewChange} className="flex flex-col h-full">
        {/* Header row with title, tabs, and button */}
        <div className="flex justify-between items-center pb-4 shrink-0">
          <h1 className="text-xl font-semibold text-foreground">Grievances</h1>
          
          <div className="flex items-center gap-3">
            {/* My Grievances Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium min-w-fit">My Grievances</span>
              <Select value={myFilter} onValueChange={handleMyFilterChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="assigned_to_me">Assigned to me</SelectItem>
                  <SelectItem value="reported_by_me">Reported by me</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Toggle */}
            <TabsList>
              <TabsTrigger value="table">
                <Table2 className="h-4 w-4 mr-1" />
                Table
              </TabsTrigger>
              <TabsTrigger value="board">
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
            <GrievanceTableView myFilter={myFilter} />
          </TabsContent>
          <TabsContent value="board" className="h-full mt-0 overflow-hidden">
            <GrievanceBoardView key={myFilter} myFilter={myFilter} />
          </TabsContent>
        </div>
      </Tabs>

      {/* Grievance Modal - renders when id param exists */}
      {selectedGrievanceId && (
        <GrievanceModal
          grievanceId={selectedGrievanceId}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Grievances;
