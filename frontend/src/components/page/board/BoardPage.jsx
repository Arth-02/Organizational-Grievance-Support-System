// import { useGetProjectBoardTagsQuery, useGetProjectBoardTasksQuery } from "@/services/project.service";
// import { useParams } from "react-router-dom"

// const BoardPage = () => {

//   const { projectId, boardId } = useParams();

//   console.log(projectId, boardId);

//   const { data: boardData } = useGetProjectBoardTasksQuery(projectId);

//   const { data: boardTags } = useGetProjectBoardTagsQuery(projectId);

//   console.log(boardData, boardTags);

//   return (
//     <div>BoardPage</div>
//   )
// }

// export default BoardPage

import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import ProjectTableView from "./ProjectBoardTableView";
import ProjectBoardView from "./BoardView";

const BoardPage = () => {
  const [activeView, setActiveView] = useState("board");

  return (
    <MainLayout
      title={"Project Tasks"}
      buttonTitle={"Add Task"}
      buttonLink={"/tasks/add"}
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
    </MainLayout>
  );
};

export default BoardPage;
