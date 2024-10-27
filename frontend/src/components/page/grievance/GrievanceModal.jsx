import { useState, useRef } from "react";
// import { useParams } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { RoutableModal } from "@/components/ui/RoutedModal";
import cn from "classnames";
import { useParams } from "react-router-dom";
import { useGetGrievanceByIdQuery } from "@/services/api.service";

// Example of a custom grievance modal using the container
function GrievanceModal() {
  const { id: grievanceId } = useParams();

  const { data: grievanceData } = useGetGrievanceByIdQuery(grievanceId, {
    skip: !grievanceId,
  });

  return (
    <RoutableModal
      backTo="/grievances"
      title={<EditableTitle grievanceData={grievanceData} />}
    >
      <div className="space-y-4">
        {/* Custom Content */}
        <div className="p-6">
          <div className="space-y-4">
            <p>{grievanceData?.data?.description || "ass"}</p>
            {/* Add other grievance details */}
          </div>
        </div>

        {/* Custom Footer if needed */}
        <div className="p-6 border-t">{/* Add footer content */}</div>
      </div>
    </RoutableModal>
  );
}

export default GrievanceModal;

const EditableTitle = ({ grievanceData }) => {
  const [isEditing, setIsEditing] = useState(false);
  // const hasEditPermission = usePermissions('edit-grievance');
  const inputRef = useRef(null);

  const handleTitleChange = async () => {
    try {
      // await updateGrievanceTitle(id, newTitle);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update title:", error);
    }
  };

  return (
    <div className="p-6 border-b">
      {isEditing ? (
        <Input
          ref={inputRef}
          defaultValue={grievanceData?.data?.title}
          onBlur={(e) => handleTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleTitleChange(e.target.value);
            if (e.key === "Escape") setIsEditing(false);
          }}
          className="text-lg font-semibold"
          autoFocus
        />
      ) : (
        <h2
          // onClick={() => hasEditPermission && setIsEditing(true)}
          className={cn(
            "text-lg font-semibold"
            //   hasEditPermission && "cursor-pointer hover:text-muted-foreground"
          )}
        >
          {grievanceData?.data?.title || "Grievance Title"}
        </h2>
      )}
    </div>
  );
};
