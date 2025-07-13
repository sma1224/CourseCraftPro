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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { exportOutlineAsMarkdown, downloadMarkdownFile } from "@/lib/exportUtils";
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
  X,
  Plus,
  Trash2,
  Sparkles,
  Send
} from "lucide-react";
import RichTextEditor from "@/components/editor/rich-text-editor";

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
  onSave: (editedOutline?: any) => void;
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
  const [editMode, setEditMode] = useState(false);
  const [editedOutline, setEditedOutline] = useState(outline);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const { toast } = useToast();

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

  const selectedModule = editMode ? editedOutline.modules[selectedModuleIndex] : outline.modules[selectedModuleIndex];

  const handleExportMarkdown = () => {
    try {
      const outlineToExport = editMode ? editedOutline : outline;
      const markdownContent = exportOutlineAsMarkdown(outlineToExport);
      const filename = outlineToExport.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      downloadMarkdownFile(markdownContent, filename);
      
      toast({
        title: "Export Successful",
        description: "Course outline has been exported as Markdown file",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export outline. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditToggle = () => {
    if (editMode) {
      // Reset edited outline to original when canceling edit
      setEditedOutline(outline);
    }
    setEditMode(!editMode);
  };

  const handleSaveEdits = () => {
    onSave(editedOutline);
    setEditMode(false);
    toast({
      title: "Changes Saved",
      description: "Your outline updates have been saved successfully",
    });
  };

  const updateOutlineField = (field: string, value: any) => {
    setEditedOutline(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateModuleField = (moduleIndex: number, field: string, value: any) => {
    setEditedOutline(prev => ({
      ...prev,
      modules: prev.modules.map((module, index) => 
        index === moduleIndex ? { ...module, [field]: value } : module
      )
    }));
  };

  const updateLessonField = (moduleIndex: number, lessonIndex: number, field: string, value: any) => {
    setEditedOutline(prev => ({
      ...prev,
      modules: prev.modules.map((module, mIndex) => 
        mIndex === moduleIndex ? {
          ...module,
          lessons: module.lessons.map((lesson, lIndex) =>
            lIndex === lessonIndex ? { ...lesson, [field]: value } : lesson
          )
        } : module
      )
    }));
  };

  const addNewModule = () => {
    const newModule = {
      title: "New Module",
      duration: "2 hours",
      description: "Module description",
      learningObjectives: ["Learning objective"],
      lessons: [{
        title: "New Lesson",
        duration: "30 minutes",
        description: "Lesson description",
        activities: ["Activity"],
        format: ["Lecture"]
      }],
      activities: [{
        type: "Assignment",
        title: "Module Assignment",
        description: "Assignment description"
      }],
      resources: [{
        type: "Reading",
        title: "Required Reading",
        description: "Resource description"
      }]
    };
    
    setEditedOutline(prev => ({
      ...prev,
      modules: [...prev.modules, newModule]
    }));
    
    toast({
      title: "Module Added",
      description: "New module added. You can now edit its content.",
    });
  };

  const deleteModule = (moduleIndex: number) => {
    if (editedOutline.modules.length <= 1) {
      toast({
        title: "Cannot Delete",
        description: "A course must have at least one module.",
        variant: "destructive",
      });
      return;
    }
    
    setEditedOutline(prev => ({
      ...prev,
      modules: prev.modules.filter((_, index) => index !== moduleIndex)
    }));
    
    // Adjust selected module if needed
    if (selectedModuleIndex >= editedOutline.modules.length - 1) {
      setSelectedModuleIndex(Math.max(0, editedOutline.modules.length - 2));
    }
    
    toast({
      title: "Module Deleted",
      description: "Module has been removed from the course.",
    });
  };

  const addNewLesson = (moduleIndex: number) => {
    const newLesson = {
      title: "New Lesson",
      duration: "30 minutes",
      description: "Lesson description",
      activities: ["Activity"],
      format: ["Lecture"]
    };
    
    setEditedOutline(prev => ({
      ...prev,
      modules: prev.modules.map((module, index) => 
        index === moduleIndex ? {
          ...module,
          lessons: [...module.lessons, newLesson]
        } : module
      )
    }));
    
    toast({
      title: "Lesson Added",
      description: "New lesson added to the module.",
    });
  };

  const deleteLesson = (moduleIndex: number, lessonIndex: number) => {
    setEditedOutline(prev => ({
      ...prev,
      modules: prev.modules.map((module, index) => 
        index === moduleIndex ? {
          ...module,
          lessons: module.lessons.filter((_, lIndex) => lIndex !== lessonIndex)
        } : module
      )
    }));
    
    toast({
      title: "Lesson Deleted",
      description: "Lesson has been removed from the module.",
    });
  };

  // AI-powered editing mutation
  const aiEditMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/enhance-outline", {
        outline: editedOutline,
        prompt: prompt,
        section: "module",
        moduleIndex: selectedModuleIndex
      });
      return await response.json();
    },
    onSuccess: (enhancedOutline) => {
      setEditedOutline(enhancedOutline);
      setAiPrompt("");
      setShowAIPrompt(false);
      toast({
        title: "AI Enhancement Complete",
        description: "Your outline has been enhanced based on your prompt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Enhancement Failed",
        description: "Failed to enhance outline. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAIPromptSubmit = () => {
    if (!aiPrompt.trim()) return;
    aiEditMutation.mutate(aiPrompt);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0">
        <DialogHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {editMode ? (
                <div className="space-y-2">
                  <Input
                    value={editedOutline.title}
                    onChange={(e) => updateOutlineField('title', e.target.value)}
                    className="text-2xl font-bold border-0 px-0 focus:ring-0 focus:border-b-2 focus:border-blue-500"
                    placeholder="Course title"
                  />
                  <Textarea
                    value={editedOutline.description}
                    onChange={(e) => updateOutlineField('description', e.target.value)}
                    className="text-gray-600 border-0 px-0 resize-none focus:ring-0 focus:border-b-2 focus:border-blue-500"
                    placeholder="Course description"
                    rows={2}
                  />
                </div>
              ) : (
                <div>
                  <DialogTitle className="text-2xl font-bold">{outline.title}</DialogTitle>
                  <p className="text-gray-600 mt-1">{outline.description}</p>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {editMode ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowAIPrompt(!showAIPrompt)}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    AI Enhance
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleEditToggle}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSaveEdits}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleEditToggle}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="course-secondary-btn"
                    onClick={handleExportMarkdown}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export MD
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* AI Prompt Interface */}
        {showAIPrompt && editMode && (
          <div className="border-b bg-blue-50 dark:bg-blue-900/20 p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <Input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ask AI to enhance this outline... e.g., 'Add more practical exercises' or 'Make lessons more interactive'"
                  className="w-full"
                  onKeyPress={(e) => e.key === 'Enter' && handleAIPromptSubmit()}
                />
              </div>
              <Button
                onClick={handleAIPromptSubmit}
                disabled={!aiPrompt.trim() || aiEditMutation.isPending}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {aiEditMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="flex h-[calc(95vh-120px)]">
          {/* Sidebar Navigation */}
          <div className="w-80 border-r bg-gray-50 dark:bg-gray-900 overflow-y-auto custom-scrollbar">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Course Structure</h3>
                {editMode && (
                  <Button
                    onClick={addNewModule}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 text-xs"
                  >
                    <Plus className="h-3 w-3" />
                    Module
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {(editMode ? editedOutline.modules : outline.modules).map((module, index) => (
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
                      <div className="flex-1">
                        <span className={`font-medium ${
                          selectedModuleIndex === index ? 'text-blue-900 dark:text-blue-200' : 'text-gray-900 dark:text-white'
                        }`}>
                          Module {index + 1}: {module.title}
                        </span>
                        <div className={`text-xs ${
                          selectedModuleIndex === index ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {module.duration}
                        </div>
                      </div>
                      {editMode && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteModule(index);
                          }}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
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
                {editMode ? (
                  <div className="space-y-3">
                    <Input
                      value={selectedModule.title}
                      onChange={(e) => updateModuleField(selectedModuleIndex, 'title', e.target.value)}
                      className="text-xl font-bold bg-transparent border-0 px-0 focus:ring-0 focus:border-b-2 focus:border-blue-500 text-blue-900 dark:text-blue-200"
                      placeholder="Module title"
                    />
                    <div className="flex items-center space-x-4 text-sm text-blue-700 dark:text-blue-300">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Duration: 
                        <Input
                          value={selectedModule.duration}
                          onChange={(e) => updateModuleField(selectedModuleIndex, 'duration', e.target.value)}
                          className="ml-2 w-20 h-6 text-xs bg-transparent border-0 px-1 focus:ring-0 focus:border-b focus:border-blue-500"
                          placeholder="Duration"
                        />
                      </div>
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        Target: {outline.targetAudience}
                      </span>
                      <span className="flex items-center">
                        <Target className="h-4 w-4 mr-1" />
                        Format: {outline.courseType}
                      </span>
                    </div>
                    <div className="border rounded-lg min-h-[120px]">
                      <RichTextEditor 
                        content={selectedModule.description}
                        onSave={(content) => updateModuleField(selectedModuleIndex, 'description', content)}
                        readOnly={false}
                        title={`${selectedModule.title} - Description`}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
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
                )}
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Lesson Breakdown</h3>
                    {editMode && (
                      <Button
                        onClick={() => addNewLesson(selectedModuleIndex)}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1 text-xs"
                      >
                        <Plus className="h-3 w-3" />
                        Lesson
                      </Button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {selectedModule.lessons.map((lesson, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        {editMode ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-500">{selectedModuleIndex + 1}.{index + 1}</span>
                              <Input
                                value={lesson.title}
                                onChange={(e) => updateLessonField(selectedModuleIndex, index, 'title', e.target.value)}
                                className="flex-1 font-medium"
                                placeholder="Lesson title"
                              />
                              <Input
                                value={lesson.duration}
                                onChange={(e) => updateLessonField(selectedModuleIndex, index, 'duration', e.target.value)}
                                className="w-24 text-sm"
                                placeholder="Duration"
                              />
                              <Button
                                onClick={() => deleteLesson(selectedModuleIndex, index)}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="border rounded-lg min-h-[120px]">
                              <RichTextEditor 
                                content={lesson.description}
                                onSave={(content) => updateLessonField(selectedModuleIndex, index, 'description', content)}
                                readOnly={false}
                                title={`${lesson.title} - Description`}
                              />
                            </div>
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
                        ) : (
                          <div>
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
                        )}
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
