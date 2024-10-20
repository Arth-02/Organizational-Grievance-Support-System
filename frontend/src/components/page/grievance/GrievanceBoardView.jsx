import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

const GrievanceBoardView = ({ grievances, onDragEnd }) => {
  const lists = ['reviewing', 'submitted', 'in-progress', 'resolved', 'dismissed'];

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
      <div className="flex h-full overflow-x-auto">
        {lists.map((list) => (
          <div key={list} className="flex-shrink-0 w-80 bg-gray-100 p-4 m-2 rounded-lg flex flex-col h-full">
            <h3 className="font-semibold mb-4 capitalize">{list}</h3>
            <Droppable droppableId={list}>
              {(provided) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  className="flex-grow overflow-y-auto min-h-[500px]"
                >
                  {grievances
                    .filter((grievance) => grievance.status === list)
                    .map((grievance, index) => (
                      <Draggable key={grievance._id} draggableId={grievance._id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-4 ${snapshot.isDragging ? 'opacity-50' : ''}`}
                          >
                            <Card className="bg-white">
                              <CardHeader className="font-semibold">{grievance.title}</CardHeader>
                              <CardContent>
                                <p className="text-sm text-gray-600">{grievance.description}</p>
                                <p className="text-xs text-gray-400 mt-2">
                                  Reported by: {grievance.reported_by.username}
                                </p>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default GrievanceBoardView;