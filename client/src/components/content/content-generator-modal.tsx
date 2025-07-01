import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, BookOpen, Target, FileText, Users, Clock, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
  const [prompt, setPrompt] = useState("");
  const [contentType, setContentType] = useState("comprehensive");
  const [targetAudience, setTargetAudience] = useState("");
  const [duration, setDuration] = useState("");
  const [includeExercises, setIncludeExercises] = useState(true);
  const [includeCaseStudies, setIncludeCaseStudies] = useState(true);
  const [includeAssessments, setIncludeAssessments] = useState(true);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [responses, setResponses] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<'input' | 'questions' | 'generating' | 'review'>('input');

  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/content/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: (data) => {
      if (data.followUpQuestions && data.followUpQuestions.length > 0) {
        setFollowUpQuestions(data.followUpQuestions);
        setResponses(new Array(data.followUpQuestions.length).fill(""));
        setCurrentStep('questions');
      } else {
        setGeneratedContent(data.content);
        setCurrentStep('review');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate content",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (content: any) => {
      await apiRequest(`/api/module-content/${moduleContentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/module-content/outline/${outlineId}`] });
      toast({
        title: "Content Saved",
        description: "Module content has been saved successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save content",
        variant: "destructive",
      });
    },
  });

  const handleInitialGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide specific requirements for this module",
        variant: "destructive",
      });
      return;
    }

    setCurrentStep('generating');
    generateMutation.mutate({
      moduleContentId,
      prompt,
      contentType,
      targetAudience,
      duration,
      includeExercises,
      includeCaseStudies,
      includeAssessments,
    });
  };

  const handleFollowUpComplete = () => {
    setCurrentStep('generating');
    generateMutation.mutate({
      moduleContentId,
      prompt,
      contentType,
      targetAudience,
      duration,
      includeExercises,
      includeCaseStudies,
      includeAssessments,
      followUpResponses: responses,
    });
  };

  const handleSaveContent = () => {
    saveMutation.mutate(generatedContent);
  };

  const handleResponseChange = (index: number, value: string) => {
    const newResponses = [...responses];
    newResponses[index] = value;
    setResponses(newResponses);
  };

  const renderInputStep = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="prompt" className="text-sm font-medium">
          Specific Requirements for This Module
        </Label>
        <Textarea
          id="prompt"
          placeholder="Describe what you want to focus on for this module. For example: 'Include practical examples from the healthcare industry' or 'Focus on beginner-friendly explanations with step-by-step guides'"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="mt-2 min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contentType" className="text-sm font-medium">
            Content Type
          </Label>
          <Select value={contentType} onValueChange={setContentType}>
            <SelectTrigger>
              <SelectValue placeholder="Select content type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comprehensive">Comprehensive (Full Detail)</SelectItem>
              <SelectItem value="concise">Concise (Key Points)</SelectItem>
              <SelectItem value="practical">Practical (Hands-on Focus)</SelectItem>
              <SelectItem value="theoretical">Theoretical (Concept Focus)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="targetAudience" className="text-sm font-medium">
            Target Audience
          </Label>
          <Select value={targetAudience} onValueChange={setTargetAudience}>
            <SelectTrigger>
              <SelectValue placeholder="Select audience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="mixed">Mixed Levels</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium">Include Additional Content</Label>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="exercises"
              checked={includeExercises}
              onCheckedChange={setIncludeExercises}
            />
            <Label htmlFor="exercises" className="text-sm">Exercises</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="caseStudies"
              checked={includeCaseStudies}
              onCheckedChange={setIncludeCaseStudies}
            />
            <Label htmlFor="caseStudies" className="text-sm">Case Studies</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="assessments"
              checked={includeAssessments}
              onCheckedChange={setIncludeAssessments}
            />
            <Label htmlFor="assessments" className="text-sm">Assessments</Label>
          </div>
        </div>
      </div>

      <Button 
        onClick={handleInitialGenerate}
        className="w-full"
        disabled={generateMutation.isPending}
      >
        {generateMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Analyzing Requirements...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Content
          </>
        )}
      </Button>
    </div>
  );

  const renderQuestionsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Target className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Help Us Create Better Content
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please answer these questions to generate more targeted and relevant content
        </p>
      </div>

      <div className="space-y-4">
        {followUpQuestions.map((question, index) => (
          <div key={index}>
            <Label className="text-sm font-medium">
              {question}
            </Label>
            <Textarea
              placeholder="Your answer..."
              value={responses[index]}
              onChange={(e) => handleResponseChange(index, e.target.value)}
              className="mt-2"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep('input')}
          className="flex-1"
        >
          Back
        </Button>
        <Button 
          onClick={handleFollowUpComplete}
          className="flex-1"
          disabled={generateMutation.isPending || responses.some(r => !r.trim())}
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Content
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderGeneratingStep = () => (
    <div className="text-center py-12">
      <div className="flex items-center justify-center mb-6">
        <div className="bg-blue-100 p-4 rounded-full">
          <Sparkles className="h-8 w-8 text-blue-600 animate-pulse" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Creating Your Content
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        AI is generating comprehensive course content based on your requirements...
      </p>
      <div className="flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Generated Content Review
        </h3>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Complete
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <span>{generatedContent?.lessons?.length || 0} detailed lessons</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-green-500" />
                  <span>{generatedContent?.exercises?.length || 0} practical exercises</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-purple-500" />
                  <span>{generatedContent?.assessments?.length || 0} assessment questions</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lessons">
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {generatedContent?.lessons?.map((lesson: any, index: number) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{lesson.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Duration: {lesson.duration}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                      {lesson.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="exercises">
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {generatedContent?.exercises?.map((exercise: any, index: number) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{exercise.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {exercise.description}
                    </p>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Materials: {exercise.materials?.join(", ") || "None specified"}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="assessments">
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {generatedContent?.assessments?.map((assessment: any, index: number) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{assessment.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Type: {assessment.type}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {assessment.questions?.length || 0} questions
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => {
            setCurrentStep('input');
            setGeneratedContent(null);
          }}
          className="flex-1"
        >
          Regenerate
        </Button>
        <Button 
          onClick={handleSaveContent}
          className="flex-1"
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Content
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            AI Content Generator
          </DialogTitle>
          <DialogDescription>
            Generate comprehensive course content with AI assistance
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {currentStep === 'input' && renderInputStep()}
          {currentStep === 'questions' && renderQuestionsStep()}
          {currentStep === 'generating' && renderGeneratingStep()}
          {currentStep === 'review' && renderReviewStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}