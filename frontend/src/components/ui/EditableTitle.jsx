import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";

const EditableTitle = ({ title, canEditTitle, updateTitle }) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  const handleTitleChange = async (newTitle) => {
    try {
      await updateTitle({ title: newTitle });
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
          defaultValue={title}
          onBlur={(e) => handleTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleTitleChange(e.target.value);
            if (e.key === "Escape") setIsEditing(false);
          }}
          className="text-xl font-medium bg-transparent border-slate-700 text-gray-800 dark:text-gray-200"
          autoFocus
        />
      ) : (
        <h2
          onClick={() => setIsEditing(true)}
          className={`text-xl font-medium hover:underline text-gray-800 dark:text-gray-200 ${canEditTitle ? "cursor-pointer" : ""}`}
        >
          {title || "Title"}
        </h2>
      )}
    </div>
  );
};

export default EditableTitle;
