import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, BookOpen, FileText, Plus, CheckCircle, AlertCircle, Eye, Sparkles } from "lucide-react";
import RichTextEditor from "@/components/editor/rich-text-editor";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ModuleContentCardProps {
  module: any;
  moduleContent?: any;
  moduleIndex: number;
  onCreateContent: () => void;
  outlineId: number;
}

export default function ModuleContentCard({ 
  module, 
  moduleContent, 
  moduleIndex, 
  onCreateContent,
  outlineId 
}: ModuleContentCardProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const hasContent = moduleContent && moduleContent.content && 
    (typeof moduleContent.content === 'string' ? moduleContent.content.trim().length > 0 : 
     Object.keys(moduleContent.content).length > 0);
  
  const updateContentMutation = useMutation({
    mutationFn: async (newContent: string) => {
      return apiRequest(`/api/module-content/${moduleContent.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: module.title,
          content: newContent
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Content Updated",
        description: "Module content has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/outlines/${outlineId}/module-contents`] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to save content changes. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleContentSave = (content: string) => {
    updateContentMutation.mutate(content);
  };
  
  return (
    <Card className="w-full border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Module {moduleIndex + 1}: {module.title}
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {module.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{module.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>{module.lessons?.length || 0} lessons</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasContent ? (
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
                <AlertCircle className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Learning Objectives */}
          {module.learningObjectives && module.learningObjectives.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Learning Objectives:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {module.learningObjectives.slice(0, 3).map((objective: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{objective}</span>
                  </li>
                ))}
                {module.learningObjectives.length > 3 && (
                  <li className="text-gray-500 text-xs">
                    +{module.learningObjectives.length - 3} more...
                  </li>
                )}
              </ul>
            </div>
          )}
          
          {/* Content Preview */}
          {hasContent && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Generated Content Available
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {typeof moduleContent.content === 'string' ? (
                  <div className="line-clamp-3">
                    {moduleContent.content.substring(0, 150)}...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {moduleContent.content.lessons && (
                      <div>• {moduleContent.content.lessons.length} detailed lessons</div>
                    )}
                    {moduleContent.content.exercises && (
                      <div>• {moduleContent.content.exercises.length} exercises</div>
                    )}
                    {moduleContent.content.caseStudies && (
                      <div>• {moduleContent.content.caseStudies.length} case studies</div>
                    )}
                    {moduleContent.content.assessments && (
                      <div>• {moduleContent.content.assessments.length} assessments</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            {hasContent ? (
              <div className="flex gap-2">
                <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline"
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Content
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                      <DialogTitle>
                        Module {moduleIndex + 1}: {module.title}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden">
                      <div className="h-full border rounded-lg">
                        <RichTextEditor 
                          content={moduleContent.content || ''}
                          onSave={handleContentSave}
                          title={module.title}
                          readOnly={false}
                        />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button 
                  onClick={onCreateContent}
                  variant="default"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Smart Generator
                </Button>
              </div>
            ) : (
              <Button 
                onClick={onCreateContent}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Smart Generator
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}