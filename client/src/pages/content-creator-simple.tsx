import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Edit, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function ContentCreator() {
  const { outlineId } = useParams<{ outlineId: string }>();
  const [, navigate] = useLocation();

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
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/outline/${outlineId}`)}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Outline
          </Button>
          
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
          {modules.map((module: any, index: number) => (
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
              </CardContent>
            </Card>
          ))}
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
      </div>
    </div>
  );
}