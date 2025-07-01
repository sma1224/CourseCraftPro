import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Users, BookOpen, Target, CheckCircle, FileText, Link, Edit } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { apiRequest } from "@/lib/queryClient";

export default function OutlineViewer() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  
  const { data: outline, isLoading, error } = useQuery({
    queryKey: [`/api/course-outlines/${id}`],
    queryFn: async () => {
      if (!id) throw new Error("No outline ID provided");
      const response = await fetch(`/api/course-outlines/${id}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch outline: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !outline) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">Course outline not found</p>
            <p className="text-sm text-gray-500 mt-2">
              {error ? `Error: ${error}` : 'No data available'}
            </p>
            <Button onClick={() => window.history.back()} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract course data from the outline response
  const courseData = outline?.content || outline;
  
  if (!courseData || !courseData.title) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">Course content not available</p>
            <Button onClick={() => window.history.back()} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="mb-4"
            >
              ← Back
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate(`/content-creator/${id}`)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Content Creator
              </Button>
              <Button onClick={() => {
                toast({
                  title: "Feature Coming Soon",
                  description: "Edit functionality will be available soon",
                });
              }}>
                Edit Outline
              </Button>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {courseData.title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            {courseData.description}
          </p>

          {/* Course Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                <p className="font-semibold">{courseData.totalDuration}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Audience</p>
                <p className="font-semibold text-sm">{courseData.targetAudience}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <BookOpen className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                <p className="font-semibold text-sm">{courseData.courseType}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <FileText className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Modules</p>
                <p className="font-semibold">{courseData.modules?.length || 0}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Learning Objectives */}
        {courseData.learningObjectives && courseData.learningObjectives.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Learning Objectives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {courseData.learningObjectives.map((objective: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{objective}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Modules */}
        {courseData.modules && courseData.modules.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Course Modules
            </h2>
            
            {courseData.modules.map((module: any, moduleIndex: number) => (
              <Card key={moduleIndex} className="overflow-hidden">
                <CardHeader className="bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Module {moduleIndex + 1}: {module.title}
                    </CardTitle>
                    <Badge variant="secondary">
                      {module.duration}
                    </Badge>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    {module.description}
                  </p>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Module Learning Objectives */}
                  {module.learningObjectives && module.learningObjectives.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">
                        Module Objectives
                      </h4>
                      <ul className="space-y-1">
                        {module.learningObjectives.map((objective: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-400">{objective}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Lessons */}
                  {module.lessons && module.lessons.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">
                        Lessons
                      </h4>
                      <div className="space-y-3">
                        {module.lessons.map((lesson: any, lessonIndex: number) => (
                          <div key={lessonIndex} className="border-l-2 border-blue-200 pl-4">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-medium text-gray-900 dark:text-white">
                                {lesson.title}
                              </h5>
                              <Badge variant="outline" className="text-xs">
                                {lesson.duration}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {lesson.description}
                            </p>
                            
                            {lesson.format && lesson.format.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {lesson.format.map((format: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {format}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            
                            {lesson.activities && lesson.activities.length > 0 && (
                              <div className="text-xs text-gray-500 dark:text-gray-500">
                                Activities: {lesson.activities.join(", ")}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Module Activities */}
                  {module.activities && module.activities.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">
                        Module Activities
                      </h4>
                      <div className="grid gap-3">
                        {module.activities.map((activity: any, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {activity.type}
                              </Badge>
                              <span className="font-medium text-sm">{activity.title}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {activity.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Module Resources */}
                  {module.resources && module.resources.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">
                        Resources
                      </h4>
                      <div className="grid gap-2">
                        {module.resources.map((resource: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <Link className="h-4 w-4 text-blue-600" />
                            <Badge variant="outline" className="text-xs">
                              {resource.type}
                            </Badge>
                            <span className="text-gray-700 dark:text-gray-300">
                              {resource.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Assessments */}
        {courseData.assessments && courseData.assessments.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courseData.assessments.map((assessment: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{assessment.type}</Badge>
                      <h4 className="font-semibold">{assessment.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {assessment.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Course Resources */}
        {courseData.resources && courseData.resources.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />
                Course Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {courseData.resources.map((resource: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Link className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {resource.type}
                        </Badge>
                        <span className="font-medium">{resource.title}</span>
                      </div>
                      {resource.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {resource.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}