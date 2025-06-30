import { useState, useRef, useCallback } from "react";
import { Button } from "./button";
import { Mic, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceInputProps {
  onTranscript: (transcript: string) => void;
  className?: string;
}

export default function VoiceInput({ onTranscript, className }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      // Check if browser supports MediaRecorder
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        setIsSupported(false);
        toast({
          title: "Voice Input Not Supported",
          description: "Your browser doesn't support voice recording. Please type your description.",
          variant: "destructive",
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        try {
          // Create FormData for file upload
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error('Transcription failed');
          }

          const { transcription } = await response.json();
          onTranscript(transcription);
          
          toast({
            title: "Voice Transcribed",
            description: "Your voice input has been converted to text.",
          });
        } catch (error) {
          console.error('Transcription error:', error);
          toast({
            title: "Transcription Failed",
            description: "Failed to convert voice to text. Please try again or type manually.",
            variant: "destructive",
          });
        }

        // Clean up
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak now to describe your course...",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Failed",
        description: "Failed to start voice recording. Please check your microphone permissions.",
        variant: "destructive",
      });
    }
  }, [onTranscript, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      type="button"
      variant={isRecording ? "destructive" : "default"}
      size="sm"
      onClick={handleToggleRecording}
      className={`${isRecording ? 'voice-recording' : ''} ${className}`}
    >
      {isRecording ? (
        <>
          <Square className="h-4 w-4 mr-2" />
          Stop Recording
        </>
      ) : (
        <>
          <Mic className="h-4 w-4 mr-2" />
          Start Speaking
        </>
      )}
    </Button>
  );
}
