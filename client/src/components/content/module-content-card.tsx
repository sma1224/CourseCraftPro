import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, FileText, Plus, CheckCircle, AlertCircle } from "lucide-react";

interface ModuleContentCardProps {
  module: any;
  moduleContent?: any;
  moduleIndex: number;
  onCreateContent: () => void;
}

export default function ModuleContentCard({ 
  module, 
  moduleContent, 
  moduleIndex, 
  onCreateContent 
}: ModuleContentCardProps) {
  const hasContent = moduleContent && Object.keys(moduleContent.content || {}).length > 0;
  
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
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
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
            </div>
          )}
          
          {/* Action Button */}
          <div className="pt-2">
            <Button 
              onClick={onCreateContent}
              className="w-full"
              variant={hasContent ? "outline" : "default"}
            >
              {hasContent ? (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  View & Edit Content
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Content
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}