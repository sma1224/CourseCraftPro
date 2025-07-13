import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Download, Play, Pause, Volume2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface AudioScriptGeneratorProps {
  moduleContent: any;
  moduleTitle: string;
  courseTitle: string;
  onScriptGenerated?: (script: string) => void;
}

export default function AudioScriptGenerator({
  moduleContent,
  moduleTitle,
  courseTitle,
  onScriptGenerated
}: AudioScriptGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState('');
  const [scriptFormat, setScriptFormat] = useState('podcast');
  const [duration, setDuration] = useState('15');
  const [voiceStyle, setVoiceStyle] = useState('conversational');

  const handleGenerateScript = async () => {
    if (!moduleContent) {
      toast({
        title: "No Content",
        description: "Please generate module content first before creating audio scripts.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // This would integrate with your content generation API
      const response = await fetch('/api/generate-audio-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          moduleContent,
          moduleTitle,
          courseTitle,
          format: scriptFormat,
          duration: parseInt(duration),
          voiceStyle
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio script');
      }

      const data = await response.json();
      setGeneratedScript(data.script);
      onScriptGenerated?.(data.script);
      
      toast({
        title: "Script Generated",
        description: "Audio script has been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating audio script:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate audio script. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadScript = () => {
    if (!generatedScript) return;
    
    const blob = new Blob([generatedScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${moduleTitle}_audio_script.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-6">
          <MessageSquare className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Audio Script Generator</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Generate audio-only versions for podcast-style learning or offline access
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Script Configuration</CardTitle>
            <CardDescription>
              Configure the audio script format and style
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="format">Script Format</Label>
                <Select value={scriptFormat} onValueChange={setScriptFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="podcast">Podcast Style</SelectItem>
                    <SelectItem value="audiobook">Audiobook Style</SelectItem>
                    <SelectItem value="lecture">Lecture Style</SelectItem>
                    <SelectItem value="interview">Interview Style</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration">Target Duration (minutes)</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="voice-style">Voice Style</Label>
                <Select value={voiceStyle} onValueChange={setVoiceStyle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conversational">Conversational</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="energetic">Energetic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleGenerateScript}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Generating Script...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Generate Audio Script
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {generatedScript && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Generated Audio Script
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadScript}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <Volume2 className="w-4 h-4 mr-2" />
                    Preview Audio
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <Textarea
                  value={generatedScript}
                  onChange={(e) => setGeneratedScript(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Generated audio script will appear here..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Audio Production Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" disabled>
                <Volume2 className="w-4 h-4 mr-2" />
                Generate AI Voice
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Coming Soon</span>
              </Button>
              <Button variant="outline" disabled>
                <Play className="w-4 h-4 mr-2" />
                Record Voice
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Coming Soon</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}