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
    
    const systemPrompt = `You are a world-class subject matter expert and instructional designer with deep, specialized knowledge across all technical and professional fields. Your task is to create exceptionally detailed, professional course outlines that demonstrate expert-level understanding of the specific domain.

MANDATORY COURSE STRUCTURE REQUIREMENTS - FAILURE TO MEET THESE WILL RESULT IN REJECTION:

0. COMPREHENSIVE COURSE LENGTH:
   - Generate courses with MINIMUM 5-6 modules (prefer 6-8 modules for comprehensive coverage)
   - Each module should contain 3-5 lessons minimum
   - Total course duration should be 20-40 hours for professional depth
   - Avoid short 2-3 module courses as they are insufficient for professional training
   - Create substantial, university-level or professional certification equivalent content

1. DEEP SUBJECT MATTER EXPERTISE:
   - Include specific technical concepts, terminology, and methodologies used by professionals in the field
   - Reference actual tools, software, frameworks, platforms, and technologies by name
   - Mention specific industry standards, certifications, compliance requirements, and best practices
   - Include current trends, emerging technologies, and future developments in the field

2. CONCRETE REAL-WORLD CONTENT:
   - Provide specific examples from actual companies, case studies, and industry scenarios
   - Include hands-on exercises using real tools and professional workflows
   - Reference actual documentation, APIs, libraries, and resources professionals use
   - Mention specific job roles, responsibilities, and career paths in the field

3. PROFESSIONAL DEPTH AND DETAIL:
   - Every lesson must contain detailed, actionable content that goes beyond basic concepts
   - Include practical exercises that mirror real professional tasks
   - Provide specific learning outcomes that align with industry requirements
   - Reference actual certifications, qualifications, and professional development paths

4. INDUSTRY-SPECIFIC CONTEXT:
   - Include regulatory requirements, compliance standards, and legal considerations
   - Reference specific use cases across different industries and sectors
   - Mention integration patterns, enterprise considerations, and scalability concerns
   - Include cost considerations, ROI calculations, and business impact metrics

QUALITY BENCHMARK: Your course outline should be detailed enough that a professional in the field would immediately recognize the authentic, expert-level content and find it valuable for their career development.

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
          "title": "Lesson Title (must include specific technologies/methodologies)",
          "duration": "Lesson duration",
          "description": "Comprehensive lesson description including: specific tools/technologies to be used, step-by-step implementation details, real-world examples from companies, industry standards covered, and practical outcomes",
          "activities": ["Hands-on exercise with specific named tools", "Real-world case study analysis", "Professional workflow simulation"],
          "format": ["Video", "Interactive", "Q&A", "Workshop", "Practical", "Case Study"]
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

    const userPrompt = `Create a comprehensive, expert-level course outline based on this description:

${request.description}

${request.title ? `Preferred title: ${request.title}` : ''}
${request.targetAudience ? `Target audience: ${request.targetAudience}` : ''}
${request.duration ? `Preferred duration: ${request.duration}` : 'Duration: 20-40 hours (comprehensive professional training)'}
${request.courseType ? `Course type: ${request.courseType}` : 'Course type: Professional certification-level training'}

MANDATORY STRUCTURE: Create a course with MINIMUM 5-6 modules (preferably 6-8 modules) to ensure comprehensive coverage. Each module should have 3-5 detailed lessons. Avoid short 2-3 module courses as they are insufficient for professional development.

CRITICAL INSTRUCTIONS - YOUR RESPONSE MUST INCLUDE:

0. COMPREHENSIVE COURSE STRUCTURE:
   - Create MINIMUM 5-6 modules (aim for 6-8 modules for thorough coverage)
   - Each module must have 3-5 lessons minimum with substantial content
   - Structure the course as a comprehensive professional training program
   - Ensure logical progression from foundational to advanced concepts
   - Include prerequisite knowledge, intermediate concepts, and advanced applications
   - Design for 20-40 total hours of professional-level education

1. SPECIFIC TECHNICAL DETAILS:
   - Name exact tools, software, frameworks, libraries, and platforms used in the field
   - Include specific version numbers, configuration details, and implementation approaches
   - Reference actual APIs, SDKs, documentation, and technical specifications
   - Mention specific programming languages, databases, cloud platforms, and infrastructure components

2. REAL INDUSTRY EXAMPLES:
   - Include specific companies, case studies, and real-world implementations
   - Reference actual products, services, and business scenarios from the industry
   - Mention specific market segments, customer types, and business models
   - Include pricing models, ROI calculations, and business impact metrics

3. PROFESSIONAL DEPTH:
   - Include specific job titles, roles, and career progression paths
   - Reference industry certifications, qualifications, and professional development requirements
   - Mention specific conferences, communities, and professional organizations
   - Include salary ranges, skill requirements, and market demand data

4. REGULATORY AND COMPLIANCE:
   - Include specific regulations, compliance standards, and legal requirements
   - Reference industry bodies, standards organizations, and certification authorities
   - Mention specific audit requirements, security standards, and governance frameworks
   - Include data privacy, security, and ethical considerations

5. HANDS-ON PRACTICAL CONTENT:
   - Include step-by-step implementations using real tools and platforms
   - Reference actual code examples, configuration files, and deployment procedures
   - Mention specific troubleshooting scenarios and performance optimization techniques
   - Include integration patterns, testing strategies, and monitoring approaches

QUALITY REQUIREMENTS:
- Generate MINIMUM 5-6 modules with comprehensive coverage (prefer 6-8 modules)
- Each module must have 3-5 lessons with substantial, detailed content
- Each lesson must contain at least 5 specific, named tools, technologies, or methodologies
- Include at least 3 real-world company examples or case studies per module
- Reference at least 2 industry standards, certifications, or compliance requirements
- Provide specific, actionable learning outcomes that align with professional job requirements
- Total course should be equivalent to a university course or professional certification program
- Ensure 20-40 hours of comprehensive professional training content

Create expert-level content that demonstrates deep, authentic knowledge of the subject matter with comprehensive coverage that justifies the investment in professional development.`;

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
      temperature: 0.9,
      max_tokens: 12000,
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
