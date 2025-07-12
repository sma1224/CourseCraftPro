import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, User, Send, CheckCircle, AlertCircle, Lightbulb, Eye, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import RichTextEditor from "@/components/editor/rich-text-editor";

interface InteractiveContentGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  moduleTitle: string;
  moduleDescription: string;
  moduleIndex: number;
  outlineId: number;
  courseTitle: string;
  courseDescription: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ContentRequirement {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export default function InteractiveContentGenerator({
  isOpen,
  onClose,
  moduleTitle,
  moduleDescription,
  moduleIndex,
  outlineId,
  courseTitle,
  courseDescription
}: InteractiveContentGeneratorProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [contentRequirements, setContentRequirements] = useState<ContentRequirement[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<'analysis' | 'requirements' | 'generation' | 'review'>('analysis');
  const [contentDetail, setContentDetail] = useState<'brief' | 'quick' | 'detailed' | 'comprehensive'>('detailed');
  const [wordCount, setWordCount] = useState<number>(1000);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [showGeneratedContent, setShowGeneratedContent] = useState(false);
  
  const queryClient = useQueryClient();

  // Initialize content analysis when modal opens
  React.useEffect(() => {
    if (isOpen && chatMessages.length === 0) {
      startContentAnalysis();
    }
  }, [isOpen]);

  const startContentAnalysis = async () => {
    setIsAnalyzing(true);
    setCurrentPhase('analysis');
    
    const systemMessage: ChatMessage = {
      role: 'system',
      content: `Starting intelligent content analysis for "${moduleTitle}"...`,
      timestamp: new Date()
    };
    
    setChatMessages([systemMessage]);
    
    try {
      const response = await fetch('/api/analyze-content-requirements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          moduleTitle,
          moduleDescription,
          courseTitle,
          courseDescription,
          moduleIndex
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze content');
      }
      
      const analysisResponse = await response.json();
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: analysisResponse.analysis,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);
      setContentRequirements(analysisResponse.requirements);
      setCurrentPhase('requirements');
      
    } catch (error) {
      toast({
        title: "Analysis Error",
        description: "Failed to analyze content requirements. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    const messageToSend = currentMessage;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/content-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: messageToSend,
          context: {
            moduleTitle,
            moduleDescription,
            courseTitle,
            contentRequirements,
            currentPhase
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to process message');
      }
      
      const chatResponse = await response.json();
      console.log('Chat response received:', chatResponse);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: chatResponse.message || 'No response received',
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);
      
      if (chatResponse.updatedRequirements) {
        setContentRequirements(chatResponse.updatedRequirements);
      }
      
      if (chatResponse.phase) {
        setCurrentPhase(chatResponse.phase);
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Chat Error",
        description: "Failed to process message. Please try again.",
        variant: "destructive",
      });
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateContentMutation = useMutation({
    mutationFn: async () => {
      setCurrentPhase('generation');
      setGenerationProgress(0);
      
      const response = await fetch('/api/generate-comprehensive-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          outlineId,
          moduleIndex,
          moduleTitle,
          moduleDescription,
          courseTitle,
          courseDescription,
          requirements: contentRequirements.filter(req => req.completed),
          chatHistory: chatMessages,
          contentDetail,
          wordCount
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate content');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Content generation successful:', data);
      setGenerationProgress(100);
      queryClient.invalidateQueries({ queryKey: [`/api/outlines/${outlineId}/module-contents`] });
      
      // Store generated content
      if (data.content) {
        setGeneratedContent(data.content);
        setShowGeneratedContent(true);
      }
      
      const successMessage: ChatMessage = {
        role: 'system',
        content: `✅ Comprehensive content generated successfully! The module now includes detailed lessons, interactive exercises, assessments, and real-world applications.`,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, successMessage]);
      setCurrentPhase('review');
      
      toast({
        title: "Content Generated",
        description: "Comprehensive module content has been created successfully.",
      });
    },
    onError: () => {
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

  const getPhaseIcon = () => {
    switch (currentPhase) {
      case 'analysis': return <Bot className="h-4 w-4" />;
      case 'requirements': return <CheckCircle className="h-4 w-4" />;
      case 'generation': return <Lightbulb className="h-4 w-4" />;
      case 'review': return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getPhaseTitle = () => {
    switch (currentPhase) {
      case 'analysis': return 'Analyzing Content Requirements';
      case 'requirements': return 'Define Content Requirements';
      case 'generation': return 'Generating Comprehensive Content';
      case 'review': return 'Content Review & Finalization';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getPhaseIcon()}
            Interactive Content Generator - {moduleTitle}
          </DialogTitle>
          <div className="text-sm text-gray-500">
            {getPhaseTitle()}
          </div>
        </DialogHeader>
        
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
          {/* Chat Interface or Content Display */}
          <div className="lg:col-span-2 flex flex-col">
            {showGeneratedContent && currentPhase === 'review' ? (
              <Card className="flex-1 flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Generated Content
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowGeneratedContent(false)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Show Chat
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 min-h-0 max-h-[60vh] overflow-y-auto">
                    <RichTextEditor 
                      content={generatedContent}
                      onSave={(content) => {
                        setGeneratedContent(content);
                        toast({
                          title: "Content Updated",
                          description: "Your changes have been saved."
                        });
                      }}
                      readOnly={false}
                      title={moduleTitle}
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="flex-1 flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">AI Content Assistant</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col min-h-0">
                  <ScrollArea className="flex-1 p-4 border rounded-lg mb-4">
                    <div className="space-y-4">
                      {chatMessages.map((message, index) => (
                        <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === 'user' 
                              ? 'bg-blue-500 text-white' 
                              : message.role === 'system'
                              ? 'bg-gray-100 text-gray-700 border'
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
                      ))}
                      {isAnalyzing && (
                        <div className="flex gap-3 justify-start">
                          <div className="bg-gray-50 border rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <Bot className="h-3 w-3" />
                              <div className="flex gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  
                  <div className="flex gap-2">
                    <Textarea
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      placeholder="Ask about content depth, coverage, or specific requirements..."
                      className="flex-1 resize-none"
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={!currentMessage.trim() || isAnalyzing}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Requirements Panel */}
          <div className="flex flex-col">
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Content Requirements</CardTitle>
                <div className="text-xs text-gray-500">
                  Select what to include in your content
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    {contentRequirements.map((requirement) => (
                      <div key={requirement.id} className="flex items-start space-x-2">
                        <Checkbox
                          checked={requirement.completed}
                          onCheckedChange={() => toggleRequirement(requirement.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{requirement.title}</span>
                            <Badge 
                              variant={requirement.priority === 'high' ? 'destructive' : 
                                      requirement.priority === 'medium' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {requirement.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{requirement.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                {/* Content Detail Options */}
                <div className="mt-4 space-y-3 border-t pt-3">
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="content-detail" className="text-sm font-medium">Content Detail Level</Label>
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
                  
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="word-count" className="text-sm font-medium">Target Word Count</Label>
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
                </div>
                
                {currentPhase === 'generation' && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Generation Progress</span>
                      <span>{generationProgress}%</span>
                    </div>
                    <Progress value={generationProgress} className="h-2" />
                  </div>
                )}
                
                <div className="flex gap-2 mt-4">
                  {currentPhase === 'review' && generatedContent ? (
                    <Button
                      onClick={() => setShowGeneratedContent(true)}
                      className="flex-1"
                      variant="default"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Generated Content
                    </Button>
                  ) : (
                    <Button
                      onClick={() => generateContentMutation.mutate()}
                      disabled={contentRequirements.filter(req => req.completed).length === 0 || 
                               generateContentMutation.isPending || 
                               currentPhase === 'generation'}
                      className="flex-1"
                    >
                      {generateContentMutation.isPending ? 'Generating...' : 'Generate Content'}
                    </Button>
                  )}
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}