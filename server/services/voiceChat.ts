import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import OpenAI from 'openai';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface VoiceChatSession {
  id: string;
  ws: WebSocket;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  audioBuffer: Buffer[];
  isProcessing: boolean;
}

export class VoiceChatService {
  private wss: WebSocketServer;
  private sessions: Map<string, VoiceChatSession> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/api/voice-chat'
    });

    this.wss.on('connection', (ws: WebSocket) => {
      this.handleConnection(ws);
    });
  }

  private handleConnection(ws: WebSocket) {
    const sessionId = this.generateSessionId();
    const session: VoiceChatSession = {
      id: sessionId,
      ws,
      conversationHistory: [{
        role: 'assistant',
        content: 'Hello! I\'m your AI course creation assistant. I can help you create, edit, and improve your course outlines through natural conversation. What would you like to work on today?'
      }],
      audioBuffer: [],
      isProcessing: false
    };

    this.sessions.set(sessionId, session);
    console.log(`Voice chat session ${sessionId} connected`);

    // Send welcome message
    this.sendMessage(ws, {
      type: 'response',
      text: session.conversationHistory[0].content
    });

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        await this.handleMessage(sessionId, message);
      } catch (error) {
        console.error('Error processing voice chat message:', error);
        this.sendError(ws, 'Failed to process message');
      }
    });

    ws.on('close', () => {
      console.log(`Voice chat session ${sessionId} disconnected`);
      this.sessions.delete(sessionId);
    });

    ws.on('error', (error) => {
      console.error(`Voice chat session ${sessionId} error:`, error);
    });
  }

  private async handleMessage(sessionId: string, message: any) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    switch (message.type) {
      case 'audio':
        await this.handleAudioMessage(session, message.data);
        break;
      
      case 'text':
        await this.handleTextMessage(session, message.text);
        break;
      
      case 'context':
        // Update conversation context (e.g., current course outline being edited)
        await this.updateContext(session, message.context);
        break;
    }
  }

  private async handleAudioMessage(session: VoiceChatSession, audioData: string) {
    try {
      // Convert base64 audio to buffer
      const audioBuffer = Buffer.from(audioData, 'base64');
      
      // Determine file extension based on buffer signature
      let filename = "audio.webm";
      let mimeType = "audio/webm";
      
      // Check for different audio format signatures
      const header = audioBuffer.toString('hex', 0, 4);
      if (header.startsWith('5249') || header.startsWith('7761')) { // RIFF/WAV
        filename = "audio.wav";
        mimeType = "audio/wav";
      } else if (header.startsWith('6674')) { // MP4
        filename = "audio.mp4";
        mimeType = "audio/mp4";
      } else if (header.startsWith('4f67')) { // OGG
        filename = "audio.ogg";
        mimeType = "audio/ogg";
      }
      
      console.log(`Processing audio: ${filename}, size: ${audioBuffer.length} bytes`);
      
      // Create audio file for OpenAI Whisper
      const audioFile = new File([audioBuffer], filename, { type: mimeType });
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "en",
        response_format: "text"
      });

      if (transcription && transcription.trim()) {
        console.log(`Transcribed: ${transcription}`);
        
        // Send transcription to client
        this.sendMessage(session.ws, {
          type: 'transcript',
          text: transcription
        });

        // Process the transcribed text
        await this.handleTextMessage(session, transcription);
      } else {
        this.sendMessage(session.ws, {
          type: 'transcript',
          text: '[No speech detected]'
        });
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      this.sendError(session.ws, 'Failed to process audio. Please try speaking again.');
    }
  }

  private async handleTextMessage(session: VoiceChatSession, text: string) {
    if (session.isProcessing) return;
    
    session.isProcessing = true;
    console.log(`Processing text message: "${text}"`);
    
    try {
      // Add user message to conversation history
      session.conversationHistory.push({
        role: 'user',
        content: text
      });

      console.log('Generating AI response...');
      // Generate AI response using OpenAI Chat Completions
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an expert course creation assistant. Help users create, edit, and improve their educational content through natural conversation. 

Key capabilities:
- Generate course outlines and content
- Suggest improvements to existing courses
- Help with module and lesson planning
- Provide pedagogical advice
- Answer questions about course structure

Keep responses conversational, helpful, and focused on course creation. If users ask about editing existing content, provide specific, actionable suggestions.`
          },
          ...session.conversationHistory
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const aiResponse = response.choices[0].message.content || "I didn't understand that. Could you please rephrase?";
      console.log(`AI Response generated: ${aiResponse.substring(0, 100)}...`);
      
      // Add AI response to conversation history
      session.conversationHistory.push({
        role: 'assistant',
        content: aiResponse
      });

      console.log('Generating speech...');
      // Generate speech from text using OpenAI TTS
      const speechResponse = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: aiResponse,
        response_format: "wav"
      });

      // Convert speech to base64
      const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
      const audioBase64 = audioBuffer.toString('base64');
      console.log(`Audio generated, size: ${audioBase64.length} characters`);

      // Send response with audio
      this.sendMessage(session.ws, {
        type: 'response',
        text: aiResponse,
        audio: audioBase64
      });
      
      console.log('Response sent to client');

    } catch (error) {
      console.error('Error generating AI response:', error);
      this.sendError(session.ws, 'Failed to generate response');
    } finally {
      session.isProcessing = false;
    }
  }

  private async updateContext(session: VoiceChatSession, context: any) {
    // Update the system message with current context
    const contextMessage = `Current context: ${JSON.stringify(context)}`;
    
    // Add context to conversation if it's significantly different
    if (context.currentOutline) {
      session.conversationHistory.push({
        role: 'assistant',
        content: `I can see you're working on "${context.currentOutline.title}". How can I help you improve it?`
      });
    }
  }

  private sendMessage(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, message: string) {
    this.sendMessage(ws, {
      type: 'error',
      message
    });
  }

  private generateSessionId(): string {
    return `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getActiveSessionsCount(): number {
    return this.sessions.size;
  }

  public closeAllSessions() {
    this.sessions.forEach(session => {
      session.ws.close();
    });
    this.sessions.clear();
  }
}