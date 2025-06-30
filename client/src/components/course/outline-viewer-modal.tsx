import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Download, 
  Edit, 
  RotateCcw, 
  Clock, 
  Users, 
  Target, 
  CheckCircle,
  Play,
  MessageSquare,
  PencilIcon,
  BookOpen,
  Link,
  BarChart,
  X
} from "lucide-react";

interface OutlineViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  outline: {
    title: string;
    description: string;
    targetAudience: string;
    totalDuration: string;
    courseType: string;
    learningObjectives: string[];
    modules: Array<{
      title: string;
      duration: string;
      description: string;
      learningObjectives: string[];
      lessons: Array<{
        title: string;
        duration: string;
        description: string;
        activities: string[];
        format: string[];
      }>;
      activities: Array<{
        type: string;
        title: string;
        description: string;
      }>;
      resources: Array<{
        type: string;
        title: string;
        description?: string;
      }>;
    }>;
    assessments: Array<{
      type: string;
      title: string;
      description: string;
    }>;
    resources: Array<{
      type: string;
      title: string;
      description?: string;
    }>;
  };
  onSave: () => void;
  isSaving: boolean;
}

export default function OutlineViewerModal({ 
  isOpen, 
  onClose, 
  outline, 
  onSave, 
  isSaving 
}: OutlineViewerModalProps) {
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);

  const getActivityIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'video':
        return Play;
      case 'interactive':
        return Target;
      case 'q&a':
        return MessageSquare;
      default:
        return BookOpen;
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return FileText;
      case 'link':
        return Link;
      case 'tool':
        return BarChart;
      default:
        return BookOpen;
    }
  };

  const selectedModule = outline.modules[selectedModuleIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0">
        <DialogHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">{outline.title}</DialogTitle>
              <p className="text-gray-600 mt-1">{outline.description}</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="course-secondary-btn">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex h-[calc(95vh-120px)]">
          {/* Sidebar Navigation */}
          <div className="w-80 border-r bg-gray-50 dark:bg-gray-900 overflow-y-auto custom-scrollbar">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Course Structure</h3>
              <div className="space-y-2">
                {outline.modules.map((module, index) => (
                  <div
                    key={index}
                    className={`rounded-lg p-3 border cursor-pointer transition-all ${
                      selectedModuleIndex === index
                        ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/50'
                        : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-blue-900/50'
                    }`}
                    onClick={() => setSelectedModuleIndex(index)}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${
                        selectedModuleIndex === index ? 'text-blue-900 dark:text-blue-200' : 'text-gray-900 dark:text-white'
                      }`}>
                        Module {index + 1}: {module.title}
                      </span>
                      <span className={`text-xs ${
                        selectedModuleIndex === index ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {module.duration}
                      </span>
                    </div>
                    <ul className={`mt-2 space-y-1 text-sm ${
                      selectedModuleIndex === index ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {module.lessons.slice(0, 3).map((lesson, lessonIndex) => (
                        <li key={lessonIndex}>• {lesson.title}</li>
                      ))}
                      {module.lessons.length > 3 && (
                        <li>• +{module.lessons.length - 3} more lessons</li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6">
              {/* Module Header */}
              <div className="bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mb-3">
                  Module {selectedModuleIndex + 1}: {selectedModule.title}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-blue-700 dark:text-blue-300 mb-4">
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Duration: {selectedModule.duration}
                  </span>
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    Target: {outline.targetAudience}
                  </span>
                  <span className="flex items-center">
                    <Target className="h-4 w-4 mr-1" />
                    Format: {outline.courseType}
                  </span>
                </div>
                <p className="text-blue-800 dark:text-blue-200">{selectedModule.description}</p>
              </div>

              <div className="space-y-6">
                {/* Learning Objectives */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Learning Objectives</h3>
                  <ul className="space-y-2">
                    {selectedModule.learningObjectives.map((objective, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Lessons */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Lesson Breakdown</h3>
                  <div className="space-y-4">
                    {selectedModule.lessons.map((lesson, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          {selectedModuleIndex + 1}.{index + 1} {lesson.title} ({lesson.duration})
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">{lesson.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          {lesson.format.map((format, formatIndex) => {
                            const IconComponent = getActivityIcon(format);
                            return (
                              <span key={formatIndex} className="flex items-center">
                                <IconComponent className="h-4 w-4 mr-1" />
                                {format}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activities & Assessments */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Activities & Assessments</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedModule.activities.map((activity, index) => (
                      <div key={index} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <h4 className="font-medium text-yellow-900 dark:text-yellow-200 mb-2">
                          {activity.type}: {activity.title}
                        </h4>
                        <p className="text-sm text-yellow-800 dark:text-yellow-300">{activity.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resources */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Resources & Materials</h3>
                  <div className="space-y-2">
                    {selectedModule.resources.map((resource, index) => {
                      const IconComponent = getResourceIcon(resource.type);
                      return (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <IconComponent className={`h-5 w-5 ${
                            resource.type.toLowerCase() === 'pdf' ? 'text-red-600' :
                            resource.type.toLowerCase() === 'link' ? 'text-blue-600' :
                            'text-green-600'
                          }`} />
                          <div>
                            <span className="text-gray-900 dark:text-white font-medium">{resource.title}</span>
                            {resource.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">{resource.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t bg-gray-50 dark:bg-gray-900 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Outline
              </Button>
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Word
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button 
                onClick={onSave}
                disabled={isSaving}
                className="course-primary-btn"
              >
                {isSaving ? "Saving..." : "Save Project"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
