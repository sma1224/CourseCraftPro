import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Video, MessageSquare, Presentation, Bot, Tv } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";

import AudioScriptGenerator from "@/components/video-producer/audio-script-generator";
import SlidesGenerator from "@/components/video-producer/slides-generator";
import AIVideoGenerator from "@/components/video-producer/ai-video-generator";
import TVVideoGenerator from "@/components/video-producer/tv-video-generator";

export default function VideoProducer() {
  const { outlineId } = useParams<{ outlineId: string }>();
  const [, navigate] = useLocation();
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('audio');

  console.log('VideoProducer component rendered with outlineId:', outlineId);

  const { data: outline, isLoading: outlineLoading } = useQuery({
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

  const { data: moduleContents, isLoading: modulesLoading } = useQuery({
    queryKey: [`/api/outlines/${outlineId}/module-contents`],
    queryFn: async () => {
      if (!outlineId) return [];
      const response = await fetch(`/api/outlines/${outlineId}/module-contents`, {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!outlineId,
  });

  if (outlineLoading || modulesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading Video Producer...</p>
        </div>
      </div>
    );
  }

  const modules = outline?.outline?.modules || [];
  const getModuleContent = (moduleIndex: number) => {
    return moduleContents?.find((mc: any) => mc.moduleIndex === moduleIndex);
  };

  if (!selectedModule) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-4 mb-6">
              <Video className="w-8 h-8 text-purple-500" />
              <div>
                <h1 className="text-2xl font-bold">Video Producer</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Professional video production workflow for "{outline?.title}"
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Select a module to access individual video production apps: Audio Scripts, Slides/Recording, AI Voiceover, and TV Voiceover
                </p>
              </div>
            </div>
          </div>

          {/* Video Production Apps Overview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Available Video Production Apps</CardTitle>
              <CardDescription>
                Each module provides access to 4 specialized video production tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <MessageSquare className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Audio Scripts</h4>
                  <p className="text-xs text-gray-500">Generate voiceover scripts</p>
                </div>
                <div className="text-center">
                  <Presentation className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Slides/Recording</h4>
                  <p className="text-xs text-gray-500">Create slide presentations</p>
                </div>
                <div className="text-center">
                  <Bot className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">AI Voiceover</h4>
                  <p className="text-xs text-gray-500">Generate AI voice narration</p>
                </div>
                <div className="text-center">
                  <Tv className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">TV Voiceover</h4>
                  <p className="text-xs text-gray-500">Professional TV-style production</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module: any, index: number) => {
              const moduleContent = getModuleContent(index);
              const hasContent = moduleContent && moduleContent.content;

              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Module {index + 1}: {module.title}
                    </CardTitle>
                    <CardDescription>
                      {module.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Content Status:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          hasContent 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {hasContent ? 'Ready' : 'No Content'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Duration:</span>
                        <span className="text-gray-600 dark:text-gray-400">{module.duration}</span>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedModule({
                            ...module,
                            index,
                            content: moduleContent
                          });
                        }}
                        className="w-full"
                        disabled={!hasContent}
                      >
                        {hasContent ? 'Access Video Apps' : 'Generate Content First'}
                      </Button>
                      {hasContent && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          • Audio Scripts • Slides/Recording • AI Voiceover • TV Voiceover
                        </div>
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
                <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No modules found in this course outline
                </p>
                <Button onClick={() => navigate(`/outline/${outlineId}`)}>
                  View Outline
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setSelectedModule(null)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Modules
          </Button>
          <div className="flex items-center gap-4 mb-6">
            <Video className="w-8 h-8 text-purple-500" />
            <div>
              <h1 className="text-2xl font-bold">
                Module {selectedModule.index + 1}: {selectedModule.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Professional video production workflow
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="audio" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Audio Scripts
            </TabsTrigger>
            <TabsTrigger value="slides" className="flex items-center gap-2">
              <Presentation className="w-4 h-4" />
              Slides/Recording
            </TabsTrigger>
            <TabsTrigger value="ai-video" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              AI Voiceover
            </TabsTrigger>
            <TabsTrigger value="tv-video" className="flex items-center gap-2">
              <Tv className="w-4 h-4" />
              TV Voiceover
            </TabsTrigger>
          </TabsList>

          <TabsContent value="audio" className="mt-0">
            <AudioScriptGenerator
              moduleContent={selectedModule.content}
              moduleTitle={selectedModule.title}
              courseTitle={outline?.title || ''}
              onScriptGenerated={(script) => {
                toast({
                  title: "Script Generated",
                  description: "Audio script has been generated successfully.",
                });
              }}
            />
          </TabsContent>

          <TabsContent value="slides" className="mt-0">
            <SlidesGenerator
              moduleContent={selectedModule.content}
              moduleTitle={selectedModule.title}
              courseTitle={outline?.title || ''}
              onSlidesGenerated={(slides) => {
                toast({
                  title: "Slides Generated",
                  description: "Slide presentation has been generated successfully.",
                });
              }}
            />
          </TabsContent>

          <TabsContent value="ai-video" className="mt-0">
            <AIVideoGenerator
              moduleContent={selectedModule.content}
              moduleTitle={selectedModule.title}
              courseTitle={outline?.title || ''}
              onVideoGenerated={(video) => {
                toast({
                  title: "AI Video Generated",
                  description: "AI voiceover video has been generated successfully.",
                });
              }}
            />
          </TabsContent>

          <TabsContent value="tv-video" className="mt-0">
            <TVVideoGenerator
              moduleContent={selectedModule.content}
              moduleTitle={selectedModule.title}
              courseTitle={outline?.title || ''}
              onVideoGenerated={(video) => {
                toast({
                  title: "TV Video Generated",
                  description: "TV-style video has been generated successfully.",
                });
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}