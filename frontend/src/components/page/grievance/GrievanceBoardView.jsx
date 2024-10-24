import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

const GrievanceBoardView = ({ grievances, onDragEnd }) => {
  const lists = ["submitted", "in-progress", "resolved", "dismissed"];

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
      <div className="flex items-start gap-4 overflow-x-auto p-4">
        {lists.map((list) => (
          <Droppable droppableId={list} key={list}>
            {(provided, snapshot) => {
              const isDraggingOver = Boolean(snapshot.isDraggingOver);
              const isDraggingFrom = Boolean(snapshot.draggingFromThisWith);

              return (
                <div
                  key={list}
                  className={`flex-shrink-0 w-80 bg-gray-100 dark:bg-gray-50/10 rounded-lg flex flex-col ${isDraggingOver ? "border border-white/50" : ""} transition-all duration-200 overflow-x-hidden`}
                >
                  <div className="p-4 pb-2">
                    <h3 className="font-semibold capitalize">{list}</h3>
                  </div>
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`
                      flex-1 overflow-y-auto p-4 pt-2 transition-all duration-200 min-h-[10px]
                      ${isDraggingOver ? "min-h-[6rem]" : "min-h-0"}
                    `}
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
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="transition-transform duration-200"
                              >
                                <Card
                                  className={`border shadow-sm transition-all duration-200 ${
                                    snapshot.isDragging
                                      ? "shadow-lg rotate-2"
                                      : "hover:shadow-md"
                                  }`}
                                >
                                  <CardHeader className="p-4 pb-2">
                                    <h4 className="font-semibold">
                                      {grievance.title}
                                    </h4>
                                  </CardHeader>
                                  <CardContent className="p-4 pt-2">
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                      {grievance.description}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                      Reported by:{" "}
                                      {grievance.reported_by.username}
                                    </p>
                                  </CardContent>
                                </Card>
                              </div>
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
