import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Mic, X, Volume2, StopCircle } from "lucide-react";
import VoiceInput from "@/components/ui/voice-input";
import OutlineViewerModal from "./outline-viewer-modal";
import LoadingSpinner from "@/components/ui/loading-spinner";
import type { CourseGenerationRequest, Project } from "@shared/schema";

interface CourseGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GeneratedOutline {
  title: string;
  description: string;
  targetAudience: string;
  totalDuration: string;
  courseType: string;
  learningObjectives: string[];
  modules: Array<{
    title: string;
    duration: string;
    description: string;
    learningObjectives: string[];
    lessons: Array<{
      title: string;
      duration: string;
      description: string;
      activities: string[];
      format: string[];
    }>;
    activities: Array<{
      type: string;
      title: string;
      description: string;
    }>;
    resources: Array<{
      type: string;
      title: string;
      description?: string;
    }>;
  }>;
  assessments: Array<{
    type: string;
    title: string;
    description: string;
  }>;
  resources: Array<{
    type: string;
    title: string;
    description?: string;
  }>;
}

const EXAMPLE_COURSES = {
  1: {
    title: "Leadership Development for Tech Managers",
    description: "I want to create a comprehensive leadership development program for new managers in technology companies. The program should be 5 days long, covering communication skills, team management, conflict resolution, and performance evaluation. It should include role-playing exercises, case studies from real tech companies, and practical tools they can use immediately. The participants have 2-5 years of technical experience but no formal management training."
  },
  2: {
    title: "Photography for Creative Professionals",
    description: "I need to design an online photography course for creative professionals who want to improve their skills. The course should cover both technical aspects like camera settings, lighting, and composition, as well as creative elements like storytelling through images and developing a personal style. It should be self-paced, include practical assignments, and take about 20 hours to complete. The audience includes graphic designers, marketers, and freelance creatives."
  }
};

