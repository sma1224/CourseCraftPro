import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { 
  FileText, 
  Edit,
  Copy,
  Download,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LessonContentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  outlineId: number;
  moduleIndex: number;
  lessonIndex: number;
  lessonTitle: string;
  onEdit?: () => void;
}

export default function LessonContentViewer({
  isOpen,
  onClose,
  outlineId,
  moduleIndex,
  lessonIndex,
  lessonTitle,
  onEdit
}: LessonContentViewerProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");

  // Fetch lesson content
  const { data: lessonContents, isLoading } = useQuery({
    queryKey: [`/api/outlines/${outlineId}/lessons`],
    enabled: isOpen && !!outlineId,
    retry: false,
  });

  const currentLesson = lessonContents?.find((lc: any) => lc.lessonIndex === lessonIndex);
  const content = currentLesson?.content || "";

  const handleCopyContent = () => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Content Copied",
      description: "Lesson content has been copied to clipboard.",
    });
  };

  const handleDownloadContent = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lessonTitle.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Content Downloaded",
      description: "Lesson content has been downloaded as a markdown file.",
    });
  };

  const renderMarkdownContent = (markdown: string) => {
    // Simple markdown-to-JSX renderer for basic formatting
    const lines = markdown.split('\n');
    const elements: JSX.Element[] = [];
    
    lines.forEach((line, index) => {
      if (line.startsWith('# ')) {
        elements.push(<h1 key={index} className="text-2xl font-bold mt-6 mb-3 text-blue-900 dark:text-blue-100">{line.slice(2)}</h1>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={index} className="text-xl font-semibold mt-5 mb-2 text-blue-800 dark:text-blue-200">{line.slice(3)}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={index} className="text-lg font-medium mt-4 mb-2 text-blue-700 dark:text-blue-300">{line.slice(4)}</h3>);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(<li key={index} className="ml-4 mb-1">{line.slice(2)}</li>);
      } else if (line.startsWith('1. ') || /^\d+\. /.test(line)) {
        const match = line.match(/^\d+\. (.+)$/);
        if (match) {
          elements.push(<li key={index} className="ml-4 mb-1 list-decimal">{match[1]}</li>);
        }
      } else if (line.trim() === '') {
        elements.push(<br key={index} />);
      } else if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
        elements.push(<p key={index} className="font-bold mb-2">{line.trim().slice(2, -2)}</p>);
      } else {
        elements.push(<p key={index} className="mb-2 leading-relaxed">{line}</p>);
      }
    });
    
    return elements;
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span>{lessonTitle}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {content.length} characters
              </Badge>
              {currentLesson?.status === 'complete' && (
                <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            Module {moduleIndex + 1}, Lesson {lessonIndex + 1}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyContent}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadContent}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Content
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {content ? (
          <ScrollArea className="h-[500px] border rounded-lg p-6 bg-white dark:bg-gray-900">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="space-y-2">
                {renderMarkdownContent(content)}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center h-64 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="text-center space-y-4">
              <FileText className="h-16 w-16 text-gray-400 mx-auto" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">No Content Available</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  This lesson doesn't have any generated content yet.
                </p>
                {onEdit && (
                  <Button onClick={onEdit} className="mt-4">
                    Generate Content
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}