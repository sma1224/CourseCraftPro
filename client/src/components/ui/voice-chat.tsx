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
  const [isProcessing, setIsProcessing] = useState(false);
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
      
      // Auto-reconnect if the modal is still open
      if (isOpen) {
        console.log('Attempting to reconnect...');
        setTimeout(() => {
          if (isOpen && (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)) {
            connectWebSocket();
          }
        }, 2000);
      }
    };
    
    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: "Connection Error",
        description: "Lost connection to voice chat service. Trying to reconnect...",
        variant: "destructive",
      });
    };
  };

  const handleWebSocketMessage = (data: any) => {
    console.log("Received WebSocket message:", data.type, data.text?.substring(0, 50));
    
    switch (data.type) {
      case 'transcript':
        addToConversation('user', data.text);
        setIsProcessing(true);
        if (onTranscript) {
          onTranscript(data.text);
        }
        break;
      
      case 'response':
        console.log("Received AI response:", data.text?.substring(0, 50));
        addToConversation('assistant', data.text);
        if (data.audio) {
          console.log("Playing audio response");
          playAudioResponse(data.audio);
        } else {
          console.log("No audio in response");
        }
        
        // Handle outline URL if present
        if (data.outlineUrl) {
          console.log("Outline created:", data.outlineUrl);
          toast({
            title: "Course Outline Created!",
            description: "Click to view and edit your new course outline",
            action: (
              <a href={data.outlineUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  View Outline
                </Button>
              </a>
            ),
          });
        }
        
        setIsProcessing(false);
        break;
      
      case 'outline_created':
        console.log("Course outline created:", data.outlineUrl);
        addToConversation('assistant', data.text);
        
        // Show prominent toast notification with outline URL
        toast({
          title: "Course Outline Ready!",
          description: "Your course outline has been created and saved.",
          action: (
            <a href={data.outlineUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                View & Edit →
              </Button>
            </a>
          ),
          duration: 12000,
        });
        
        if (data.audio && !isMuted) {
          playAudioResponse(data.audio);
        }
        
        setIsProcessing(false);
        break;
      
      case 'outline_updated':
        console.log("Outline updated via voice chat");
        addToConversation('assistant', data.text);
        
        // Show notification about outline update
        toast({
          title: "Outline Updated!",
          description: "Your course outline has been modified based on your voice request.",
          duration: 8000,
        });
        
        if (data.audio && !isMuted) {
          playAudioResponse(data.audio);
        }
        
        setIsProcessing(false);
        break;
      
      case 'ready':
        setIsProcessing(false);
        console.log("System ready for next input");
        break;
      
      case 'error':
        console.error("Voice chat error:", data.message);
        setIsProcessing(false);
        toast({
          title: "Voice Chat Error",
          description: data.message,
          variant: "destructive",
        });
        break;
        
      default:
        console.log("Unknown message type:", data.type);
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
      console.log("Playing audio response, data length:", audioData.length);
      // Create audio element and play response
      const audio = new Audio(`data:audio/wav;base64,${audioData}`);
      audioElementRef.current = audio;
      
      audio.oncanplaythrough = () => {
        console.log("Audio ready to play");
        audio.play().catch(e => console.error("Audio play failed:", e));
      };
      
      audio.onerror = (e) => {
        console.error("Audio error:", e);
      };
      
      audio.load();
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
      
      // Set up voice activity detection
      const audioContext = audioContextRef.current || new AudioContext();
      const source = audioContext.createMediaStreamSource(mediaStreamRef.current);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);
      
      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let silenceStart = Date.now();
      let speaking = false;
      const silenceThreshold = 2000; // 2 seconds of silence to stop
      const volumeThreshold = 30; // Minimum volume to consider as speech
      
      const checkAudioLevel = () => {
        analyzer.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        
        if (average > volumeThreshold) {
          speaking = true;
          silenceStart = Date.now();
        } else if (speaking && Date.now() - silenceStart > silenceThreshold) {
          // Stop recording after silence threshold
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
          return;
        }
        
        if (mediaRecorder.state === 'recording') {
          requestAnimationFrame(checkAudioLevel);
        }
      };
      
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
            console.log("Sending audio data, size:", base64Audio.length);
            wsRef.current?.send(JSON.stringify({
              type: 'audio',
              data: base64Audio
            }));
          };
          reader.readAsDataURL(audioBlob);
        }
        setIsRecording(false);
        source.disconnect();
        analyzer.disconnect();
      };
      
      // Start recording with maximum timeout as fallback
      const maxRecordingTimeout = setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 30000); // 30 seconds maximum
      
      // Store cleanup function
      (mediaRecorder as any).cleanup = () => {
        clearTimeout(maxRecordingTimeout);
      };
      
      mediaRecorder.start();
      checkAudioLevel(); // Start voice activity detection
      
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
              disabled={!isConnected || isProcessing}
              variant={isRecording ? "destructive" : "default"}
              size="lg"
              className="rounded-full w-16 h-16"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              ) : isRecording ? (
                <MicOff className="h-8 w-8" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
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
            {isProcessing ? 'AI is thinking and generating response...' : 
             isRecording ? 'Recording for 3 seconds...' : 
             'Press microphone to continue conversation'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}