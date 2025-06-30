import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import OpenAI from 'openai';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface VoiceChatSession {
  id: string;
  ws: WebSocket;
  userId?: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  audioBuffer: Buffer[];
  isProcessing: boolean;
  lastCreatedOutline?: any;
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
      userId: undefined, // Will be set when user authenticates
      conversationHistory: [{
        role: 'assistant',
        content: 'Hello! I\'m your AI course creation assistant. I can help you create, edit, and improve your course outlines through natural conversation. What would you like to work on today?'
      }],
      audioBuffer: [],
      isProcessing: false,
      lastCreatedOutline: undefined
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
      // Keep session alive for a short period to allow reconnection
      setTimeout(() => {
        if (this.sessions.has(sessionId)) {
          console.log(`Cleaning up session ${sessionId} after timeout`);
          this.sessions.delete(sessionId);
        }
      }, 30000); // 30 seconds
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

      // Check if this looks like a course creation request
      const isCourseRequest = this.isCourseCreationRequest(text);
      
      if (isCourseRequest) {
        // Handle course creation
        await this.handleCourseCreation(session, text);
      } else {
        // Handle regular conversation
        await this.handleRegularConversation(session);
      }

    } catch (error) {
      console.error('Error generating AI response:', error);
      this.sendError(session.ws, 'Failed to generate response');
    } finally {
      session.isProcessing = false;
      
      // Send a ready signal to indicate the system is ready for the next input
      this.sendMessage(session.ws, {
        type: 'ready',
        message: 'Ready for next input'
      });
    }
  }

  private isCourseCreationRequest(text: string): boolean {
    const courseKeywords = [
      'course', 'lesson', 'module', 'curriculum', 'training', 'learning',
      'teach', 'education', 'outline', 'syllabus', 'workshop', 'class'
    ];
    
    const lowerText = text.toLowerCase();
    return courseKeywords.some(keyword => lowerText.includes(keyword)) &&
           (lowerText.includes('create') || lowerText.includes('build') || 
            lowerText.includes('design') || lowerText.includes('develop') ||
            lowerText.includes('make') || lowerText.includes('plan'));
  }

  private async handleCourseCreation(session: VoiceChatSession, text: string) {
    // Generate course outline using existing service
    const { generateCourseOutline } = await import('./openai');
    const { storage } = await import('../storage');
    
    try {
      console.log('Generating course outline from voice input...');
      
      // Create a course generation request from the voice input
      const courseRequest = {
        description: text,
        title: `Course on ${text.slice(0, 50)}`,
        targetAudience: 'General learners',
        duration: '4-6 hours',
        courseType: 'Self-paced online course'
      };

      // Generate the outline
      const outline = await generateCourseOutline(courseRequest);
      
      // Store outline in session for summary requests
      session.lastCreatedOutline = outline;
      
      // Get user ID from session (temporary fallback for voice sessions)
      const userId = session.userId || 'voice-user';
      
      // Create a project for this course
      const project = await storage.createProject({
        title: outline.title,
        description: outline.description,
        userId: userId,
        status: 'in_progress'
      });

      // Save the outline
      const savedOutline = await storage.createCourseOutline({
        title: outline.title,
        projectId: project.id,
        content: outline,
        version: 1,
        isActive: true
      });

      // Create response with outline URL
      const outlineUrl = `/outline/${savedOutline.id}`;
      const aiResponse = `Perfect! I've created a comprehensive course outline for "${outline.title}".

Your course outline is ready at: ${outlineUrl}

This includes ${outline.modules.length} modules with detailed lessons, activities, and assessments. You can edit and customize everything on the outline page.

Would you like me to provide a quick voice summary of the main topics and structure?`;

      // Add AI response to conversation history
      session.conversationHistory.push({
        role: 'assistant',
        content: aiResponse
      });

      // Generate speech from the response
      const speechResponse = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: aiResponse,
        response_format: "wav"
      });

      const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
      const audioBase64 = audioBuffer.toString('base64');

      // Send response back to client with outline URL
      this.sendMessage(session.ws, {
        type: 'response',
        text: aiResponse,
        audio: audioBase64,
        outlineUrl: outlineUrl,
        outlineId: savedOutline.id
      });

      console.log(`Course outline created and sent to client: ${outlineUrl}`);

    } catch (error) {
      console.error('Error creating course outline:', error);
      await this.handleRegularConversation(session);
    }
  }

  private async handleRegularConversation(session: VoiceChatSession) {
    console.log('Generating AI response...');
    
    // Check if user is asking for a summary or walkthrough
    const lastUserMessage = session.conversationHistory[session.conversationHistory.length - 1]?.content || '';
    const isSummaryRequest = this.isSummaryRequest(lastUserMessage);
    
    if (isSummaryRequest && session.lastCreatedOutline) {
      await this.handleSummaryRequest(session);
      return;
    }
    
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
  }

  private isSummaryRequest(text: string): boolean {
    const summaryKeywords = [
      'summary', 'walkthrough', 'overview', 'yes', 'sure', 'please',
      'tell me about', 'describe', 'explain', 'give me', 'show me'
    ];
    
    const lowerText = text.toLowerCase();
    return summaryKeywords.some(keyword => lowerText.includes(keyword));
  }

  private async handleSummaryRequest(session: VoiceChatSession) {
    const outline = session.lastCreatedOutline;
    if (!outline) return;

    // Create a concise summary
    const summaryText = this.createOutlineSummary(outline);
    
    // Add AI response to conversation history
    session.conversationHistory.push({
      role: 'assistant',
      content: summaryText
    });

    console.log('Generating speech for summary...');
    // Generate speech from summary
    const speechResponse = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: summaryText,
      response_format: "wav"
    });

    const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
    const audioBase64 = audioBuffer.toString('base64');

    // Send summary response
    this.sendMessage(session.ws, {
      type: 'response',
      text: summaryText,
      audio: audioBase64
    });
    
    console.log('Summary sent to client');
  }

  private createOutlineSummary(outline: any): string {
    const moduleCount = outline.modules?.length || 0;
    const totalLessons = outline.modules?.reduce((total: number, module: any) => 
      total + (module.lessons?.length || 0), 0) || 0;

    let summary = `Here's a quick overview of your "${outline.title}" course:

This ${outline.totalDuration} course is designed for ${outline.targetAudience.toLowerCase()}. `;

    if (moduleCount > 0) {
      summary += `It contains ${moduleCount} main modules with ${totalLessons} lessons total. `;
      
      // Highlight key modules
      const keyModules = outline.modules.slice(0, 3).map((module: any, index: number) => 
        `Module ${index + 1}: ${module.title}`).join(', ');
      
      summary += `The main modules cover: ${keyModules}`;
      
      if (moduleCount > 3) {
        summary += ` and ${moduleCount - 3} additional modules`;
      }
      summary += '. ';
    }

    summary += `The full detailed outline is available for you to review and edit. Would you like me to help you modify any specific sections or create additional content?`;

    return summary;
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