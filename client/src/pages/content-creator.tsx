import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Users, 
  Target, 
  CheckCircle, 
  Circle, 
  AlertCircle, 
  Edit, 
  FileText,
  ChevronDown, 
  ChevronRight,
  Sparkles,
  PlayCircle
} from "lucide-react";
import LessonContentGeneratorModal from "@/components/content/lesson-content-generator-modal";
import LessonContentViewer from "@/components/content/lesson-content-viewer";

export default function ContentCreator() {
  const { outlineId } = useParams<{ outlineId: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedLesson, setSelectedLesson] = useState<{
    moduleIndex: number;
    lessonIndex: number;
    title: string;
    description: string;
  } | null>(null);
  const [showLessonGenerator, setShowLessonGenerator] = useState(false);
  const [showLessonViewer, setShowLessonViewer] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Fetch course outline
  const { data: outline, isLoading: outlineLoading } = useQuery({
    queryKey: [`/api/course-outlines/${outlineId}`],
    enabled: !!outlineId && isAuthenticated,
    retry: false,
  });

  // Fetch lesson contents for all modules
  const { data: lessonContents = [], isLoading: lessonContentsLoading } = useQuery({
    queryKey: [`/api/outlines/${outlineId}/lessons`],
    enabled: !!outlineId && isAuthenticated,
    retry: false,
  });

  const isLoading = outlineLoading || authLoading || lessonContentsLoading;

  // Error handling
  useEffect(() => {
    if (outline === null) {
      toast({
        title: "Course Not Found",
        description: "The requested course outline could not be found.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [outline, navigate, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!outline) {
    return null;
  }

  const outlineData = typeof outline.content === 'string' 
    ? JSON.parse(outline.content) 
    : outline.content || {};
  const modules = outlineData.modules || [];

  // Calculate progress
  const totalLessons = modules.reduce((acc: number, module: any) => 
    acc + (module.lessons?.length || 0), 0);
  const completedLessons = lessonContents.filter((lc: any) => 
    lc.status === 'complete').length;
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getLessonStatus = (moduleIndex: number, lessonIndex: number) => {
    const lessonContent = lessonContents.find((lc: any) => 
      lc.moduleIndex === moduleIndex && lc.lessonIndex === lessonIndex);
    return lessonContent?.status || 'not_started';
  };

  const hasLessonContent = (moduleIndex: number, lessonIndex: number) => {
    const lessonContent = lessonContents.find((lc: any) => 
      lc.moduleIndex === moduleIndex && lc.lessonIndex === lessonIndex);
    return !!lessonContent?.content;
  };

  const toggleModule = (moduleIndex: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleIndex)) {
      newExpanded.delete(moduleIndex);
    } else {
      newExpanded.add(moduleIndex);
    }
    setExpandedModules(newExpanded);
  };

  const handleGenerateLesson = (moduleIndex: number, lessonIndex: number, lesson: any) => {
    setSelectedLesson({
      moduleIndex,
      lessonIndex,
      title: lesson.title,
      description: lesson.description || lesson.content || ''
    });
    setShowLessonGenerator(true);
  };

  const handleViewLesson = (moduleIndex: number, lessonIndex: number, lesson: any) => {
    setSelectedLesson({
      moduleIndex,
      lessonIndex,
      title: lesson.title,
      description: lesson.description || lesson.content || ''
    });
    setShowLessonViewer(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Course Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {outlineData.title}
                    </CardTitle>
                    <CardDescription className="mt-2 text-base">
                      {outlineData.description}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    Content Creator
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">{outlineData.targetAudience}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">{outlineData.totalDuration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">{outlineData.courseType}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Content Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Lessons Complete</span>
                      <span>{completedLessons}/{totalLessons}</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    {modules.map((module: any, index: number) => {
                      const moduleLessons = module.lessons || [];
                      const moduleCompletedLessons = moduleLessons.filter((_: any, lessonIndex: number) => 
                        getLessonStatus(index, lessonIndex) === 'complete').length;
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm truncate">Module {index + 1}</span>
                          </div>
                          <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {moduleCompletedLessons}/{moduleLessons.length}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lesson Content Development */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Lesson Content Development
            </CardTitle>
            <CardDescription>
              Create detailed content for each lesson in your course outline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[700px]">
              <div className="space-y-4">
                {modules.map((module: any, moduleIndex: number) => {
                  const moduleLessons = module.lessons || [];
                  const isExpanded = expandedModules.has(moduleIndex);
                  
                  return (
                    <div key={moduleIndex}>
                      <Collapsible 
                        open={isExpanded} 
                        onOpenChange={() => toggleModule(moduleIndex)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-between p-4 h-auto bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? 
                                <ChevronDown className="h-4 w-4" /> : 
                                <ChevronRight className="h-4 w-4" />
                              }
                              <div className="text-left">
                                <h3 className="font-semibold text-lg">
                                  Module {moduleIndex + 1}: {module.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                  {module.description}
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="shrink-0">
                              {moduleLessons.length} lessons
                            </Badge>
                          </Button>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent className="mt-4">
                          <div className="ml-6 space-y-3">
                            {moduleLessons.map((lesson: any, lessonIndex: number) => {
                              const lessonStatus = getLessonStatus(moduleIndex, lessonIndex);
                              const hasContent = hasLessonContent(moduleIndex, lessonIndex);
                              
                              return (
                                <Card key={lessonIndex} className="bg-white dark:bg-gray-800">
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3 flex-1">
                                        {getStatusIcon(lessonStatus)}
                                        <div className="flex-1">
                                          <h4 className="font-medium">
                                            Lesson {lessonIndex + 1}: {lesson.title}
                                          </h4>
                                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                            {lesson.description || lesson.content || 'No description available'}
                                          </p>
                                          {lesson.duration && (
                                            <div className="flex items-center gap-1 mt-2">
                                              <Clock className="h-3 w-3 text-gray-500" />
                                              <span className="text-xs text-gray-500">{lesson.duration}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        <Badge className={`text-xs ${getStatusColor(lessonStatus)}`}>
                                          {lessonStatus.replace('_', ' ')}
                                        </Badge>
                                        
                                        {hasContent ? (
                                          <div className="flex gap-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleViewLesson(moduleIndex, lessonIndex, lesson)}
                                              className="flex items-center gap-2"
                                            >
                                              <FileText className="h-3 w-3" />
                                              View
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleGenerateLesson(moduleIndex, lessonIndex, lesson)}
                                              className="flex items-center gap-2"
                                            >
                                              <Edit className="h-3 w-3" />
                                              Edit
                                            </Button>
                                          </div>
                                        ) : (
                                          <Button
                                            onClick={() => handleGenerateLesson(moduleIndex, lessonIndex, lesson)}
                                            size="sm"
                                            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                                          >
                                            <Sparkles className="h-3 w-3" />
                                            Smart Generator
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                      
                      {moduleIndex < modules.length - 1 && <Separator className="my-6" />}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Lesson Content Generator Modal */}
      {showLessonGenerator && selectedLesson && (
        <LessonContentGeneratorModal
          isOpen={showLessonGenerator}
          onClose={() => {
            setShowLessonGenerator(false);
            setSelectedLesson(null);
          }}
          outlineId={parseInt(outlineId!)}
          moduleIndex={selectedLesson.moduleIndex}
          lessonIndex={selectedLesson.lessonIndex}
          lessonTitle={selectedLesson.title}
          lessonDescription={selectedLesson.description}
          courseTitle={outline.title}
          courseDescription={outlineData.description}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: [`/api/outlines/${outlineId}/lessons`] });
          }}
        />
      )}

      {/* Lesson Content Viewer Modal */}
      {showLessonViewer && selectedLesson && (
        <LessonContentViewer
          isOpen={showLessonViewer}
          onClose={() => {
            setShowLessonViewer(false);
            setSelectedLesson(null);
          }}
          outlineId={parseInt(outlineId!)}
          moduleIndex={selectedLesson.moduleIndex}
          lessonIndex={selectedLesson.lessonIndex}
          lessonTitle={selectedLesson.title}
          onEdit={() => {
            setShowLessonViewer(false);
            setShowLessonGenerator(true);
          }}
        />
      )}
    </div>
  );
}