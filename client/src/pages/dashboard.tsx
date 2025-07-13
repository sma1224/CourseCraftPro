import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import CourseGeneratorModal from "@/components/course/course-generator-modal";
import OutlineViewerModal from "@/components/course/outline-viewer-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Book, 
  Users, 
  Clock, 
  CheckCircle, 
  Plus, 
  Bell, 
  Moon, 
  MoreHorizontal,
  Laptop,
  Brain,
  GraduationCap,
  Sparkles,
  Layers2 as Layers,
  MessageSquare
} from "lucide-react";
import { useState } from "react";
import type { Project } from "@shared/schema";
import VoiceChat from "@/components/ui/voice-chat";

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [showCourseGenerator, setShowCourseGenerator] = useState(false);
  const [selectedOutline, setSelectedOutline] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showOutlineViewer, setShowOutlineViewer] = useState(false);
  const [showVoiceChat, setShowVoiceChat] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  // Fetch user projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: isAuthenticated,
    retry: false,
  });

  const handleOpenCourseGenerator = () => {
    setShowCourseGenerator(true);
  };

  const handleViewOutline = async (projectId: number) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/outlines/active`);
      if (response.ok) {
        const outlineData = await response.json();
        navigate(`/outline/${outlineData.id}`);
      } else {
        toast({
          title: "No outline found",
          description: "This project doesn't have a saved outline yet.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load outline. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOpenVideoProducer = async (projectId: number) => {
    try {
      console.log('Fetching outline for project:', projectId);
      const response = await fetch(`/api/projects/${projectId}/outlines/active`);
      if (response.ok) {
        const outlineData = await response.json();
        console.log('Got outline data:', outlineData);
        console.log('Navigating to:', `/video-producer/${outlineData.id}`);
        navigate(`/video-producer/${outlineData.id}`);
      } else {
        console.error('Failed to fetch outline:', response.status);
        toast({
          title: "No outline found",
          description: "This project doesn't have a saved outline yet.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching outline:', error);
      toast({
        title: "Error",
        description: "Failed to load outline. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Save edited outline mutation
  const saveOutlineMutation = useMutation({
    mutationFn: async (editedOutline: any) => {
      if (!selectedProject) throw new Error("No project selected");
      
      const response = await fetch(`/api/projects/${selectedProject.id}/outlines/${selectedProject.outlineId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editedOutline.title,
          content: editedOutline,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save outline');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Outline Saved",
        description: "Your changes have been saved successfully",
      });
      setShowOutlineViewer(false);
      setSelectedOutline(null);
      setSelectedProject(null);
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: "Failed to save your changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">In Progress</Badge>;
      case "draft":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Draft</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getProjectIcon = (title: string) => {
    if (title.toLowerCase().includes('marketing')) return Laptop;
    if (title.toLowerCase().includes('ai') || title.toLowerCase().includes('manufacturing')) return Brain;
    return GraduationCap;
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const then = new Date(date);
    const diffInHours = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return "1 day ago";
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  // Mock stats for now - in production these would come from the API
  const stats = {
    totalCourses: projects.length,
    activeStudents: 1247,
    hoursSaved: 156,
    completionRate: "89%"
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
              <p className="text-gray-600 dark:text-gray-400">Create and manage your course content</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="p-2">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2">
                <Moon className="h-5 w-5" />
              </Button>
              <Button 
                onClick={() => setShowVoiceChat(true)}
                variant="outline"
                className="bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-700"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Voice Chat
              </Button>
              <Button 
                onClick={handleOpenCourseGenerator}
                className="course-primary-btn"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Course
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Book className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Courses</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCourses}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Students</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeStudents.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Hours Saved</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.hoursSaved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completionRate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* AI Course Generator */}
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 gradient-card rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">AI Course Generator</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Transform your course idea into a comprehensive outline in minutes</p>
                <Button 
                  onClick={handleOpenCourseGenerator}
                  className="w-full course-primary-btn"
                >
                  Start Creating
                </Button>
              </CardContent>
            </Card>

            {/* Templates */}
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 accent-gradient-card rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Layers className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Course Templates</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Choose from professionally designed course structures</p>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  Browse Templates
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Recent Projects</CardTitle>
                <Button variant="link" className="text-blue-600 hover:text-blue-700">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center p-8">
                  <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No courses yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Get started by creating your first course with AI. Once you generate a course outline, you'll be able to edit and revise it here.</p>
                  <div className="space-y-3">
                    <Button onClick={handleOpenCourseGenerator} className="course-primary-btn">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Course
                    </Button>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      After generating an outline, use the "View Outline" button to edit and revise your content
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => {
                    const IconComponent = getProjectIcon(project.title);
                    return (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <IconComponent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">{project.title}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{project.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewOutline(project.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            View Outline
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              console.log('Video Producer button clicked for project:', project.id);
                              handleOpenVideoProducer(project.id);
                            }}
                            className="text-purple-600 hover:text-purple-700"
                          >
                            Video Producer
                          </Button>
                          {getStatusBadge(project.status)}
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatTimeAgo(project.updatedAt || project.createdAt || new Date().toISOString())}
                          </span>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Course Generator Modal */}
      {showCourseGenerator && (
        <CourseGeneratorModal 
          isOpen={showCourseGenerator}
          onClose={() => setShowCourseGenerator(false)}
        />
      )}

      {/* Outline Viewer Modal */}
      {showOutlineViewer && selectedOutline && (
        <OutlineViewerModal 
          isOpen={showOutlineViewer}
          onClose={() => {
            setShowOutlineViewer(false);
            setSelectedOutline(null);
            setSelectedProject(null);
          }}
          outline={selectedOutline}
          onSave={(editedOutline) => {
            if (editedOutline) {
              saveOutlineMutation.mutate(editedOutline);
            } else {
              setShowOutlineViewer(false);
              setSelectedOutline(null);
              setSelectedProject(null);
            }
          }}
          isSaving={saveOutlineMutation.isPending}
        />
      )}

      {/* Voice Chat Modal */}
      <VoiceChat
        isOpen={showVoiceChat}
        onClose={() => setShowVoiceChat(false)}
        onTranscript={(transcript) => {
          console.log("Voice transcript:", transcript);
        }}
        onConversationEnd={(conversation) => {
          console.log("Conversation ended:", conversation);
          toast({
            title: "Conversation Saved",
            description: "Your voice conversation has been recorded.",
          });
        }}
      />
    </div>
  );
}
