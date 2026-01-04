import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import ProjectTableView from "./ProjectBoardTableView";
import ProjectBoardView from "./BoardView";
import AddTaskModal from "./AddTaskModal";
import { useGetProjectBoardTasksQuery } from "@/services/project.service";

const BoardPage = () => {
  const { projectId } = useParams();
  const [activeView, setActiveView] = useState("board");
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const { refetch } = useGetProjectBoardTasksQuery(projectId);

  const handleTaskAdded = () => {
    refetch();
  };

  return (
    <MainLayout
      title={"Project Tasks"}
      buttonTitle={"Add Task"}
      onButtonClick={() => setIsAddTaskModalOpen(true)}
    >
      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="board">Board View</TabsTrigger>
        </TabsList>
        <TabsContent value="table">
          <ProjectTableView />
        </TabsContent>
        <TabsContent value="board">
          <ProjectBoardView />
        </TabsContent>
      </Tabs>

      <AddTaskModal
        open={isAddTaskModalOpen}
        onOpenChange={setIsAddTaskModalOpen}
        projectId={projectId}
        onTaskAdded={handleTaskAdded}
      />
    </MainLayout>
  );
};

export default BoardPage;
