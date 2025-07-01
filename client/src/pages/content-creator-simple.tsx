import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, BookOpen, Edit, Plus, Eye, Home, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function ContentCreator() {
  const { outlineId } = useParams<{ outlineId: string }>();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [editingContent, setEditingContent] = useState<any>(null);

  const { data: outline, isLoading, error } = useQuery({
    queryKey: [`/api/course-outlines/${outlineId}`],
    queryFn: async () => {
      if (!outlineId) throw new Error("No outline ID provided");
      const response = await fetch(`/api/course-outlines/${outlineId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch outline: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!outlineId,
  });

  // Query to load generated module contents
  const { data: moduleContents } = useQuery({
    queryKey: [`/api/outlines/${outlineId}/module-contents`],
    queryFn: async () => {
      if (!outlineId) return [];
      const response = await fetch(`/api/outlines/${outlineId}/module-contents`, {
        credentials: 'include'
      });
      if (!response.ok) return [];
      const data = await response.json();
      console.log('Module contents loaded:', data);
      return data;
    },
    enabled: !!outlineId,
  });

  console.log('Content Creator Debug:', { outlineId, isLoading, error, outline });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading outline {outlineId}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">Error loading course outline</p>
            <p className="text-sm text-red-500 mt-2">{error.toString()}</p>
            <Button onClick={() => navigate("/dashboard")} className="mt-4">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!outline) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">Course outline not found</p>
            <p className="text-sm text-gray-500 mt-2">Outline ID: {outlineId}</p>
            <Button onClick={() => navigate("/dashboard")} className="mt-4">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const outlineData = (() => {
    try {
      if (outline?.content) {
        // If content is already an object, return it directly
        if (typeof outline.content === 'object') {
          return outline.content;
        }
        // If content is a string, try to parse it
        if (typeof outline.content === 'string') {
          return JSON.parse(outline.content);
        }
      }
      return { modules: [] };
    } catch (error) {
      console.error('Error parsing outline content:', error);
      return { modules: [] };
    }
  })();
  const modules = Array.isArray(outlineData.modules) ? outlineData.modules : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/")}
              className="p-0 h-auto font-normal text-gray-500 hover:text-gray-700"
            >
              <Home className="h-4 w-4 mr-1" />
              Dashboard
            </Button>
            <ChevronRight className="h-4 w-4 mx-2" />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(`/outline/${outlineId}`)}
              className="p-0 h-auto font-normal text-gray-500 hover:text-gray-700"
            >
              Outline
            </Button>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-gray-900">Content Creator</span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Content Creator
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Transform your course outline into detailed, engaging content
              </p>
            </div>
            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
              <BookOpen className="h-4 w-4 mr-1" />
              {modules.length} Modules
            </Badge>
          </div>
        </div>

        {/* Course Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Course: {outlineData.title || 'Untitled Course'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {outlineData.description || 'No description available'}
            </p>
            <div className="flex gap-4 text-sm text-gray-500">
              <span>Target: {outlineData.targetAudience || 'General'}</span>
              <span>Duration: {outlineData.totalDuration || 'Not specified'}</span>
              <span>Type: {outlineData.courseType || 'Standard'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module: any, index: number) => {
            const hasContent = moduleContents?.find((mc: any) => mc.moduleIndex === index);
            
            return (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Module {index + 1}: {module.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {module.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>Duration: {module.duration}</span>
                    <span>{module.lessons?.length || 0} lessons</span>
                  </div>
                  
                  <div className="space-y-2">
                    {hasContent ? (
                      <>
                        <Button 
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            console.log('Viewing content for module:', hasContent);
                            setSelectedModule({ ...module, index, content: hasContent });
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Content
                        </Button>
                        <Button 
                          variant="outline"
                          className="w-full"
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/generate-module-content', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                credentials: 'include',
                                body: JSON.stringify({
                                  outlineId: parseInt(outlineId || '0'),
                                  moduleIndex: index,
                                  moduleTitle: module.title,
                                  moduleDescription: module.description,
                                  courseTitle: outlineData.title,
                                  courseDescription: outlineData.description,
                                }),
                              });

                              if (response.ok) {
                                const result = await response.json();
                                queryClient.invalidateQueries({ queryKey: [`/api/outlines/${outlineId}/module-contents`] });
                                toast({
                                  title: "Content Regenerated",
                                  description: `AI content updated for "${module.title}"`,
                                });
                              } else {
                                throw new Error('Failed to generate content');
                              }
                            } catch (error) {
                              toast({
                                title: "Generation Error",
                                description: "Failed to generate content. Please try again.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Regenerate
                        </Button>
                      </>
                    ) : (
                      <Button 
                        className="w-full"
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/generate-module-content', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              credentials: 'include',
                              body: JSON.stringify({
                                outlineId: parseInt(outlineId || '0'),
                                moduleIndex: index,
                                moduleTitle: module.title,
                                moduleDescription: module.description,
                                courseTitle: outlineData.title,
                                courseDescription: outlineData.description,
                              }),
                            });

                            if (response.ok) {
                              const result = await response.json();
                              queryClient.invalidateQueries({ queryKey: [`/api/outlines/${outlineId}/module-contents`] });
                              toast({
                                title: "Content Generated",
                                description: `AI content created for "${module.title}"`,
                              });
                            } else {
                              throw new Error('Failed to generate content');
                            }
                          } catch (error) {
                            toast({
                              title: "Generation Error",
                              description: "Failed to generate content. Please try again.",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Generate Content
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {modules.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No modules found in this course outline
              </p>
              <Button onClick={() => navigate(`/outline/${outlineId}`)}>
                View Outline
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Content Viewer Modal */}
        {selectedModule && (
          <Dialog open={!!selectedModule} onOpenChange={() => setSelectedModule(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Module {selectedModule.index + 1}: {selectedModule.title}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {selectedModule.content && (
                  <div className="prose max-w-none">
                    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">Generated Content</h3>
                      <div className="prose prose-sm max-w-none">
                        <div 
                          className="whitespace-pre-wrap text-sm leading-relaxed"
                          style={{ 
                            fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
                            lineHeight: '1.6'
                          }}
                        >
                          {(() => {
                            const content = selectedModule.content.content;
                            
                            // Handle new markdown format (string)
                            if (typeof content === 'string') {
                              return content;
                            }
                            
                            // Handle old JSON format - convert to readable text
                            if (typeof content === 'object' && content !== null) {
                              let formatted = `# ${content.title || selectedModule.content.title}\n\n`;
                              
                              if (content.overview) {
                                formatted += `## Overview\n${content.overview}\n\n`;
                              }
                              
                              if (content.lessons && Array.isArray(content.lessons)) {
                                formatted += `## Lessons\n\n`;
                                content.lessons.forEach((lesson: any, idx: number) => {
                                  formatted += `### Lesson ${idx + 1}: ${lesson.title}\n`;
                                  formatted += `${lesson.content}\n`;
                                  formatted += `**Duration:** ${lesson.duration}\n\n`;
                                  if (lesson.activities && lesson.activities.length > 0) {
                                    formatted += `**Activities:**\n${lesson.activities.map((a: string) => `- ${a}`).join('\n')}\n\n`;
                                  }
                                });
                              }
                              
                              if (content.exercises && Array.isArray(content.exercises)) {
                                formatted += `## Exercises\n\n`;
                                content.exercises.forEach((exercise: any, idx: number) => {
                                  formatted += `### Exercise ${idx + 1}: ${exercise.title}\n`;
                                  formatted += `${exercise.description}\n\n`;
                                  if (exercise.instructions) {
                                    formatted += `**Instructions:**\n${exercise.instructions.map((i: string) => `${i}`).join('\n')}\n\n`;
                                  }
                                });
                              }
                              
                              if (content.assessments && Array.isArray(content.assessments)) {
                                formatted += `## Assessments\n\n`;
                                content.assessments.forEach((assessment: any, idx: number) => {
                                  formatted += `### ${assessment.type}: ${assessment.title}\n`;
                                  if (assessment.questions) {
                                    assessment.questions.forEach((q: any, qIdx: number) => {
                                      formatted += `**Question ${qIdx + 1}:** ${q.question}\n`;
                                      if (q.options) {
                                        formatted += q.options.map((opt: string, optIdx: number) => `${String.fromCharCode(65 + optIdx)}. ${opt}`).join('\n') + '\n';
                                      }
                                      if (q.correctAnswer) {
                                        formatted += `**Correct Answer:** ${q.correctAnswer}\n`;
                                      }
                                      formatted += '\n';
                                    });
                                  }
                                });
                              }
                              
                              return formatted;
                            }
                            
                            // Fallback for any other format
                            return JSON.stringify(content, null, 2);
                          })()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => {
                          setEditingContent(selectedModule.content);
                          setSelectedModule(null);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Content
                      </Button>
                      <Button variant="outline" onClick={() => setSelectedModule(null)}>
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Content Editor Modal */}
        {editingContent && (
          <Dialog open={!!editingContent} onOpenChange={() => setEditingContent(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Edit Module Content</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="content-title">Title</Label>
                  <Input
                    id="content-title"
                    value={editingContent.title || ''}
                    onChange={(e) => setEditingContent({
                      ...editingContent,
                      title: e.target.value
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="content-body">Content</Label>
                  <Textarea
                    id="content-body"
                    rows={15}
                    value={typeof editingContent.content === 'string' 
                      ? editingContent.content 
                      : JSON.stringify(editingContent.content, null, 2)
                    }
                    onChange={(e) => setEditingContent({
                      ...editingContent,
                      content: e.target.value
                    })}
                    className="font-mono text-sm"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/module-content/${editingContent.id}`, {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          credentials: 'include',
                          body: JSON.stringify({
                            title: editingContent.title,
                            content: editingContent.content,
                          }),
                        });

                        if (response.ok) {
                          queryClient.invalidateQueries({ queryKey: [`/api/outlines/${outlineId}/module-contents`] });
                          setEditingContent(null);
                          toast({
                            title: "Content Updated",
                            description: "Your changes have been saved successfully.",
                          });
                        } else {
                          throw new Error('Failed to save changes');
                        }
                      } catch (error) {
                        toast({
                          title: "Save Error",
                          description: "Failed to save changes. Please try again.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setEditingContent(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}