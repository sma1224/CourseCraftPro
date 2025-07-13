import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Typography from '@tiptap/extension-typography';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { Highlight } from '@tiptap/extension-highlight';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { ListItem } from '@tiptap/extension-list-item';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Link, 
  Heading1, 
  Heading2, 
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Save,
  Eye,
  Edit3
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onSave?: (content: string) => void;
  readOnly?: boolean;
  title?: string;
}

export default function RichTextEditor({ 
  content, 
  onSave, 
  readOnly = false, 
  title = "Module Content" 
}: RichTextEditorProps) {
  const [isEditing, setIsEditing] = useState(!readOnly);
  const [hasChanges, setHasChanges] = useState(false);

  // Convert markdown to HTML for proper display
  const convertMarkdownToHtml = (markdown: string): string => {
    if (!markdown || typeof markdown !== 'string') return '';
    
    try {
      // Split content into paragraphs first
      const paragraphs = markdown.split(/\n\s*\n/);
    
      let html = paragraphs.map(paragraph => {
        const trimmed = paragraph.trim();
        if (!trimmed) return '';
        
        // Handle headers
        if (trimmed.startsWith('##')) {
          const level = trimmed.match(/^#+/)?.[0].length || 2;
          const text = trimmed.replace(/^#+\s*/, '');
          return `<h${level}>${text}</h${level}>`;
        }
        
        // Handle regular paragraphs
        let processed = trimmed
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/\n/g, '<br>');
        
        return `<p>${processed}</p>`;
      }).filter(p => p).join('');
      
      return html;
    } catch (error) {
      console.error('Error converting markdown to HTML:', error);
      return `<p>${markdown}</p>`;
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Typography,
      TextStyle,
      Color,
      FontFamily,
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      ListItem,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: convertMarkdownToHtml(content || ''),
    editable: isEditing,
    onUpdate: ({ editor }) => {
      try {
        setHasChanges(true);
      } catch (error) {
        console.error('Error in editor update:', error);
      }
    },
  });

  useEffect(() => {
    if (editor && content !== undefined) {
      try {
        const htmlContent = convertMarkdownToHtml(content || '');
        editor.commands.setContent(htmlContent);
        setHasChanges(false);
      } catch (error) {
        console.error('Error setting editor content:', error);
      }
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  const handleSave = () => {
    if (editor && onSave) {
      const htmlContent = editor.getHTML();
      onSave(htmlContent);
      setHasChanges(false);
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    if (isEditing && hasChanges) {
      handleSave();
    }
  };

  if (!editor) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading editor...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 flex-shrink-0">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <>
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                onClick={toggleEdit}
                className="gap-2"
              >
                {isEditing ? <Eye className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                {isEditing ? "Preview" : "Edit"}
              </Button>
              {isEditing && hasChanges && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              )}
            </>
          )}
        </div>
      </CardHeader>
      
      {isEditing && (
        <div className="px-6 pb-4">
          <div className="flex flex-wrap items-center gap-1 p-2 border rounded-lg bg-gray-50">
            {/* Text Formatting */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn(
                  "h-8 w-8 p-0",
                  editor.isActive('bold') ? 'bg-gray-200' : ''
                )}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn(
                  "h-8 w-8 p-0",
                  editor.isActive('italic') ? 'bg-gray-200' : ''
                )}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={cn(
                  "h-8 w-8 p-0",
                  editor.isActive('underline') ? 'bg-gray-200' : ''
                )}
              >
                <UnderlineIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={cn(
                  "h-8 w-8 p-0",
                  editor.isActive('strike') ? 'bg-gray-200' : ''
                )}
              >
                <Strikethrough className="h-4 w-4" />
              </Button>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            {/* Headings */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={cn(
                  "h-8 w-8 p-0",
                  editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''
                )}
              >
                <Heading1 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={cn(
                  "h-8 w-8 p-0",
                  editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''
                )}
              >
                <Heading2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={cn(
                  "h-8 w-8 p-0",
                  editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''
                )}
              >
                <Heading3 className="h-4 w-4" />
              </Button>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            {/* Lists */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn(
                  "h-8 w-8 p-0",
                  editor.isActive('bulletList') ? 'bg-gray-200' : ''
                )}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={cn(
                  "h-8 w-8 p-0",
                  editor.isActive('orderedList') ? 'bg-gray-200' : ''
                )}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            {/* Alignment */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={cn(
                  "h-8 w-8 p-0",
                  editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''
                )}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={cn(
                  "h-8 w-8 p-0",
                  editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''
                )}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={cn(
                  "h-8 w-8 p-0",
                  editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''
                )}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            {/* Other */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={cn(
                  "h-8 w-8 p-0",
                  editor.isActive('blockquote') ? 'bg-gray-200' : ''
                )}
              >
                <Quote className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={cn(
                  "h-8 w-8 p-0",
                  editor.isActive('code') ? 'bg-gray-200' : ''
                )}
              >
                <Code className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <CardContent className="p-6 pt-0 flex-1 overflow-hidden">
        <div className={cn(
          "prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none h-full overflow-y-auto",
          "prose-headings:font-semibold prose-headings:text-gray-900",
          "prose-p:text-gray-700 prose-p:leading-relaxed",
          "prose-strong:text-gray-900 prose-strong:font-semibold",
          "prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
          "prose-pre:bg-gray-100 prose-pre:border",
          "prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:pl-4",
          "prose-ul:list-disc prose-ol:list-decimal",
          "prose-li:text-gray-700",
          "prose-table:table-auto prose-table:border-collapse",
          "prose-th:border prose-th:bg-gray-50 prose-th:p-2 prose-th:font-semibold",
          "prose-td:border prose-td:p-2",
          isEditing ? "min-h-[400px]" : ""
        )}>
          <EditorContent 
            editor={editor}
            className={cn(
              "focus:outline-none h-full",
              isEditing ? "border rounded-lg p-4 bg-white" : ""
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}