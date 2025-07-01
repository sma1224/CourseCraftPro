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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { ArrowLeft, BookOpen, Clock, Users, Target, CheckCircle, Circle, AlertCircle, Edit } from "lucide-react";
// Import components will be loaded inline to avoid import issues

export default function ContentCreator() {
  const { outlineId } = useParams<{ outlineId: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [showContentGenerator, setShowContentGenerator] = useState(false);

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

  // Initialize module contents
  const initializeContentsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/course-outlines/${outlineId}/initialize-content`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/course-outlines/${outlineId}/module-contents`] });
      toast({
        title: "Content Creator Initialized",
        description: "Module content tracking has been set up for your course.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Initialization Failed",
        description: "Failed to initialize content creator. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Fetch module contents
  const { data: moduleContents, isLoading: contentsLoading } = useQuery({
    queryKey: [`/api/course-outlines/${outlineId}/module-contents`],
    enabled: !!outlineId && isAuthenticated,
    retry: false,
  });

  const isLoading = authLoading || outlineLoading || contentsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!outline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="max-w-md mx-auto mt-20">
            <CardHeader>
              <CardTitle className="text-red-600">Course Not Found</CardTitle>
              <CardDescription>
                The course outline you're looking for doesn't exist or you don't have access to it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/")}>Return to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const outlineData = outline?.content ? JSON.parse(outline.content) : { modules: [] };
  const modules = Array.isArray(outlineData.modules) ? outlineData.modules : [];

  // Initialize contents if not already done
  if (!moduleContents && !contentsLoading) {
    initializeContentsMutation.mutate();
  }

  // Calculate progress
  const completedModules = Array.isArray(moduleContents) ? moduleContents.filter((m: any) => m.status === 'complete').length : 0;
  const totalModules = modules.length;
  const progressPercentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

  const getStatusIcon = (status: string) => {
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

  const getStatusColor = (status: string) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
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
                      <span>Modules Complete</span>
                      <span>{completedModules}/{totalModules}</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    {Array.isArray(moduleContents) && moduleContents.map((module: any, index: number) => (
                      <div key={module.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(module.status)}
                          <span className="text-sm truncate">Module {index + 1}</span>
                        </div>
                        <Badge className={`text-xs ${getStatusColor(module.status)}`}>
                          {module.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Module Content Development */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Module Content Development
            </CardTitle>
            <CardDescription>
              Create detailed content for each module in your course outline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Module Overview</TabsTrigger>
                <TabsTrigger value="content">Content Development</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {modules.map((module: any, index: number) => {
                    const moduleContent = Array.isArray(moduleContents) ? moduleContents.find((m: any) => m.moduleIndex === index) : undefined;
                    return (
                      <ModuleContentCard
                        key={index}
                        module={module}
                        moduleContent={moduleContent}
                        moduleIndex={index}
                        onCreateContent={() => {
                          setSelectedModuleId(moduleContent?.id || null);
                          setShowContentGenerator(true);
                        }}
                      />
                    );
                  })}
                </div>
              </TabsContent>
              
              <TabsContent value="content" className="mt-6">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-6">
                    {modules.map((module: any, index: number) => {
                      const moduleContent = Array.isArray(moduleContents) ? moduleContents.find((m: any) => m.moduleIndex === index) : undefined;
                      return (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">
                              Module {index + 1}: {module.title}
                            </h3>
                            <Badge className={getStatusColor(moduleContent?.status || 'not_started')}>
                              {moduleContent?.status?.replace('_', ' ') || 'Not Started'}
                            </Badge>
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                            <h4 className="font-medium mb-2">Module Overview</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                              {module.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {module.learningObjectives?.map((objective: string, objIndex: number) => (
                                <Badge key={objIndex} variant="secondary" className="text-xs">
                                  {objective}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {moduleContent?.content ? (
                            <div className="space-y-4">
                              <h4 className="font-medium">Generated Content</h4>
                              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  Content has been generated for this module. Click to edit or enhance.
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-3"
                                  onClick={() => {
                                    setSelectedModuleId(moduleContent.id);
                                    setShowContentGenerator(true);
                                  }}
                                >
                                  Edit Content
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                              <Button
                                onClick={() => {
                                  setSelectedModuleId(moduleContent?.id || null);
                                  setShowContentGenerator(true);
                                }}
                                className="flex items-center gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Create Content
                              </Button>
                            </div>
                          )}
                          
                          {index < modules.length - 1 && <Separator className="my-6" />}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Content Generator Modal */}
      {showContentGenerator && selectedModuleId && (
        <ContentGeneratorModal
          isOpen={showContentGenerator}
          onClose={() => {
            setShowContentGenerator(false);
            setSelectedModuleId(null);
          }}
          moduleContentId={selectedModuleId}
          outlineId={parseInt(outlineId!)}
        />
      )}
    </div>
  );
}