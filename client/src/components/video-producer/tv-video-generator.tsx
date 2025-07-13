import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Download, Play, Video, Tv, Mic, Camera } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface TVVideoGeneratorProps {
  moduleContent: any;
  moduleTitle: string;
  courseTitle: string;
  onVideoGenerated?: (video: any) => void;
}

export default function TVVideoGenerator({
  moduleContent,
  moduleTitle,
  courseTitle,
  onVideoGenerated
}: TVVideoGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<any>(null);
  const [voiceoverStyle, setVoiceoverStyle] = useState('professional');
  const [videoQuality, setVideoQuality] = useState('4k');
  const [narrator, setNarrator] = useState('male-professional');
  const [productionStyle, setProductionStyle] = useState('documentary');

  const handleGenerateVideo = async () => {
    if (!moduleContent) {
      toast({
        title: "No Content",
        description: "Please generate module content first before creating TV videos.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-tv-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          moduleContent,
          moduleTitle,
          courseTitle,
          voiceoverStyle,
          videoQuality,
          narrator,
          productionStyle
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate TV video');
      }

      const data = await response.json();
      setGeneratedVideo(data.video);
      onVideoGenerated?.(data.video);
      
      toast({
        title: "Video Generated",
        description: "TV-quality video has been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating TV video:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate TV video. Please try again.",
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
          <Tv className="mx-auto h-12 w-12 text-indigo-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">TV Video Generator</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Create professional videos with human-like TV voiceover narration
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>TV Video Configuration</CardTitle>
            <CardDescription>
              Configure the TV-quality video production settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="production-style">Production Style</Label>
                <Select value={productionStyle} onValueChange={setProductionStyle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="documentary">Documentary</SelectItem>
                    <SelectItem value="news">News Style</SelectItem>
                    <SelectItem value="educational">Educational TV</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="broadcast">Broadcast Quality</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="narrator">Narrator Voice</Label>
                <Select value={narrator} onValueChange={setNarrator}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select narrator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male-professional">Male Professional</SelectItem>
                    <SelectItem value="female-professional">Female Professional</SelectItem>
                    <SelectItem value="male-authoritative">Male Authoritative</SelectItem>
                    <SelectItem value="female-warm">Female Warm</SelectItem>
                    <SelectItem value="male-documentary">Male Documentary</SelectItem>
                    <SelectItem value="female-news">Female News</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="voiceover-style">Voiceover Style</Label>
                <Select value={voiceoverStyle} onValueChange={setVoiceoverStyle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="authoritative">Authoritative</SelectItem>
                    <SelectItem value="engaging">Engaging</SelectItem>
                    <SelectItem value="conversational">Conversational</SelectItem>
                    <SelectItem value="dramatic">Dramatic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="video-quality">Video Quality</Label>
                <Select value={videoQuality} onValueChange={setVideoQuality}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4k">4K Ultra HD</SelectItem>
                    <SelectItem value="1080p">1080p Full HD</SelectItem>
                    <SelectItem value="720p">720p HD</SelectItem>
                    <SelectItem value="broadcast">Broadcast Quality</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleGenerateVideo}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Generating TV Video...
                </>
              ) : (
                <>
                  <Tv className="mr-2 h-4 w-4" />
                  Generate TV Video
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {generatedVideo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Generated TV Video
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
                  <span>Production Style:</span>
                  <span className="capitalize">{productionStyle}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Narrator:</span>
                  <span className="capitalize">{narrator.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Quality:</span>
                  <span className="uppercase">{videoQuality}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>TV Production Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Professional Features:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Professional TV-quality voiceover narration</li>
                  <li>• Cinematic scene transitions and effects</li>
                  <li>• High-quality graphics and animations</li>
                  <li>• Broadcast-standard audio mixing</li>
                  <li>• Professional color grading and post-production</li>
                  <li>• Multi-format export options</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" disabled>
                  <Camera className="w-4 h-4 mr-2" />
                  Studio Setup
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Coming Soon</span>
                </Button>
                <Button variant="outline" disabled>
                  <Mic className="w-4 h-4 mr-2" />
                  Voice Recording
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Coming Soon</span>
                </Button>
                <Button variant="outline" disabled>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Script Editor
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Coming Soon</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export & Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Output Formats:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• MP4 (H.264/H.265) for web and mobile</li>
                  <li>• MOV (ProRes) for professional editing</li>
                  <li>• Broadcast-ready formats (MXF, XDCAM)</li>
                  <li>• Streaming-optimized versions</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" disabled>
                  <Download className="w-4 h-4 mr-2" />
                  Export Options
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Coming Soon</span>
                </Button>
                <Button variant="outline" disabled>
                  <Tv className="w-4 h-4 mr-2" />
                  Broadcast Ready
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