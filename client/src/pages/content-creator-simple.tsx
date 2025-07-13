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
import { ArrowLeft, BookOpen, Edit, Plus, Eye, Home, ChevronRight, MessageSquare, Bot, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";

import RichTextEditor from "@/components/editor/rich-text-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SmartGeneratorPanel from "@/components/content/smart-generator-panel";
import AudioScriptGenerator from "@/components/video-producer/audio-script-generator";
import SlidesGenerator from "@/components/video-producer/slides-generator";
import AIVideoGenerator from "@/components/video-producer/ai-video-generator";
import TVVideoGenerator from "@/components/video-producer/tv-video-generator";

// Helper function to extract readable content from module content JSON
const extractContentForDisplay = (moduleContent: any): string => {
  if (!moduleContent || !moduleContent.content) return '';
  
  const content = moduleContent.content;
  
  // If content is already a string, return it
  if (typeof content === 'string') return content;
  
  // If content is a JSON object, extract readable text
  if (typeof content === 'object') {
    let displayText = '';
    
    // Add title if available
    if (content.title) {
      displayText += `# ${content.title}\n\n`;
    }
    
    // Add overview if available
    if (content.overview) {
      displayText += `## Overview\n\n${content.overview}\n\n`;
    }
    
    // Add learning objectives if available
    if (content.learningObjectives && Array.isArray(content.learningObjectives)) {
      displayText += `## Learning Objectives\n\n`;
      content.learningObjectives.forEach((obj: string, index: number) => {
        displayText += `${index + 1}. ${obj}\n`;
      });
      displayText += '\n';
    }
    
    // Add lessons if available
    if (content.lessons && Array.isArray(content.lessons)) {
      content.lessons.forEach((lesson: any, index: number) => {
        displayText += `## Lesson ${index + 1}: ${lesson.title}\n\n`;
        if (lesson.content) {
          displayText += `${lesson.content}\n\n`;
        }
      });
    }
    
    // Add exercises if available
    if (content.exercises && Array.isArray(content.exercises)) {
      displayText += `## Exercises\n\n`;
      content.exercises.forEach((exercise: any, index: number) => {
        displayText += `### Exercise ${index + 1}: ${exercise.title}\n\n`;
        if (exercise.description) {
          displayText += `${exercise.description}\n\n`;
        }
      });
    }
    
    return displayText;
  }
  
  return '';
};

export default function ContentCreator() {
  const { outlineId } = useParams<{ outlineId: string }>();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [editingContent, setEditingContent] = useState<any>(null);

  const [selectedActiveTab, setSelectedActiveTab] = useState("editor");

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
                            console.log('Module content structure:', JSON.stringify(hasContent, null, 2));
                            setSelectedModule({ ...module, index, content: hasContent });
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Content
                        </Button>
                        <Button 
                          variant="default"
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                          onClick={() => {
                            console.log('Opening Smart Generator for module:', hasContent);
                            setSelectedModule({ ...module, index, content: hasContent });
                            setSelectedActiveTab('generator');
                          }}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Smart Generator
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
                      <>
                        <Button 
                          variant="default"
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                          onClick={() => {
                            console.log('Opening Smart Generator for new module:', module);
                            setSelectedModule({ ...module, index, content: null });
                            setSelectedActiveTab('generator');
                          }}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Smart Generator
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
                        Quick Generate
                      </Button>
                      </>
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
            <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>
                  Module {selectedModule.index + 1}: {selectedModule.title}
                </DialogTitle>
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">6-Step Professional Course Development Workflow</h4>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Course Outline
                    </div>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Detail Development
                    </div>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      Audio Scripts
                    </div>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      Slides/Recording
                    </div>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      AI Voiceover
                    </div>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      TV Voiceover
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="flex-1 overflow-hidden">
                <Tabs value={selectedActiveTab} onValueChange={setSelectedActiveTab} className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-6 flex-shrink-0">
                    <TabsTrigger value="editor" className="flex items-center gap-1 text-xs">
                      <Edit className="w-3 h-3" />
                      Content Editor
                    </TabsTrigger>
                    <TabsTrigger value="generator" className="flex items-center gap-1 text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700">
                      <Sparkles className="w-3 h-3" />
                      Detail Development
                    </TabsTrigger>
                    <TabsTrigger value="audio" className="flex items-center gap-1 text-xs">
                      <MessageSquare className="w-3 h-3" />
                      Audio Scripts
                    </TabsTrigger>
                    <TabsTrigger value="slides" className="flex items-center gap-1 text-xs">
                      <Eye className="w-3 h-3" />
                      Slides/Recording
                    </TabsTrigger>
                    <TabsTrigger value="video-ai" className="flex items-center gap-1 text-xs">
                      <Bot className="w-3 h-3" />
                      AI Voiceover
                    </TabsTrigger>
                    <TabsTrigger value="video-tv" className="flex items-center gap-1 text-xs">
                      <BookOpen className="w-3 h-3" />
                      TV Voiceover
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="editor" className="flex-1 overflow-hidden mt-4">
                    <div className="h-full border rounded-lg">
                      {console.log('Selected module content:', selectedModule.content)}
                      {console.log('Content to display:', selectedModule.content?.content)}
                      {console.log('Extracted content:', extractContentForDisplay(selectedModule.content))}
                      <RichTextEditor 
                        content={extractContentForDisplay(selectedModule.content)}
                        onSave={(content) => {
                          // Update the content using the API
                          if (selectedModule.content?.id) {
                            fetch(`/api/module-content/${selectedModule.content.id}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              credentials: 'include',
                              body: JSON.stringify({
                                title: selectedModule.title,
                                content: content
                              })
                            }).then(() => {
                              toast({
                                title: "Content Updated",
                                description: "Module content has been saved successfully.",
                              });
                              queryClient.invalidateQueries({ queryKey: [`/api/outlines/${outlineId}/module-contents`] });
                            }).catch(() => {
                              toast({
                                title: "Update Failed",
                                description: "Failed to save content changes. Please try again.",
                                variant: "destructive",
                              });
                            });
                          }
                        }}
                        readOnly={false}
                        title={selectedModule.title}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="generator" className="flex-1 overflow-hidden mt-4">
                    <div className="h-full overflow-y-auto">
                      <SmartGeneratorPanel
                        module={selectedModule}
                        moduleIndex={selectedModule.index}
                        outlineId={parseInt(outlineId || '0')}
                        courseTitle={outlineData?.title || ''}
                        courseDescription={outlineData?.description || ''}
                        onContentGenerated={(content) => {
                          try {
                            console.log('Updating selected module with content:', content);
                            // Update the selected module content with the generated JSON content
                            setSelectedModule(prev => ({
                              ...prev,
                              content: {
                                ...prev.content,
                                content: content // This will be a JSON object from the generator
                              }
                            }));
                            // Switch to editor tab to show the generated content
                            setSelectedActiveTab('editor');
                          } catch (error) {
                            console.error('Error updating module content:', error);
                            toast({
                              title: "Update Error",
                              description: "Failed to update module content. Please try again.",
                              variant: "destructive",
                            });
                          }
                        }}
                      />
                    </div>
                  </TabsContent>
                  
                  {/* Audio Scripts Tab */}
                  <TabsContent value="audio" className="flex-1 overflow-hidden mt-4">
                    <div className="h-full border rounded-lg">
                      <AudioScriptGenerator
                        moduleContent={selectedModule.content}
                        moduleTitle={selectedModule.title}
                        courseTitle={outlineData?.title || ''}
                        onScriptGenerated={(script) => {
                          console.log('Audio script generated:', script);
                          toast({
                            title: "Script Generated",
                            description: "Audio script has been generated successfully.",
                          });
                        }}
                      />
                    </div>
                  </TabsContent>
                  
                  {/* Slides/Recording Tab */}
                  <TabsContent value="slides" className="flex-1 overflow-hidden mt-4">
                    <div className="h-full border rounded-lg">
                      <SlidesGenerator
                        moduleContent={selectedModule.content}
                        moduleTitle={selectedModule.title}
                        courseTitle={outlineData?.title || ''}
                        onSlidesGenerated={(slides) => {
                          console.log('Slides generated:', slides);
                          toast({
                            title: "Slides Generated",
                            description: "Slide deck has been generated successfully.",
                          });
                        }}
                      />
                    </div>
                  </TabsContent>
                  
                  {/* AI Voiceover Tab */}
                  <TabsContent value="video-ai" className="flex-1 overflow-hidden mt-4">
                    <div className="h-full border rounded-lg">
                      <AIVideoGenerator
                        moduleContent={selectedModule.content}
                        moduleTitle={selectedModule.title}
                        courseTitle={outlineData?.title || ''}
                        onVideoGenerated={(video) => {
                          console.log('AI video generated:', video);
                          toast({
                            title: "Video Generated",
                            description: "AI video has been generated successfully.",
                          });
                        }}
                      />
                    </div>
                  </TabsContent>
                  
                  {/* TV Voiceover Tab */}
                  <TabsContent value="video-tv" className="flex-1 overflow-hidden mt-4">
                    <div className="h-full border rounded-lg">
                      <TVVideoGenerator
                        moduleContent={selectedModule.content}
                        moduleTitle={selectedModule.title}
                        courseTitle={outlineData?.title || ''}
                        onVideoGenerated={(video) => {
                          console.log('TV video generated:', video);
                          toast({
                            title: "Video Generated",
                            description: "TV-quality video has been generated successfully.",
                          });
                        }}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Legacy Content Editor Modal - Remove if not needed */}
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
                  <div className="border rounded-lg">
                    <RichTextEditor 
                      content={typeof editingContent.content === 'string' 
                        ? editingContent.content 
                        : JSON.stringify(editingContent.content, null, 2)}
                      onSave={(content) => {
                        // Update the content using the API
                        if (editingContent.id) {
                          fetch(`/api/module-content/${editingContent.id}`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            credentials: 'include',
                            body: JSON.stringify({
                              title: editingContent.title,
                              content: content
                            })
                          }).then(() => {
                            toast({
                              title: "Content Updated",
                              description: "Module content has been saved successfully.",
                            });
                            queryClient.invalidateQueries({ queryKey: [`/api/outlines/${outlineId}/module-contents`] });
                            setEditingContent(null);
                          }).catch(() => {
                            toast({
                              title: "Update Failed",
                              description: "Failed to save content changes. Please try again.",
                              variant: "destructive",
                            });
                          });
                        }
                      }}
                      readOnly={false}
                      title={editingContent.title}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
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