export default function CourseGeneratorModal({ isOpen, onClose }: CourseGeneratorModalProps) {
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState("");
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [generatedOutline, setGeneratedOutline] = useState<GeneratedOutline | null>(null);
  const [showOutlineViewer, setShowOutlineViewer] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Generate outline mutation
  const generateOutlineMutation = useMutation({
    mutationFn: async (data: CourseGenerationRequest) => {
      console.log("Making API request with data:", data);
      const response = await apiRequest("POST", "/api/generate-outline", data);
      console.log("API response received:", response.status);
      const result = await response.json();
      console.log("Parsed response:", result);
      return result;
    },
    onSuccess: (outline: GeneratedOutline & { projectId: number; outlineId: number }) => {
      console.log("Outline generation successful:", outline.title);
      setGeneratedOutline(outline);
      setShowOutlineViewer(true);
      setStep(3);
      
      // Invalidate projects to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      
      toast({
        title: "Course Created",
        description: "Your course project and outline have been created successfully",
      });
    },
    onError: (error) => {
      console.error("Outline generation error:", error);
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
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate course outline",
        variant: "destructive",
      });
    },
  });

  // Create project and outline mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      const response = await apiRequest("POST", "/api/projects", projectData);
      return await response.json();
    },
    onSuccess: async (project: Project) => {
      // Save the outline to the project
      if (generatedOutline) {
        try {
          console.log("Saving outline for project:", project.id);
          const outlineResponse = await apiRequest("POST", `/api/projects/${project.id}/outlines`, {
            title: generatedOutline.title,
            content: generatedOutline,
          });
          
          if (outlineResponse.ok) {
            const savedOutline = await outlineResponse.json();
            console.log("Outline saved successfully:", savedOutline.id);
          } else {
            throw new Error("Failed to save outline");
          }
        } catch (error) {
          console.error("Failed to save outline:", error);
          toast({
            title: "Warning",
            description: "Project created but outline save failed. You can try saving again from the dashboard.",
            variant: "destructive",
          });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project Created",
        description: "Your course project and outline have been saved successfully",
      });
      onClose();
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
        title: "Project Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const handleGenerateOutline = () => {
    if (!description.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe your course idea first.",
        variant: "destructive",
      });
      return;
    }

    console.log("Starting outline generation with description:", description);
    setStep(2);
    generateOutlineMutation.mutate({ description });
  };

  const handleFillExample = (exampleNumber: 1 | 2) => {
    const example = EXAMPLE_COURSES[exampleNumber];
    setDescription(example.description);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleVoiceInput = (transcript: string) => {
    setDescription(prev => prev + (prev ? " " : "") + transcript);
  };

  const handleSaveProject = () => {
    // Course is already saved when generated, just close the modal
    onClose();
  };

  const getStepProgress = () => {
    switch (step) {
      case 1: return 33;
      case 2: return 66;
      case 3: return 100;
      default: return 0;
    }
  };

  return (
    <>
      <Dialog open={isOpen && !showOutlineViewer} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">AI Course Generator</DialogTitle>
            <DialogDescription>
              Describe your course idea and let AI create a comprehensive outline for you
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Step Indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    1
                  </div>
                  <span className={`text-sm font-medium ${step >= 1 ? 'text-gray-900' : 'text-gray-500'}`}>
                    Describe
                  </span>
                </div>
                <div className="w-8 h-px bg-gray-300"></div>
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    2
                  </div>
                  <span className={`text-sm ${step >= 2 ? 'text-gray-900' : 'text-gray-500'}`}>
                    Generate
                  </span>
                </div>
                <div className="w-8 h-px bg-gray-300"></div>
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    3
                  </div>
                  <span className={`text-sm ${step >= 3 ? 'text-gray-900' : 'text-gray-500'}`}>
                    Review
                  </span>
                </div>
              </div>
              <Progress value={getStepProgress()} className="h-2" />
            </div>

            {step === 1 && (
              <div className="space-y-6">
                {/* Course Description Input */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Describe your course idea
                  </Label>
                  <Textarea
                    ref={textareaRef}
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={8}
                    className="resize-none"
                    placeholder="For example: 'I want to create a 3-day workshop on digital marketing for small business owners who are complete beginners. They should learn social media marketing, email campaigns, and basic analytics. The course should be practical with hands-on exercises.'"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">Be as detailed as possible for better results</p>
                    <span className="text-sm text-gray-400">{description.length} characters</span>
                  </div>
                </div>

                {/* Voice Input */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Mic className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Voice Input Available</h4>
                      <p className="text-sm text-gray-600">Speak your course idea naturally for AI transcription</p>
                    </div>
                    <VoiceInput onTranscript={handleVoiceInput} />
                  </div>
                </div>

                {/* Example Templates */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Need inspiration? Try these examples:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all"
                      onClick={() => handleFillExample(1)}
                    >
                      <h5 className="font-medium text-gray-900 mb-2">Corporate Training</h5>
                      <p className="text-sm text-gray-600">Leadership skills for new managers in tech companies</p>
                    </div>
                    <div
                      className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all"
                      onClick={() => handleFillExample(2)}
                    >
                      <h5 className="font-medium text-gray-900 mb-2">Online Course</h5>
                      <p className="text-sm text-gray-600">Photography basics for creative professionals</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-4 pt-4">
                  <Button 
                    onClick={handleGenerateOutline}
                    className="flex-1 course-primary-btn"
                    disabled={!description.trim()}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Course Outline
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <LoadingSpinner size="lg" />
                <h3 className="text-lg font-semibold">Generating your course outline...</h3>
                <p className="text-gray-600 text-center max-w-md">
                  Our AI is analyzing your description and creating a comprehensive course structure with learning objectives, activities, and resources.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {showOutlineViewer && generatedOutline && (
        <OutlineViewerModal
          isOpen={showOutlineViewer}
          onClose={() => {
            setShowOutlineViewer(false);
            onClose();
          }}
          outline={generatedOutline}
          onSave={handleSaveProject}
          isSaving={createProjectMutation.isPending}
        />
      )}
    </>
  );
}
