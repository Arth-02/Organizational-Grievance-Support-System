import { useState } from 'react';
import { Menu, Edit2 } from 'lucide-react';
import RichTextEditor from './TextEditor';

const EditableDescription = ({ 
  description, 
  canEdit, 
  onSave 
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleDescriptionSave = (content) => {
    onSave(content);
    setIsEditing(false);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <Menu className="h-5 w-5" />
        <h3 className="text-sm font-medium text-gray-600 dark:text-slate-300">Description</h3>
        {canEdit && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)} 
            className="ml-auto flex items-center justify-between gap-1 px-2 py-1 transition-all rounded-md dark:bg-slate-800 bg-gray-600 hover:bg-gray-800 dark:hover:bg-slate-700/50"
          >
            <Edit2 className="h-4 w-4" /> Edit
          </button>
        )}
      </div>
      
      {isEditing ? (
        <RichTextEditor
          initialContent={description || ""}
          onSave={handleDescriptionSave}
          className={canEdit ? "border dark:border-slate-700" : "border-none"}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div 
          className="min-h-[80px] p-2"
          onClick={() => canEdit && setIsEditing(true)}
          dangerouslySetInnerHTML={{ __html: description || "No description provided" }}
        />
      )}
    </div>
  );
};

export default EditableDescription;
