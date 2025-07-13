import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, Download, Play, Image, Monitor, Presentation } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface SlidesGeneratorProps {
  moduleContent: any;
  moduleTitle: string;
  courseTitle: string;
  onSlidesGenerated?: (slides: any[]) => void;
}

export default function SlidesGenerator({
  moduleContent,
  moduleTitle,
  courseTitle,
  onSlidesGenerated
}: SlidesGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSlides, setGeneratedSlides] = useState<any[]>([]);
  const [slideTemplate, setSlideTemplate] = useState('professional');
  const [slideCount, setSlideCount] = useState('10');
  const [includeAnimations, setIncludeAnimations] = useState(true);

  const handleGenerateSlides = async () => {
    if (!moduleContent) {
      toast({
        title: "No Content",
        description: "Please generate module content first before creating slides.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          moduleContent,
          moduleTitle,
          courseTitle,
          template: slideTemplate,
          slideCount: parseInt(slideCount),
          includeAnimations
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate slides');
      }

      const data = await response.json();
      setGeneratedSlides(data.slides);
      onSlidesGenerated?.(data.slides);
      
      toast({
        title: "Slides Generated",
        description: "Slide deck has been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating slides:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate slides. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadSlides = () => {
    if (generatedSlides.length === 0) return;
    
    toast({
      title: "Download Started",
      description: "Slide deck download will begin shortly.",
    });
  };

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-6">
          <Presentation className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Slides & Screen Recording</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Create engaging slide decks or record on-screen demonstrations
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Slide Configuration</CardTitle>
            <CardDescription>
              Configure the slide deck template and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="template">Slide Template</Label>
                <Select value={slideTemplate} onValueChange={setSlideTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="slide-count">Number of Slides</Label>
                <Select value={slideCount} onValueChange={setSlideCount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8">8 slides</SelectItem>
                    <SelectItem value="10">10 slides</SelectItem>
                    <SelectItem value="12">12 slides</SelectItem>
                    <SelectItem value="15">15 slides</SelectItem>
                    <SelectItem value="20">20 slides</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="animations">Include Animations</Label>
                <Select value={includeAnimations ? 'yes' : 'no'} onValueChange={(value) => setIncludeAnimations(value === 'yes')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleGenerateSlides}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Generating Slides...
                </>
              ) : (
                <>
                  <Presentation className="mr-2 h-4 w-4" />
                  Generate Slide Deck
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {generatedSlides.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Generated Slide Deck
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadSlides}>
                    <Download className="w-4 h-4 mr-2" />
                    Download PPTX
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedSlides.map((slide, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                    <div className="aspect-video bg-white dark:bg-gray-700 rounded mb-2 flex items-center justify-center">
                      <Image className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="font-medium text-sm">Slide {index + 1}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {slide.title || `Slide ${index + 1} Title`}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Screen Recording Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" disabled>
                <Monitor className="w-4 h-4 mr-2" />
                Record Screen
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Coming Soon</span>
              </Button>
              <Button variant="outline" disabled>
                <Play className="w-4 h-4 mr-2" />
                Add Voiceover
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Coming Soon</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Deliverables:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Slide decks in PowerPoint format</li>
                  <li>• Screen recording videos</li>
                  <li>• Sync voiceover or add subtitles</li>
                  <li>• Export as MP4 or presentation files</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}