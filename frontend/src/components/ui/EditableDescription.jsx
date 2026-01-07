import { useState, useEffect } from 'react';
import { Menu, Edit2, Save, X } from 'lucide-react';
import RichTextEditor from './TextEditor';
import { Button } from './button';

const EditableDescription = ({
  description,
  canEdit,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(description || "");

  // Sync with external description prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditedContent(description || "");
    }
  }, [description, isEditing]);

  const handleSave = () => {
    // Call parent's optimistic update handler (doesn't wait for API)
    onSave(editedContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(description || "");
    setIsEditing(false);
  };

  const handleContentChange = (content) => {
    setEditedContent(content);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <Menu className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
        
        {canEdit && !isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="ml-auto text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
        )}

        {isEditing && (
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              className="text-primary hover:text-primary/90 gap-1.5 bg-primary/15 hover:bg-primary/25"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="grievance-text-editor">
          <RichTextEditor
            initialContent={editedContent}
            onChange={handleContentChange}
            onSave={() => {}}
            onCancel={() => {}}
            className="!bg-background/50"
          />
        </div>
      ) : (
        <div
          className="min-h-[80px] p-3 rounded-lg bg-muted/30 prose prose-sm dark:prose-invert max-w-none"
          onClick={() => canEdit && setIsEditing(true)}
          dangerouslySetInnerHTML={{ __html: description || "<span class='text-muted-foreground italic'>No description provided</span>" }}
        />
      )}
    </div>
  );
};

export default EditableDescription;
