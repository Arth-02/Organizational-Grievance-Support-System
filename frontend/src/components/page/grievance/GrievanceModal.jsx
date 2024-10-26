import  { useState, useRef } from 'react';
// import { useParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { RoutableModal } from '@/components/ui/RoutedModal';
import cn from 'classnames';

// Example of a custom grievance modal using the container
function GrievanceModal() {

    console.log('modal')
    // const { id } = useParams();
    const [grievance, setGrievance] = useState(/* fetch grievance data */);
    const [isEditing, setIsEditing] = useState(false);
    // const hasEditPermission = usePermissions('edit-grievance');
    const inputRef = useRef(null);
  
    const handleTitleChange = async (newTitle) => {
      try {
        // await updateGrievanceTitle(id, newTitle);
        setGrievance(prev => ({ ...prev, title: newTitle }));
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to update title:', error);
      }
    };
  
    return (
      <RoutableModal backTo="/grievances">
        <div className="space-y-4">
          {/* Custom Header */}
          <div className="p-6 border-b">
            {isEditing ? (
              <Input
                ref={inputRef}
                // defaultValue={grievance.title}
                onBlur={(e) => handleTitleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleChange(e.target.value);
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                className="text-lg font-semibold"
                autoFocus
              />
            ) : (
              <h2 
                // onClick={() => hasEditPermission && setIsEditing(true)}
                className={cn(
                  "text-lg font-semibold",
                //   hasEditPermission && "cursor-pointer hover:text-muted-foreground"
                )}
              >
                {grievance?.title || 'Grievance Title'}
              </h2>
            )}
          </div>
  
          {/* Custom Content */}
          <div className="p-6">
            <div className="space-y-4">
              <p>{grievance?.description || 'ass'}</p>
              {/* Add other grievance details */}
            </div>
          </div>
  
          {/* Custom Footer if needed */}
          <div className="p-6 border-t">
            {/* Add footer content */}
          </div>
        </div>
      </RoutableModal>
    );
  }
  
    export default GrievanceModal;