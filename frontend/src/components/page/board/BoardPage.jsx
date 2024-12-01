import { useGetProjectBoardTasksQuery } from "@/services/project.service";
import { useParams } from "react-router-dom"

const BoardPage = () => {

  const { projectId, boardId } = useParams();

  console.log(projectId, boardId);

  const { data: boardData } = useGetProjectBoardTasksQuery(projectId)

  console.log(boardData);

  return (
    <div>BoardPage</div>
  )
}

export default BoardPage