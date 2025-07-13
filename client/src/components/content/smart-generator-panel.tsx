import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bot, User, Send, Sparkles, MessageSquare, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SmartGeneratorPanelProps {
  module: any;
  moduleIndex: number;
  outlineId: number;
  courseTitle: string;
  courseDescription: string;
  onContentGenerated: (content: string) => void;
}

interface ContentRequirement {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export default function SmartGeneratorPanel({
  module,
  moduleIndex,
  outlineId,
  courseTitle,
  courseDescription,
  onContentGenerated
}: SmartGeneratorPanelProps) {
  const [contentRequirements, setContentRequirements] = useState<ContentRequirement[]>([]);
  const [contentDetail, setContentDetail] = useState<'brief' | 'quick' | 'detailed' | 'comprehensive'>('detailed');
  const [wordCount, setWordCount] = useState<number>(1000);
  const [showSmartAssistant, setShowSmartAssistant] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<any[]>([]);
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const queryClient = useQueryClient();

  // Initialize content requirements
  useEffect(() => {
    if (module) {
      initializeContentRequirements();
    }
  }, [module]);

  const initializeContentRequirements = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-content-requirements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          moduleTitle: module.title,
          moduleDescription: module.description,
          courseTitle,
          courseDescription,
          moduleIndex
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Parse requirements from the analysis response
        const requirements: ContentRequirement[] = [
          {
            id: 'theoretical',
            title: 'Theoretical Foundations',
            description: 'Comprehensive explanation of core concepts, principles, and terminology',
            completed: true,
            priority: 'high'
          },
          {
            id: 'practical',
            title: 'Practical Examples & Demonstrations',
            description: 'Step-by-step examples showing real-world application of concepts',
            completed: true,
            priority: 'high'
          },
          {
            id: 'interactive',
            title: 'Interactive Learning Exercises',
            description: 'Hands-on activities, practice problems, and interactive elements',
            completed: true,
            priority: 'medium'
          },
          {
            id: 'case-studies',
            title: 'Real-World Case Studies',
            description: 'Industry examples and scenarios for practical application',
            completed: false,
            priority: 'medium'
          },
          {
            id: 'assessments',
            title: 'Knowledge Assessments',
            description: 'Quizzes, self-check questions, and evaluation tools',
            completed: false,
            priority: 'low'
          }
        ];
        setContentRequirements(requirements);
      }
    } catch (error) {
      console.error('Error analyzing content requirements:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateContentMutation = useMutation({
    mutationFn: async () => {
      const selectedRequirements = contentRequirements.filter(req => req.completed);
      
      const response = await fetch('/api/generate-comprehensive-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          outlineId,
          moduleIndex,
          moduleTitle: module.title,
          moduleDescription: module.description,
          courseTitle,
          courseDescription,
          requirements: selectedRequirements,
          detailLevel: contentDetail,
          targetWordCount: wordCount
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const result = await response.json();
      return result.content;
    },
    onSuccess: (content) => {
      onContentGenerated(content);
      toast({
        title: "Content Generated",
        description: "Comprehensive content has been generated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/outlines/${outlineId}/module-contents`] });
    },
    onError: (error) => {
      toast({
        title: "Generation Error",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    }
  });

  const toggleRequirement = (requirementId: string) => {
    setContentRequirements(prev => 
      prev.map(req => 
        req.id === requirementId 
          ? { ...req, completed: !req.completed }
          : req
      )
    );
  };

  const sendAssistantMessage = async () => {
    if (!currentAssistantMessage.trim()) return;
    
    const userMessage = {
      role: 'user',
      content: currentAssistantMessage,
      timestamp: new Date()
    };

    setAssistantMessages(prev => [...prev, userMessage]);
    setCurrentAssistantMessage("");
    
    // Simple AI assistant response (placeholder)
    const aiResponse = {
      role: 'assistant',
      content: `I can help you with content generation for "${module.title}". You can ask me about:
      
- Content depth and detail level
- Specific examples or case studies
- Assessment strategies
- Learning objectives
- Target audience considerations

What would you like to know?`,
      timestamp: new Date()
    };

    setTimeout(() => {
      setAssistantMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Content Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Content Requirements</CardTitle>
          <p className="text-sm text-gray-600">Select what to include in your content</p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-4">
              {isAnalyzing ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Analyzing content requirements...</p>
                  </div>
                </div>
              ) : (
                contentRequirements.map((requirement) => (
                  <div key={requirement.id} className="flex items-start space-x-3">
                    <Checkbox
                      checked={requirement.completed}
                      onCheckedChange={() => toggleRequirement(requirement.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{requirement.title}</span>
                        <Badge 
                          variant={requirement.priority === 'high' ? 'destructive' : 
                                  requirement.priority === 'medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {requirement.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{requirement.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Content Detail Level */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Content Detail Level</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="detail-level">Detail Level</Label>
            <Select value={contentDetail} onValueChange={(value: any) => setContentDetail(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select detail level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brief">Brief (300-500 words)</SelectItem>
                <SelectItem value="quick">Quick (500-800 words)</SelectItem>
                <SelectItem value="detailed">Detailed (800-1200 words)</SelectItem>
                <SelectItem value="comprehensive">Comprehensive (1200+ words)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="word-count">Target Word Count</Label>
            <Input
              id="word-count"
              type="number"
              min="200"
              max="3000"
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
              placeholder="1000"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => generateContentMutation.mutate()}
          disabled={contentRequirements.filter(req => req.completed).length === 0 || isGenerating}
          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {generateContentMutation.isPending ? 'Generating...' : 'Generate Content'}
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setShowSmartAssistant(true)}
          className="flex items-center gap-2"
        >
          <Bot className="h-4 w-4" />
          Smart Assistant
        </Button>
      </div>

      {/* Smart Assistant Modal */}
      <Dialog open={showSmartAssistant} onOpenChange={setShowSmartAssistant}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Smart Content Assistant
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 p-4 border rounded-lg mb-4">
              <div className="space-y-4">
                {assistantMessages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Ask me anything about content generation!</p>
                  </div>
                ) : (
                  assistantMessages.map((message, index) => (
                    <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-50 border'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          {message.role === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                          <span className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            
            <div className="flex gap-2">
              <Textarea
                value={currentAssistantMessage}
                onChange={(e) => setCurrentAssistantMessage(e.target.value)}
                placeholder="Ask about content requirements, examples, or generation strategies..."
                className="flex-1 resize-none"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendAssistantMessage();
                  }
                }}
              />
              <Button 
                onClick={sendAssistantMessage} 
                disabled={!currentAssistantMessage.trim()}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}