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
    console.log("=== OpenAI Service: Starting course outline generation ===");
    console.log("Request details:", JSON.stringify(request, null, 2));
    
    // Verify API key exists
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not found in environment variables");
    }
    
    const systemPrompt = `You are an expert instructional designer with deep subject matter expertise across all fields. Your task is to create comprehensive, professional course outlines that demonstrate deep knowledge of the specific subject matter.

CRITICAL REQUIREMENTS:
1. You must demonstrate deep subject matter expertise by including specific concepts, terminology, tools, and industry practices
2. Every lesson must contain concrete, actionable content with real-world applications
3. Include specific examples, case studies, and practical exercises relevant to the subject
4. Reference actual tools, technologies, methodologies, and industry standards
5. Provide detailed learning objectives that go beyond generic statements
6. Include subject-specific resources, readings, and materials

You will receive a course description and create a detailed, structured course outline that shows you understand the subject deeply. Do not create generic templates - create subject-specific, expert-level content.

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
          "title": "Lesson Title (specific to subject matter)",
          "duration": "Lesson duration",
          "description": "Detailed lesson description with specific concepts, tools, and techniques to be covered",
          "activities": ["Subject-specific activity 1", "Hands-on exercise with real tools"],
          "format": ["Video", "Interactive", "Q&A", "Workshop", "Practical"]
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

IMPORTANT: This must be a subject-specific course outline that demonstrates deep expertise in the field. Include:
- Specific technical concepts, terminology, and methodologies
- Real-world tools, software, frameworks, and industry standards
- Concrete examples and case studies from the actual field
- Practical exercises using authentic industry practices
- Current trends, best practices, and emerging developments
- Subject-specific resources, readings, and references

Do not create a generic template. Create expert-level content that shows deep understanding of the subject matter.`;

    console.log("=== OpenAI Service: Sending request to OpenAI ===");
    console.log("System prompt length:", systemPrompt.length);
    console.log("User prompt:", userPrompt);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 6000,
    });

    console.log("=== OpenAI Service: Received response ===");
    console.log("Response status:", response.choices[0].finish_reason);
    console.log("Response content length:", response.choices[0].message.content?.length || 0);
    console.log("Raw response content:", response.choices[0].message.content?.substring(0, 500) + "...");

    const result = JSON.parse(response.choices[0].message.content || '{}');
    console.log("=== OpenAI Service: Parsed result ===");
    console.log("Result title:", result.title);
    console.log("Result modules count:", result.modules?.length || 0);
    console.log("Result structure:", Object.keys(result));
    
    if (!result.title || !result.modules) {
      console.error("=== OpenAI Service: Invalid response format ===");
      console.error("Missing title:", !result.title);
      console.error("Missing modules:", !result.modules);
      console.error("Full result:", JSON.stringify(result, null, 2));
      throw new Error("Invalid response format from OpenAI");
    }

    console.log("=== OpenAI Service: Successfully generated course outline ===");
    console.log("Final outline preview:", {
      title: result.title,
      moduleCount: result.modules?.length,
      hasContent: !!result.description
    });
    return result as GeneratedCourseOutline;
  } catch (error) {
    console.error("=== OpenAI Service: Error generating course outline ===");
    console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error("Error stack:", error.stack);
    }
    throw new Error(`Failed to generate course outline: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function enhanceOutlineSection(
  outline: GeneratedCourseOutline,
  prompt: string,
  section: string = "module",
  moduleIndex: number = 0
): Promise<GeneratedCourseOutline> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert instructional designer. Based on the user's prompt, enhance the course outline by:
          - Adding new modules, lessons, or subsections as requested
          - Modifying existing content to match the user's vision
          - Removing content if requested
          - Improving quality and engagement
          
          Always respond with a complete JSON outline in the same format as the input, maintaining all required fields.`
        },
        {
          role: "user",
          content: `Current course outline:
${JSON.stringify(outline, null, 2)}

User request: ${prompt}

Please provide the enhanced course outline as a complete JSON object with the same structure.`
        }
      ],
      temperature: 0.6,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });

    const enhancedOutline = JSON.parse(response.choices[0].message.content || "{}");
    
    // Validate that the enhanced outline has the required structure
    if (!enhancedOutline.title || !enhancedOutline.modules || !Array.isArray(enhancedOutline.modules)) {
      throw new Error("Invalid enhanced outline structure");
    }

    return enhancedOutline as GeneratedCourseOutline;
  } catch (error) {
    console.error("Error enhancing outline section:", error);
    throw new Error(`Failed to enhance outline: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
