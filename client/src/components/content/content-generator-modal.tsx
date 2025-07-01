import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { MessageCircle, Lightbulb, Target, BookOpen, Zap, CheckCircle, Edit2 } from "lucide-react";

interface ContentGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleContentId: number;
  outlineId: number;
}

export default function ContentGeneratorModal({ 
  isOpen, 
  onClose, 
  moduleContentId, 
  outlineId 
}: ContentGeneratorModalProps) {
  const [step, setStep] = useState(1);
  const [userPrompt, setUserPrompt] = useState("");
  const [contentTypes, setContentTypes] = useState<string[]>([]);
  const [targetEngagement, setTargetEngagement] = useState<string>("");
  const [difficultyLevel, setDifficultyLevel] = useState<string>("");
  const [includeTemplates, setIncludeTemplates] = useState(false);
  const [includeExamples, setIncludeExamples] = useState(true);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [enhancementPrompt, setEnhancementPrompt] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch module content details
  const { data: moduleContent, isLoading: moduleLoading } = useQuery({
    queryKey: [`/api/module-content/${moduleContentId}`],
    enabled: isOpen && !!moduleContentId,
    retry: false,
  });

  // Fetch outline for context
  const { data: outline } = useQuery({
    queryKey: [`/api/course-outlines/${outlineId}`],
    enabled: isOpen && !!outlineId,
    retry: false,
  });

  // Generate follow-up questions mutation
  const followUpMutation = useMutation({
    mutationFn: async (data: { userPrompt: string; moduleIndex: number }) => {
      const response = await apiRequest(
        "POST", 
        `/api/module-content/${moduleContentId}/follow-up-questions`, 
        data
      );
      return response.json();
    },
    onSuccess: (data) => {
      setFollowUpQuestions(data.questions || []);
      setStep(2);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Failed to Generate Questions",
        description: "Unable to generate follow-up questions. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generate content mutation
  const generateContentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(
        "POST", 
        `/api/module-content/${moduleContentId}/generate`, 
        data
      );
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedContent(data.content);
      setStep(3);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/course-outlines/${outlineId}/module-contents`] });
      
      toast({
        title: "Content Generated",
        description: "Module content has been successfully created!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Content Generation Failed",
        description: "Unable to generate module content. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Enhance content mutation
  const enhanceContentMutation = useMutation({
    mutationFn: async (data: { enhancementPrompt: string }) => {
      const response = await apiRequest(
        "POST", 
        `/api/module-content/${moduleContentId}/enhance`, 
        data
      );
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedContent(data.content);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/course-outlines/${outlineId}/module-contents`] });
      
      toast({
        title: "Content Enhanced",
        description: "Module content has been successfully improved!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Enhancement Failed",
        description: "Unable to enhance module content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInitialSubmit = () => {
    if (!userPrompt.trim()) {
      toast({
        title: "Content Description Required",
        description: "Please describe what content you'd like to create for this module.",
        variant: "destructive",
      });
      return;
    }

    if (!moduleContent) return;
    
    // Generate follow-up questions
    followUpMutation.mutate({
      userPrompt,
      moduleIndex: moduleContent.moduleIndex
    });
  };

  const handleGenerateContent = () => {
    if (!moduleContent) return;

    const requestData = {
      moduleIndex: moduleContent.moduleIndex,
      userPrompt,
      contentTypes: contentTypes.length > 0 ? contentTypes : undefined,
      targetEngagement: targetEngagement || undefined,
      difficultyLevel: difficultyLevel || undefined,
      includeTemplates,
      includeExamples,
    };

    generateContentMutation.mutate(requestData);
  };

  const handleEnhanceContent = () => {
    if (!enhancementPrompt.trim()) {
      toast({
        title: "Enhancement Description Required",
        description: "Please describe how you'd like to improve the content.",
        variant: "destructive",
      });
      return;
    }

    enhanceContentMutation.mutate({ enhancementPrompt });
  };

  const handleClose = () => {
    setStep(1);
    setUserPrompt("");
    setContentTypes([]);
    setTargetEngagement("");
    setDifficultyLevel("");
    setIncludeTemplates(false);
    setIncludeExamples(true);
    setFollowUpQuestions([]);
    setGeneratedContent(null);
    setEnhancementPrompt("");
    onClose();
  };

  if (moduleLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center h-96">
            <LoadingSpinner size="lg" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const outlineData = outline?.content as any;
  const moduleData = outlineData?.modules?.[moduleContent?.moduleIndex];
  const hasExistingContent = moduleContent?.content;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            {hasExistingContent ? "Edit Module Content" : "Create Module Content"}
          </DialogTitle>
          <DialogDescription>
            {moduleData && (
              <>Module {moduleContent?.moduleIndex + 1}: {moduleData.title}</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Step 1: Initial Content Description */}
          {step === 1 && (
            <div className="space-y-6">
              {moduleData && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Module Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {moduleData.description}
                    </p>
                    {moduleData.learningObjectives && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Learning Objectives</h4>
                        <div className="flex flex-wrap gap-1">
                          {moduleData.learningObjectives.map((objective: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {objective}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="content-prompt" className="text-base font-medium">
                    Describe the content you want to create
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Be specific about what kind of content you need, the format, and any special requirements.
                  </p>
                  <Textarea
                    id="content-prompt"
                    ref={textareaRef}
                    placeholder="Example: Create engaging content for Module 3: Social Media Analytics. Include practical examples, step-by-step tutorials, and hands-on exercises. Make it suitable for beginners with real-world case studies."
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleInitialSubmit}
                    disabled={followUpMutation.isPending}
                  >
                    {followUpMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Continue
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Follow-up Questions and Preferences */}
          {step === 2 && (
            <ScrollArea className="h-[600px]">
              <div className="space-y-6 pr-4">
                {followUpQuestions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        AI Suggestions
                      </CardTitle>
                      <CardDescription>
                        Based on your description, here are some clarifying questions to create better content:
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {followUpQuestions.map((question, index) => (
                          <div key={index} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              {question}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Content Preferences</CardTitle>
                    <CardDescription>
                      Customize the content generation to match your specific needs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Content Types */}
                    <div>
                      <Label className="text-base font-medium mb-3 block">Content Types to Include</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: "lesson", label: "Lesson Content" },
                          { value: "exercise", label: "Exercises" },
                          { value: "case_study", label: "Case Studies" },
                          { value: "assessment", label: "Assessments" },
                          { value: "resources", label: "Resources" },
                          { value: "activities", label: "Activities" },
                        ].map((type) => (
                          <div key={type.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={type.value}
                              checked={contentTypes.includes(type.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setContentTypes([...contentTypes, type.value]);
                                } else {
                                  setContentTypes(contentTypes.filter(t => t !== type.value));
                                }
                              }}
                            />
                            <Label htmlFor={type.value} className="text-sm">
                              {type.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Engagement Level */}
                    <div>
                      <Label className="text-base font-medium mb-3 block">Target Engagement Level</Label>
                      <Select value={targetEngagement} onValueChange={setTargetEngagement}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select engagement level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - Traditional lecture style</SelectItem>
                          <SelectItem value="medium">Medium - Interactive with examples</SelectItem>
                          <SelectItem value="high">High - Highly interactive and gamified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Difficulty Level */}
                    <div>
                      <Label className="text-base font-medium mb-3 block">Difficulty Level</Label>
                      <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner - Basic concepts and terminology</SelectItem>
                          <SelectItem value="intermediate">Intermediate - Some prior knowledge assumed</SelectItem>
                          <SelectItem value="advanced">Advanced - Expert-level content</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Additional Options */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Additional Options</Label>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="templates"
                            checked={includeTemplates}
                            onCheckedChange={(checked) => setIncludeTemplates(!!checked)}
                          />
                          <Label htmlFor="templates" className="text-sm">
                            Include downloadable templates and worksheets
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="examples"
                            checked={includeExamples}
                            onCheckedChange={(checked) => setIncludeExamples(!!checked)}
                          />
                          <Label htmlFor="examples" className="text-sm">
                            Include practical examples and case studies
                          </Label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleGenerateContent}
                    disabled={generateContentMutation.isPending}
                  >
                    {generateContentMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Generating Content...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Generate Content
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}

          {/* Step 3: Generated Content Review */}
          {step === 3 && generatedContent && (
            <ScrollArea className="h-[600px]">
              <div className="space-y-6 pr-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Content Generated Successfully
                    </CardTitle>
                    <CardDescription>
                      Your module content has been created. Review and enhance as needed.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Content Overview</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {generatedContent.overview}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Lessons:</span>
                          <span className="ml-2">{generatedContent.lessons?.length || 0}</span>
                        </div>
                        <div>
                          <span className="font-medium">Exercises:</span>
                          <span className="ml-2">{generatedContent.exercises?.length || 0}</span>
                        </div>
                        <div>
                          <span className="font-medium">Case Studies:</span>
                          <span className="ml-2">{generatedContent.caseStudies?.length || 0}</span>
                        </div>
                        <div>
                          <span className="font-medium">Assessments:</span>
                          <span className="ml-2">{generatedContent.assessments?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Enhance Content</CardTitle>
                    <CardDescription>
                      Want to improve or modify the generated content? Describe your changes below.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Example: Add more practical examples, include industry-specific case studies, make the exercises more challenging, etc."
                      value={enhancementPrompt}
                      onChange={(e) => setEnhancementPrompt(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <Button 
                      onClick={handleEnhanceContent}
                      disabled={enhanceContentMutation.isPending}
                      variant="outline"
                      className="w-full"
                    >
                      {enhanceContentMutation.isPending ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Enhancing...
                        </>
                      ) : (
                        <>
                          <Target className="h-4 w-4 mr-2" />
                          Enhance Content
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back to Preferences
                  </Button>
                  <Button onClick={handleClose}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}