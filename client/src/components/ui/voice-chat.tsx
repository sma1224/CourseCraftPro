import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, Phone, PhoneOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceChatProps {
  onTranscript?: (transcript: string) => void;
  onConversationEnd?: (conversation: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function VoiceChat({ 
  onTranscript, 
  onConversationEnd, 
  isOpen, 
  onClose 
}: VoiceChatProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [conversation, setConversation] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>>([]);
  
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen && !isConnected) {
      initializeVoiceChat();
    }
    
    return () => {
      cleanup();
    };
  }, [isOpen]);

  const initializeVoiceChat = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      // Initialize audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Connect to WebSocket for real-time communication
      connectWebSocket();
      
      toast({
        title: "Voice Chat Ready",
        description: "You can now have natural conversations about your course",
      });
    } catch (error) {
      console.error('Error initializing voice chat:', error);
      toast({
        title: "Voice Chat Error",
        description: "Failed to initialize voice chat. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/voice-chat`;
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      setIsConnected(true);
      console.log('Voice chat WebSocket connected');
    };
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };
    
    wsRef.current.onclose = () => {
      setIsConnected(false);
      console.log('Voice chat WebSocket disconnected');
    };
    
    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: "Connection Error",
        description: "Lost connection to voice chat service",
        variant: "destructive",
      });
    };
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'transcript':
        addToConversation('user', data.text);
        if (onTranscript) {
          onTranscript(data.text);
        }
        break;
      
      case 'response':
        addToConversation('assistant', data.text);
        if (data.audio) {
          playAudioResponse(data.audio);
        }
        break;
      
      case 'error':
        toast({
          title: "Voice Chat Error",
          description: data.message,
          variant: "destructive",
        });
        break;
    }
  };

  const addToConversation = (role: 'user' | 'assistant', content: string) => {
    const newMessage = {
      role,
      content,
      timestamp: Date.now()
    };
    
    setConversation(prev => [...prev, newMessage]);
  };

  const playAudioResponse = (audioData: string) => {
    if (isMuted) return;
    
    try {
      // Create audio element and play response
      const audio = new Audio(`data:audio/wav;base64,${audioData}`);
      audioElementRef.current = audio;
      audio.play();
    } catch (error) {
      console.error('Error playing audio response:', error);
    }
  };

  const startRecording = async () => {
    if (!mediaStreamRef.current || !wsRef.current) return;
    
    try {
      setIsRecording(true);
      
      // Configure MediaRecorder with supported audio format
      const options = {
        mimeType: 'audio/webm;codecs=opus'
      };
      
      // Fallback to other supported formats if webm is not available
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/wav';
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'audio/mp4';
        }
      }
      
      const mediaRecorder = new MediaRecorder(mediaStreamRef.current, options);
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        if (audioChunks.length > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          // Combine all audio chunks into a single blob
          const audioBlob = new Blob(audioChunks, { type: options.mimeType });
          
          // Convert to base64 and send
          const reader = new FileReader();
          reader.onload = () => {
            const base64Audio = (reader.result as string).split(',')[1];
            wsRef.current?.send(JSON.stringify({
              type: 'audio',
              data: base64Audio
            }));
          };
          reader.readAsDataURL(audioBlob);
        }
      };
      
      // Record for a reasonable duration (3 seconds)
      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Recording will automatically stop and process after 3 seconds
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioElementRef.current) {
      audioElementRef.current.muted = !isMuted;
    }
  };

  const endConversation = () => {
    const conversationText = conversation
      .map(msg => `${msg.role === 'user' ? 'You' : 'AI'}: ${msg.content}`)
      .join('\n');
    
    if (onConversationEnd) {
      onConversationEnd(conversationText);
    }
    
    cleanup();
    onClose();
  };

  const cleanup = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    
    setIsConnected(false);
    setIsRecording(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <h2 className="text-xl font-bold">Voice Chat</h2>
            </div>
            <Button 
              onClick={endConversation}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              End Call
            </Button>
          </div>

          {/* Conversation Display */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 max-h-64 overflow-y-auto">
            {conversation.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Start speaking to begin your conversation</p>
                <p className="text-sm mt-1">Ask about course creation, editing, or any questions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversation.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={toggleMute}
              variant={isMuted ? "destructive" : "outline"}
              size="lg"
              className="rounded-full"
            >
              {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </Button>

            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!isConnected}
              variant={isRecording ? "destructive" : "default"}
              size="lg"
              className="rounded-full w-16 h-16"
            >
              {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </Button>

            <Button
              onClick={onClose}
              variant="outline"
              size="lg"
              className="rounded-full"
            >
              <Phone className="h-6 w-6" />
            </Button>
          </div>

          <div className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
            {isRecording ? 'Recording for 3 seconds...' : 'Press microphone to start 3-second recording'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}