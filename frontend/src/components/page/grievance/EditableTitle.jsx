import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";

const EditableTitle = ({ grievance, handleUpdateGrievance, canEditTitle }) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  const handleTitleChange = async (newTitle) => {
    try {
      await handleUpdateGrievance({ title: newTitle });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update title:", error);
    }
  };

  return (
    <div>
      {isEditing && canEditTitle ? (
        <Input
          ref={inputRef}
          defaultValue={grievance?.data?.title}
          onBlur={(e) => handleTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleTitleChange(e.target.value);
            if (e.key === "Escape") setIsEditing(false);
          }}
          className="text-xl font-medium bg-transparent border-slate-700 text-black dark:text-white"
          autoFocus
        />
      ) : (
        <h2
          onClick={() => setIsEditing(true)}
          className={`text-xl font-medium hover:underline text-black dark:text-white ${canEditTitle ? "cursor-pointer" : ""}`}
        >
          {grievance?.data?.title || "Grievance Title"}
        </h2>
      )}
    </div>
  );
};

export default EditableTitle;
