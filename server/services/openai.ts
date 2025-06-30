import OpenAI from "openai";
import type { CourseGenerationRequest } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface CourseOutlineModule {
  title: string;
  duration: string;
  description: string;
  learningObjectives: string[];
  lessons: {
    title: string;
    duration: string;
    description: string;
    activities: string[];
    format: string[];
  }[];
  activities: {
    type: string;
    title: string;
    description: string;
  }[];
  resources: {
    type: string;
    title: string;
    description?: string;
  }[];
}

export interface GeneratedCourseOutline {
  title: string;
  description: string;
  targetAudience: string;
  totalDuration: string;
  courseType: string;
  learningObjectives: string[];
  modules: CourseOutlineModule[];
  assessments: {
    type: string;
    title: string;
    description: string;
  }[];
  resources: {
    type: string;
    title: string;
    description?: string;
  }[];
}

export async function generateCourseOutline(request: CourseGenerationRequest): Promise<GeneratedCourseOutline> {
  try {
    const systemPrompt = `You are an expert instructional designer and course creator. Your task is to create comprehensive, professional course outlines that follow pedagogical best practices.

You will receive a course description and create a detailed, structured course outline. The outline should be practical, engaging, and suitable for the target audience.

Please respond with a JSON object following this exact structure:
{
  "title": "Course Title",
  "description": "Comprehensive course description",
  "targetAudience": "Who this course is for",
  "totalDuration": "Total course duration",
  "courseType": "Format type (workshop, online course, etc.)",
  "learningObjectives": ["Objective 1", "Objective 2", ...],
  "modules": [
    {
      "title": "Module Title",
      "duration": "Module duration",
      "description": "Module description",
      "learningObjectives": ["Module objective 1", ...],
      "lessons": [
        {
          "title": "Lesson Title",
          "duration": "Lesson duration",
          "description": "Lesson description",
          "activities": ["Activity 1", "Activity 2"],
          "format": ["Video", "Interactive", "Q&A"]
        }
      ],
      "activities": [
        {
          "type": "Exercise/Quiz/Discussion",
          "title": "Activity Title",
          "description": "Activity description"
        }
      ],
      "resources": [
        {
          "type": "PDF/Link/Tool",
          "title": "Resource Title",
          "description": "Resource description"
        }
      ]
    }
  ],
  "assessments": [
    {
      "type": "Quiz/Assignment/Project",
      "title": "Assessment Title",
      "description": "Assessment description"
    }
  ],
  "resources": [
    {
      "type": "PDF/Link/Tool",
      "title": "Resource Title",
      "description": "Resource description"
    }
  ]
}

Focus on creating practical, actionable content with clear learning outcomes.`;

    const userPrompt = `Create a comprehensive course outline based on this description:

${request.description}

${request.title ? `Preferred title: ${request.title}` : ''}
${request.targetAudience ? `Target audience: ${request.targetAudience}` : ''}
${request.duration ? `Preferred duration: ${request.duration}` : ''}
${request.courseType ? `Course type: ${request.courseType}` : ''}

Please create a detailed, professional course outline with multiple modules, clear learning objectives, practical activities, and comprehensive resources.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    if (!result.title || !result.modules) {
      throw new Error("Invalid response format from OpenAI");
    }

    return result as GeneratedCourseOutline;
  } catch (error) {
    console.error("Error generating course outline:", error);
    throw new Error(`Failed to generate course outline: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function enhanceOutlineSection(
  sectionContent: string,
  context: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert instructional designer. Enhance and expand the given course section with more detail, practical examples, and engaging activities while maintaining the original structure and intent."
        },
        {
          role: "user",
          content: `Context: ${context}\n\nSection to enhance:\n${sectionContent}\n\nPlease provide an enhanced version with more detail, practical examples, and specific activities.`
        }
      ],
      temperature: 0.6,
      max_tokens: 1500,
    });

    return response.choices[0].message.content || sectionContent;
  } catch (error) {
    console.error("Error enhancing outline section:", error);
    throw new Error(`Failed to enhance section: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    // Create a temporary file-like object for the audio buffer
    const audioFile = new File([audioBuffer], "audio.webm", { type: "audio/webm" });
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    return transcription.text;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
