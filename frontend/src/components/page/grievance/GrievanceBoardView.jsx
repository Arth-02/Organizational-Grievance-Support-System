import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useLocation } from "react-router-dom";
import GrievanceCard from "./GrievanceCard";

const GrievanceBoardView = ({ grievances, onDragEnd }) => {
  const lists = ["submitted", "in-progress", "resolved", "dismissed"];
  const location = useLocation();

  const handleDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    const { source, destination, draggableId } = result;

    if (source.droppableId !== destination.droppableId) {
      onDragEnd(draggableId, destination.droppableId);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex items-start gap-4 overflow-x-auto overflow-y-hidden h-[calc(100vh-220px)] p-4 pb-0">
        {lists.map((list) => (
          <Droppable droppableId={list} key={list}>
            {(provided, snapshot) => {
              const isDraggingOver = Boolean(snapshot.isDraggingOver);
              const isDraggingFrom = Boolean(snapshot.draggingFromThisWith);

              return (
                <div
                  key={list}
                  className={`flex-shrink-0 w-80 bg-gray-100 dark:bg-slate-900/50 max-h-full rounded-lg flex flex-col border
                  ${isDraggingOver ? "dark:border-white/35" : "border-white/0"} transition-all duration-200 overflow-x-hidden`}
                >
                  <div className="p-4 pb-2">
                    <h3 className="font-semibold capitalize">{list}</h3>
                  </div>
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-x-hidden overflow-y-auto max-h-full p-4 pt-2 transition-all duration-200`}
                  >
                    <div
                      className={`space-y-4 transition-all duration-200 ${
                        isDraggingFrom ? "opacity-50" : "opacity-100"
                      }`}
                    >
                      {grievances
                        .filter((grievance) => grievance.status === list)
                        .map((grievance, index) => (
                          <Draggable
                            key={grievance._id}
                            draggableId={grievance._id.toString()}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <GrievanceCard
                                grievance={grievance}
                                provided={provided}
                                snapshot={snapshot}
                                location={location}
                              />
                            )}
                          </Draggable>
                        ))}
                    </div>
                    {provided.placeholder}
                  </div>
                </div>
              );
            }}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
};

export default GrievanceBoardView;
