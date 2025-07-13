import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Download, Play, Video, Wand2, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface AIVideoGeneratorProps {
  moduleContent: any;
  moduleTitle: string;
  courseTitle: string;
  onVideoGenerated?: (video: any) => void;
}

export default function AIVideoGenerator({
  moduleContent,
  moduleTitle,
  courseTitle,
  onVideoGenerated
}: AIVideoGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<any>(null);
  const [videoStyle, setVideoStyle] = useState('professional');
  const [voiceModel, setVoiceModel] = useState('neural');
  const [videoLength, setVideoLength] = useState('10');
  const [customInstructions, setCustomInstructions] = useState('');

  const handleGenerateVideo = async () => {
    if (!moduleContent) {
      toast({
        title: "No Content",
        description: "Please generate module content first before creating AI videos.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-ai-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          moduleContent,
          moduleTitle,
          courseTitle,
          style: videoStyle,
          voiceModel,
          duration: parseInt(videoLength),
          customInstructions
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI video');
      }

      const data = await response.json();
      setGeneratedVideo(data.video);
      onVideoGenerated?.(data.video);
      
      toast({
        title: "Video Generated",
        description: "AI video has been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating AI video:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate AI video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-6">
          <Bot className="mx-auto h-12 w-12 text-purple-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">AI Video Generator</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Turn lesson scripts into instructional videos with AI-generated voiceover
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>AI Video Configuration</CardTitle>
            <CardDescription>
              Configure the AI video generation settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="video-style">Video Style</Label>
                <Select value={videoStyle} onValueChange={setVideoStyle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="animated">Animated</SelectItem>
                    <SelectItem value="whiteboard">Whiteboard</SelectItem>
                    <SelectItem value="documentary">Documentary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="voice-model">AI Voice Model</Label>
                <Select value={voiceModel} onValueChange={setVoiceModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neural">Neural Voice</SelectItem>
                    <SelectItem value="standard">Standard Voice</SelectItem>
                    <SelectItem value="premium">Premium Voice</SelectItem>
                    <SelectItem value="conversational">Conversational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="video-length">Video Length (minutes)</Label>
                <Select value={videoLength} onValueChange={setVideoLength}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="custom-instructions">Custom Instructions</Label>
              <Textarea
                id="custom-instructions"
                placeholder="Add any specific instructions for the AI video generation..."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <Button 
              onClick={handleGenerateVideo}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Generating AI Video...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate AI Video
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {generatedVideo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Generated AI Video
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download MP4
                  </Button>
                  <Button variant="outline" size="sm">
                    <Play className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Video className="w-16 h-16 text-gray-400" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Duration:</span>
                  <span>{videoLength} minutes</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Style:</span>
                  <span className="capitalize">{videoStyle}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Voice:</span>
                  <span className="capitalize">{voiceModel}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>AI Video Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Capabilities:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• AI-generated scenes and visual storytelling</li>
                  <li>• Automatic voiceover with natural speech</li>
                  <li>• Dynamic scene transitions and animations</li>
                  <li>• Customizable video styles and templates</li>
                  <li>• Auto-generated captions and subtitles</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" disabled>
                  <Settings className="w-4 h-4 mr-2" />
                  Advanced Settings
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Coming Soon</span>
                </Button>
                <Button variant="outline" disabled>
                  <Video className="w-4 h-4 mr-2" />
                  Custom Scenes
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Coming Soon</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}