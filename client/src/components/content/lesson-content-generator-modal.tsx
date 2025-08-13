import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { 
  MessageSquare, 
  Settings, 
  FileText, 
  CheckCircle,
  Clock,
  BookOpen,
  Target,
  Users,
  Sparkles,
  Send,
  Wand2
} from "lucide-react";

interface LessonContentGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  outlineId: number;
  moduleIndex: number;
  lessonIndex: number;
  lessonTitle: string;
  lessonDescription: string;
  courseTitle: string;
  courseDescription: string;
  onSuccess?: () => void;
}

interface ContentRequirement {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

const defaultRequirements: ContentRequirement[] = [
  {
    id: 'learning-objectives',
    title: 'Learning Objectives',
    description: 'Clear, measurable learning outcomes for this lesson',
    completed: true
  },
  {
    id: 'theoretical-foundation',
    title: 'Theoretical Foundation',
    description: 'Core concepts and principles explained in depth',
    completed: true
  },
  {
    id: 'practical-examples',
    title: 'Practical Examples',
    description: 'Real-world examples and implementation scenarios',
    completed: true
  },
  {
    id: 'step-by-step-guide',
    title: 'Step-by-step Instructions',
    description: 'Detailed instructions for applying concepts',
    completed: false
  },
  {
    id: 'interactive-exercises',
    title: 'Interactive Exercises',
    description: 'Hands-on activities and practice exercises',
    completed: false
  },
  {
    id: 'case-studies',
    title: 'Case Studies',
    description: 'Industry examples and detailed scenarios',
    completed: false
  },
  {
    id: 'assessments',
    title: 'Assessment Questions',
    description: 'Knowledge checks and practice problems',
    completed: false
  },
  {
    id: 'resources',
    title: 'Additional Resources',
    description: 'Supplementary materials and references',
    completed: false
  }
];

export default function LessonContentGeneratorModal({
  isOpen,
  onClose,
  outlineId,
  moduleIndex,
  lessonIndex,
  lessonTitle,
  lessonDescription,
  courseTitle,
  courseDescription,
  onSuccess
}: LessonContentGeneratorModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("requirements");
  const [requirements, setRequirements] = useState<ContentRequirement[]>(defaultRequirements);
  const [detailLevel, setDetailLevel] = useState("detailed");
  const [targetWordCount, setTargetWordCount] = useState(1000);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{role: string, content: string}>>([]);
  const [currentPhase, setCurrentPhase] = useState("requirements");

  // Generate lesson content mutation
  const generateContentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/generate-lesson-content", {
        outlineId,
        moduleIndex,
        lessonIndex,
        lessonTitle,
        lessonDescription,
        courseTitle,
        courseDescription,
        requirements,
        detailLevel,
        targetWordCount
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Content Generated Successfully",
        description: `Lesson content has been created for "${lessonTitle}".`,
      });
      setActiveTab("review");
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error('Error generating lesson content:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate lesson content. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Chat mutation for interactive conversation
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/content-chat", {
        message,
        context: {
          lessonTitle,
          contentRequirements: requirements,
          currentPhase
        }
      });
      return response.json();
    },
    onSuccess: (data) => {
      setChatHistory(prev => [
        ...prev,
        { role: "user", content: chatMessage },
        { role: "assistant", content: data.message }
      ]);
      setChatMessage("");
      
      if (data.updatedRequirements) {
        setRequirements(data.updatedRequirements);
      }
      
      if (data.phase && data.phase !== currentPhase) {
        setCurrentPhase(data.phase);
        if (data.phase === "generation") {
          setActiveTab("generation");
        }
      }
    },
    onError: (error) => {
      console.error('Error in chat:', error);
      toast({
        title: "Chat Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleRequirement = (id: string) => {
    setRequirements(prev => 
      prev.map(req => 
        req.id === id ? { ...req, completed: !req.completed } : req
      )
    );
  };

  const getWordCountLabel = (level: string) => {
    switch (level) {
      case 'brief': return '300-500 words';
      case 'quick': return '500-800 words';
      case 'detailed': return '800-1200 words';
      case 'comprehensive': return '1200+ words';
      default: return '800-1200 words';
    }
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    chatMutation.mutate(chatMessage);
  };

  const handleGenerateContent = () => {
    const selectedRequirements = requirements.filter(req => req.completed);
    if (selectedRequirements.length === 0) {
      toast({
        title: "No Requirements Selected",
        description: "Please select at least one content requirement before generating.",
        variant: "destructive",
      });
      return;
    }
    
    setActiveTab("generation");
    generateContentMutation.mutate();
  };

  const completedRequirements = requirements.filter(req => req.completed).length;
  const progressPercentage = (completedRequirements / requirements.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Smart Lesson Generator
          </DialogTitle>
          <DialogDescription>
            Generate comprehensive content for: <strong>{lessonTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="requirements" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Requirements
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="generation" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Review
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 h-[600px]">
            <TabsContent value="requirements" className="h-full">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Content Requirements</span>
                    <Badge variant="secondary">
                      {completedRequirements}/{requirements.length} selected
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Select the types of content to include in your lesson
                  </CardDescription>
                  <Progress value={progressPercentage} className="h-2" />
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[420px]">
                    <div className="space-y-4">
                      {requirements.map((requirement) => (
                        <div key={requirement.id} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800">
                          <Checkbox
                            id={requirement.id}
                            checked={requirement.completed}
                            onCheckedChange={() => toggleRequirement(requirement.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <Label htmlFor={requirement.id} className="font-medium cursor-pointer">
                              {requirement.title}
                            </Label>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {requirement.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="h-full">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Content Generation Settings</CardTitle>
                  <CardDescription>
                    Customize the detail level and scope of your lesson content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="detail-level">Content Detail Level</Label>
                    <Select value={detailLevel} onValueChange={setDetailLevel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brief">Brief Overview ({getWordCountLabel('brief')})</SelectItem>
                        <SelectItem value="quick">Quick Guide ({getWordCountLabel('quick')})</SelectItem>
                        <SelectItem value="detailed">Detailed Content ({getWordCountLabel('detailed')})</SelectItem>
                        <SelectItem value="comprehensive">Comprehensive ({getWordCountLabel('comprehensive')})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="word-count">Target Word Count</Label>
                    <Input
                      type="number"
                      value={targetWordCount}
                      onChange={(e) => setTargetWordCount(parseInt(e.target.value) || 1000)}
                      min={300}
                      max={5000}
                      step={100}
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Recommended: {getWordCountLabel(detailLevel)}
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Lesson Overview
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        <span><strong>Course:</strong> {courseTitle}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span><strong>Lesson:</strong> {lessonTitle}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span><strong>Description:</strong> {lessonDescription}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="generation" className="h-full">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    Generating Lesson Content
                  </CardTitle>
                  <CardDescription>
                    Creating comprehensive educational content for your lesson
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col justify-center items-center h-[420px]">
                  {generateContentMutation.isPending ? (
                    <div className="text-center space-y-4">
                      <LoadingSpinner />
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">Generating Content...</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Creating {targetWordCount}+ words of educational content
                        </p>
                        <div className="flex justify-center gap-2 mt-4">
                          {requirements.filter(req => req.completed).map((req) => (
                            <Badge key={req.id} variant="secondary" className="text-xs">
                              {req.title}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : generateContentMutation.isSuccess ? (
                    <div className="text-center space-y-4">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium text-green-700 dark:text-green-300">
                          Content Generated Successfully!
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Your lesson content has been created and saved.
                        </p>
                        <Button onClick={() => setActiveTab("review")} className="mt-4">
                          Review Content
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <Button 
                        onClick={handleGenerateContent}
                        size="lg"
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                      >
                        <Sparkles className="h-5 w-5 mr-2" />
                        Generate Lesson Content
                      </Button>
                      <p className="text-gray-600 dark:text-gray-300">
                        Ready to create comprehensive content for "{lessonTitle}"
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="review" className="h-full">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Content Review</CardTitle>
                  <CardDescription>
                    Your lesson content has been generated and saved
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[420px] flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Content Successfully Generated</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Your lesson "{lessonTitle}" now has comprehensive educational content.
                      </p>
                      <div className="flex justify-center gap-2 mt-4">
                        <Button variant="outline" onClick={onClose}>
                          Close
                        </Button>
                        <Button onClick={() => setActiveTab("requirements")}>
                          Generate Again
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}