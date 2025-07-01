import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Target, CheckCircle, Circle, AlertCircle, Edit, Plus } from "lucide-react";

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
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Circle className="h-4 w-4 text-blue-600" />;
      case 'needs_review':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'needs_review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const hasContent = moduleContent?.content;
  const estimatedTime = moduleContent?.estimatedTime || 120; // Default 2 hours
  const lessonsCount = module.lessons?.length || 0;
  const activitiesCount = module.activities?.length || 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">
              Module {moduleIndex + 1}
            </CardTitle>
            <CardDescription className="font-medium text-base mt-1">
              {module.title}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(moduleContent?.status)}
            <Badge className={`text-xs ${getStatusColor(moduleContent?.status)}`}>
              {moduleContent?.status?.replace('_', ' ') || 'Not Started'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Module Overview */}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {module.description}
          </p>
        </div>

        {/* Module Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600 dark:text-gray-300">
              {Math.round(estimatedTime / 60)}h to create
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600 dark:text-gray-300">
              {lessonsCount + activitiesCount} components
            </span>
          </div>
        </div>

        {/* Learning Objectives Preview */}
        {module.learningObjectives && module.learningObjectives.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Learning Objectives</h4>
            <div className="space-y-1">
              {module.learningObjectives.slice(0, 2).map((objective: string, index: number) => (
                <div key={index} className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-1">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span className="line-clamp-1">{objective}</span>
                </div>
              ))}
              {module.learningObjectives.length > 2 && (
                <div className="text-xs text-gray-500">
                  +{module.learningObjectives.length - 2} more objectives
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Status */}
        {hasContent ? (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Content Created
              </span>
            </div>
            <p className="text-xs text-green-700 dark:text-green-300 mb-3">
              Detailed content has been generated for this module including lessons, exercises, and assessments.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={onCreateContent}
              className="w-full"
            >
              <Edit className="h-3 w-3 mr-2" />
              Edit Content
            </Button>
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Plus className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Ready for Content Creation
              </span>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
              Transform this module outline into detailed, engaging course content.
            </p>
            <Button
              size="sm"
              onClick={onCreateContent}
              className="w-full"
            >
              <Plus className="h-3 w-3 mr-2" />
              Create Content
            </Button>
          </div>
        )}

        {/* Progress Bar for In Progress */}
        {moduleContent?.status === 'in_progress' && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Content Generation</span>
              <span className="text-gray-600">In Progress</span>
            </div>
            <Progress value={60} className="h-1" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}