import { useState, useCallback } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { 
  Bold, 
  Italic, 
  Link as LinkIcon, 
  List, 
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Undo,
  Redo,
  MinusSquare,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ExternalLink,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RichTextEditor = ({ initialContent, onSave, className }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [originalContent, setOriginalContent] = useState(initialContent);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2]
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc list-outside ml-4'
          }
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal list-outside ml-4'
          }
        },
        listItem: {
          HTMLAttributes: {
            class: 'pl-1'
          }
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-slate-700 pl-4 my-4'
          }
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-400 hover:text-blue-500 underline cursor-pointer'
        }
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'blockquote'],
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-invert min-h-[200px] p-3 focus:outline-none max-w-none',
          'prose-p:text-slate-300 prose-headings:text-slate-200',
          'prose-blockquote:border-l-slate-700 prose-blockquote:text-slate-300',
          'prose-blockquote:font-normal prose-blockquote:not-italic',
          'prose-blockquote:pl-4 prose-blockquote:my-4',
          'prose-pre:bg-slate-800 prose-pre:text-slate-300',
          'prose-ul:text-slate-300 prose-ol:text-slate-300',
          'prose-ul:my-2 prose-ol:my-2',
          'prose-li:my-0',
          'prose-code:text-slate-300 prose-code:bg-slate-800/50 prose-code:rounded prose-code:px-1',
          'prose-a:text-blue-400 prose-a:hover:text-blue-500',
          className
        ),
      },
    },
    onUpdate: ({ editor }) => {
      if (!isEditing) setIsEditing(true);
      console.log(editor.getHTML());
    },
  });

  const handleSave = useCallback(() => {
    if (editor) {
      const content = editor.getHTML();
      onSave(content);
      setOriginalContent(content);
      setIsEditing(false);
    }
  }, [editor, onSave]);

  const handleCancel = useCallback(() => {
    if (editor) {
      editor.commands.setContent(originalContent);
      setIsEditing(false);
    }
  }, [editor, originalContent]);

  const addLink = useCallback(() => {
    if (editor && linkUrl) {
      // If there's no selection, don't add the link
      if (editor.state.selection.empty) {
        return;
      }

      editor
        .chain()
        .focus()
        .setLink({ href: linkUrl })
        .run();

      setLinkUrl('');
      setLinkDialogOpen(false);
    }
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    if (editor) {
      editor
        .chain()
        .focus()
        .unsetLink()
        .run();
    }
  }, [editor]);

  if (!editor) return null;

  const ToolbarButton = ({ onClick, isActive, icon: Icon, title, disabled }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8 transition-colors",
        isActive && "bg-slate-700 text-white",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      title={title}
      disabled={disabled}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  const toolbarItems = [
    {
      icon: Heading1,
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: () => editor.isActive('heading', { level: 1 }),
      title: 'Heading 1'
    },
    {
      icon: Heading2,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor.isActive('heading', { level: 2 }),
      title: 'Heading 2'
    },
    { type: 'separator' },
    {
      icon: Bold,
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive('bold'),
      title: 'Bold (Ctrl+B)'
    },
    {
      icon: Italic,
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive('italic'),
      title: 'Italic (Ctrl+I)'
    },
    {
      icon: Code,
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: () => editor.isActive('code'),
      title: 'Inline Code'
    },
    {
      icon: LinkIcon,
      action: () => {
        if (editor.isActive('link')) {
          removeLink();
        } else {
          setLinkDialogOpen(true);
        }
      },
      isActive: () => editor.isActive('link'),
      title: 'Add Link'
    },
    { type: 'separator' },
    {
      icon: List,
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: () => editor.isActive('bulletList'),
      title: 'Bullet List'
    },
    {
      icon: ListOrdered,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: () => editor.isActive('orderedList'),
      title: 'Numbered List'
    },
    { type: 'separator' },
    {
      icon: Quote,
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: () => editor.isActive('blockquote'),
      title: 'Quote'
    },
    {
      icon: MinusSquare,
      action: () => editor.chain().focus().setHorizontalRule().run(),
      title: 'Horizontal Rule'
    },
    { type: 'separator' },
    {
      icon: AlignLeft,
      action: () => editor.chain().focus().setTextAlign('left').run(),
      isActive: () => editor.isActive({ textAlign: 'left' }),
      title: 'Align Left'
    },
    {
      icon: AlignCenter,
      action: () => editor.chain().focus().setTextAlign('center').run(),
      isActive: () => editor.isActive({ textAlign: 'center' }),
      title: 'Align Center'
    },
    {
      icon: AlignRight,
      action: () => editor.chain().focus().setTextAlign('right').run(),
      isActive: () => editor.isActive({ textAlign: 'right' }),
      title: 'Align Right'
    },
    { type: 'separator' },
    {
      icon: Undo,
      action: () => editor.chain().focus().undo().run(),
      disabled: () => !editor.can().undo(),
      title: 'Undo (Ctrl+Z)'
    },
    {
      icon: Redo,
      action: () => editor.chain().focus().redo().run(),
      disabled: () => !editor.can().redo(),
      title: 'Redo (Ctrl+Shift+Z)'
    },
  ];

  return (
    <>
      <div className="rounded-lg border border-slate-700 overflow-hidden">
        <div className="bg-slate-900/50 p-2 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center flex-wrap gap-1">
            {toolbarItems.map((item, index) => 
              item.type === 'separator' ? (
                <div key={index} className="h-6 w-px bg-slate-700 mx-1" />
              ) : (
                <ToolbarButton
                  key={index}
                  icon={item.icon}
                  onClick={item.action}
                  isActive={item.isActive ? item.isActive() : false}
                  disabled={item.disabled ? item.disabled() : false}
                  title={item.title}
                />
              )
            )}
          </div>
          
          {isEditing && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-slate-400 hover:text-slate-300"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save
              </Button>
            </div>
          )}
        </div>
        
        {editor && (
          <BubbleMenu 
            editor={editor} 
            tippyOptions={{ duration: 100 }}
            className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 flex overflow-hidden"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("rounded-none", editor.isActive('bold') && "bg-slate-700")}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("rounded-none", editor.isActive('italic') && "bg-slate-700")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("rounded-none", editor.isActive('code') && "bg-slate-700")}
              onClick={() => editor.chain().focus().toggleCode().run()}
            >
              <Code className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("rounded-none", editor.isActive('link') && "bg-slate-700")}
              onClick={() => {
                if (editor.isActive('link')) {
                  removeLink();
                } else {
                  setLinkDialogOpen(true);
                }
              }}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </BubbleMenu>
        )}
        
        <EditorContent editor={editor} />
      </div>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Input
                type="url"
                placeholder="Paste a link"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="bg-slate-900 border-slate-700 text-slate-300"
              />
            </div>
            <Button 
              type="button"
              size="sm"
              className="px-3 bg-blue-600 hover:bg-blue-700"
              onClick={addLink}
              disabled={!linkUrl}
            >
              <span className="sr-only">Add Link</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RichTextEditor;
