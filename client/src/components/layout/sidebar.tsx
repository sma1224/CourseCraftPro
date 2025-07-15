import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  GraduationCap, 
  LayoutDashboard, 
  Plus, 
  List, 
  Edit, 
  Video, 
  ClipboardCheck, 
  Folder, 
  BarChart3, 
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Book,
  Clock,
  CheckCircle,
  Play,
  MoreHorizontal,
  Trash2,
  Eye,
  ExternalLink
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import type { Project } from "@shared/schema";

export default function Sidebar() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const response = await apiRequest("DELETE", `/api/projects/${projectId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Course deleted",
        description: "The course has been successfully deleted.",
      });
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete the course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteProjectMutation.mutate(projectToDelete.id);
    }
  };

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionName) 
        ? prev.filter(name => name !== sectionName)
        : [...prev, sectionName]
    );
  };

  const isExpanded = (sectionName: string) => expandedSections.includes(sectionName);

  const navigationSections = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      current: location === "/",
      hasProjects: false,
      description: "Overview and quick actions"
    },
    {
      name: "New Course",
      href: "/course-generator",
      icon: Plus,
      current: location === "/course-generator",
      hasProjects: false,
      description: "Create new course outlines"
    },
    {
      name: "Outline Generator",
      href: "/outline-generator",
      icon: List,
      current: location === "/outline-generator",
      hasProjects: true,
      description: "Generate and manage course structures"
    },
    {
      name: "Content Creator",
      href: "/content-creator",
      icon: Edit,
      current: location.includes("/content-creator"),
      hasProjects: true,
      description: "Create detailed course content"
    },
    {
      name: "Video Assistant",
      href: "/video-assistant",
      icon: Video,
      current: location.includes("/video-producer"),
      hasProjects: true,
      description: "Video production tools",
      badge: "Enhanced"
    },
    {
      name: "Assessment Builder",
      href: "/assessment-builder",
      icon: ClipboardCheck,
      current: location === "/assessment-builder",
      hasProjects: true,
      description: "Create quizzes and assessments",
      badge: "Soon"
    },
    {
      name: "Admin (Resource Manager)",
      href: "/resource-manager",
      icon: Folder,
      current: location === "/resource-manager",
      hasProjects: true,
      description: "Manage course resources",
      badge: "Soon"
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      current: location === "/analytics",
      hasProjects: true,
      description: "Course performance insights",
      badge: "Soon"
    }
  ];

  const getProjectAction = (sectionName: string, project: Project) => {
    switch (sectionName) {
      case "Content Creator":
        return `/content-creator/${project.id}`;
      case "Video Assistant":
        return `/video-producer/${project.id}`;
      case "Assessment Builder":
        return `/assessment-builder/${project.id}`;
      case "Admin (Resource Manager)":
        return `/resource-manager/${project.id}`;
      case "Analytics":
        return `/analytics/${project.id}`;
      default:
        return `/outline/${project.id}`;
    }
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 gradient-card rounded-lg flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Course Creation Suite</h1>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-4">
        <nav className="space-y-2">
          {navigationSections.map((section) => {
            const Icon = section.icon;
            
            return (
              <div key={section.name} className="space-y-1">
                <Collapsible
                  open={isExpanded(section.name)}
                  onOpenChange={() => toggleSection(section.name)}
                >
                  <div className="flex items-center">
                    <Link href={section.href} className="flex-1">
                      <div
                        className={`
                          flex items-center px-4 py-3 rounded-lg transition-colors cursor-pointer
                          ${section.current 
                            ? 'text-blue-700 bg-blue-50 border-r-2 border-blue-600 dark:text-blue-400 dark:bg-blue-900/50' 
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="ml-3 font-medium text-sm">{section.name}</span>
                        {section.badge && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {section.badge}
                          </Badge>
                        )}
                      </div>
                    </Link>
                    
                    {section.hasProjects && projects.length > 0 && (
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="ml-1 px-2">
                          {isExpanded(section.name) ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </Button>
                      </CollapsibleTrigger>
                    )}
                  </div>
                  
                  {section.hasProjects && (
                    <CollapsibleContent className="space-y-1">
                      <div className="ml-4 pl-4 border-l border-gray-200 dark:border-gray-600 space-y-1">
                        {projects.length === 0 ? (
                          <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                            No courses yet. Create your first course!
                          </div>
                        ) : (
                          projects.map((project) => (
                            <div key={project.id} className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors group">
                              <Book className="w-4 h-4 mr-2 flex-shrink-0" />
                              <Link 
                                href={getProjectAction(section.name, project)}
                                className="flex-1 min-w-0"
                              >
                                <div className="font-medium truncate">{project.title}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-500 flex items-center space-x-2">
                                  <span className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {new Date(project.updatedAt).toLocaleDateString()}
                                  </span>
                                  <span className="flex items-center">
                                    <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                                    {project.status}
                                  </span>
                                </div>
                              </Link>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="ml-2 h-6 w-6 p-0 opacity-100 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/outline-viewer/${project.id}`}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Course
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={getProjectAction(section.name, project)}>
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      Open in {section.name}
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteProject(project)}
                                    className="text-red-600 dark:text-red-400"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Course
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ))
                        )}
                      </div>
                    </CollapsibleContent>
                  )}
                </Collapsible>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="w-10 h-10">
            <AvatarImage 
              src={user?.profileImageUrl || undefined} 
              alt={`${user?.firstName} ${user?.lastName}`} 
            />
            <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" className="flex-1">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{projectToDelete?.title}"? This action cannot be undone.
              All course content, outlines, and associated data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteProjectMutation.isPending}
            >
              {deleteProjectMutation.isPending ? "Deleting..." : "Delete Course"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
