import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import GrievanceBoardView from "./GrievanceBoardView";
import GrievanceTableView from "./GrievanceTableView";

const Grievances = () => {
  const [activeView, setActiveView] = useState("board");

  return (
    <MainLayout
      title={"Grievances"}
      buttonTitle={"Add Grievance"}
      buttonLink={"/grievances/add"}
    >
      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="board">Board View</TabsTrigger>
        </TabsList>
        <TabsContent value="table">
          <GrievanceTableView />
        </TabsContent>
        <TabsContent value="board">
          <GrievanceBoardView/>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default Grievances;
