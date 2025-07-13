import OpenAI from "openai";
import type { ContentGenerationRequest } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface GeneratedModuleContent {
  title: string;
  overview: string;
  learningObjectives: string[];
  lessons: {
    title: string;
    content: string;
    duration: string;
    activities: string[];
    resources: string[];
  }[];
  exercises: {
    title: string;
    description: string;
    instructions: string[];
    materials: string[];
    expectedOutcome: string;
  }[];
  caseStudies: {
    title: string;
    scenario: string;
    keyLearnings: string[];
    discussionPoints: string[];
  }[];
  assessments: {
    type: string;
    title: string;
    questions: {
      question: string;
      options?: string[];
      correctAnswer?: string;
      explanation?: string;
    }[];
  }[];
  resources: {
    type: string;
    title: string;
    description: string;
    url?: string;
  }[];
  activities: {
    type: string;
    title: string;
    description: string;
    timeRequired: string;
    materials: string[];
  }[];
}

export async function generateModuleContent(
  request: ContentGenerationRequest | any
): Promise<GeneratedModuleContent> {
  try {
    console.log("Starting module content generation:", {
      moduleIndex: request.moduleIndex,
      moduleTitle: request.moduleTitle
    });

    const systemPrompt = `You are an expert instructional designer and textbook author. Your task is to create comprehensive, detailed educational content that reads like a professional textbook chapter.

CRITICAL REQUIREMENTS:
- Write in full paragraphs with detailed explanations, NOT bullet points or slide format
- Each lesson should contain 800-1200 words of comprehensive text
- Include real-world examples embedded within the explanations
- Use textbook-style writing with clear topic sentences and detailed elaboration
- Avoid lists, bullet points, or slide-style formatting
- Write as if creating content for a published educational textbook

Content Structure Requirements:
- Each lesson must have substantial explanatory text (minimum 800 words)
- Include concrete examples woven into the narrative
- Provide detailed theoretical foundations with practical applications
- Use academic but accessible language
- Include transitional sentences between concepts
- Build concepts progressively with thorough explanations

RESPONSE FORMAT:
You must respond with a valid JSON object containing these exact fields:
{
  "title": "string",
  "overview": "string",
  "learningObjectives": ["string"],
  "lessons": [
    {
      "title": "string",
      "content": "string",
      "duration": "string",
      "activities": ["string"],
      "resources": ["string"]
    }
  ],
  "exercises": [
    {
      "title": "string",
      "description": "string",
      "instructions": ["string"],
      "materials": ["string"],
      "expectedOutcome": "string"
    }
  ],
  "assessments": [
    {
      "type": "string",
      "title": "string",
      "questions": [
        {
          "question": "string",
          "options": ["string"],
          "correctAnswer": "string",
          "explanation": "string"
        }
      ]
    }
  ]
}

Always respond with valid JSON following this exact structure.`;

    const userPrompt = `Create comprehensive textbook-style content for this course module:

**Module Information:**
- Title: ${request.moduleTitle}
- Description: ${request.moduleDescription}
- Learning Objectives: ${request.learningObjectives?.join(', ') || 'Not specified'}
- Duration: ${request.duration || 'Not specified'}

**Course Context:**
- Course Title: ${request.courseTitle}
- Course Description: ${request.courseDescription}
- Target Audience: ${request.targetAudience || 'general'}
- Content Type: ${request.contentType || 'detailed'}

**Content Requirements:**
${request.selectedRequirements ? request.selectedRequirements.map((r: any) => `- ${r.title}: ${r.description}`).join('\n') : ''}

**CRITICAL INSTRUCTIONS:**

TARGET WORD COUNT: ${request.targetWordCount || 1000} words MINIMUM
CONTENT DETAIL LEVEL: ${request.contentType || 'detailed'}

**FORMATTING REQUIREMENTS:**
- Use proper markdown formatting with clear headers and subheaders
- Include line breaks between sections and paragraphs
- Use ## for main sections, ### for subsections
- Add blank lines between paragraphs for readability
- Format as professional courseware reading material

**CONTENT REQUIREMENTS:**
${request.contentType === 'brief' ? '- Write 300-500 words of concise but complete explanations' : ''}
${request.contentType === 'quick' ? '- Write 500-800 words with clear explanations and essential details' : ''}
${request.contentType === 'detailed' ? '- Write 800-1200 words with comprehensive coverage, examples, and detailed explanations' : ''}
${request.contentType === 'comprehensive' ? '- Write 1200+ words with in-depth analysis, multiple examples, case studies, and thorough coverage' : ''}

**WRITING STYLE:**
- Write in full paragraphs with academic depth suitable for courseware
- Each paragraph should be 80-150 words
- Include real-world examples integrated into the narrative
- Provide thorough theoretical foundations with practical applications
- Use transitional sentences to connect ideas smoothly
- Write as comprehensive educational reading material, not bullet points

**STRUCTURE REQUIREMENTS:**
- Start with a clear introduction paragraph
- Use multiple well-structured sections with descriptive headers
- Include practical examples and case studies
- End with a summary or conclusion section
- Ensure proper spacing and formatting throughout

Transform this module outline into publication-ready educational courseware with the specified word count and detail level.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 8000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    if (!result.title || !result.lessons) {
      throw new Error("Invalid response format from OpenAI");
    }

    console.log("Module content generated successfully:", result.title);
    return result as GeneratedModuleContent;
  } catch (error) {
    console.error("Error generating module content:", error);
    throw new Error(`Failed to generate module content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateFollowUpQuestions(
  userPrompt: string,
  moduleData: any,
  courseContext: any
): Promise<string[]> {
  try {
    const systemPrompt = `You are an AI assistant helping with course content creation. Based on the user's content requirements, generate 3-5 intelligent follow-up questions that will help clarify their needs and create better content.

The questions should be:
- Specific to the module and content type
- Helpful for understanding user preferences
- Focused on practical implementation details
- Relevant to educational best practices

Always respond with a JSON array of strings.`;

    const prompt = `Generate follow-up questions for this content creation request:

**User Request:** ${userPrompt}

**Module:** ${moduleData.title} - ${moduleData.description}
**Course:** ${courseContext.title} for ${courseContext.targetAudience}

Generate 3-5 specific, helpful questions that would clarify the user's needs and improve the content quality.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.questions || [];
  } catch (error) {
    console.error("Error generating follow-up questions:", error);
    return [];
  }
}

export async function enhanceModuleContent(
  existingContent: GeneratedModuleContent,
  enhancementPrompt: string
): Promise<GeneratedModuleContent> {
  try {
    const systemPrompt = `You are an expert instructional designer. You will receive existing module content and an enhancement request. Improve the content based on the specific feedback while maintaining the overall structure and quality.

Focus on:
- Maintaining pedagogical soundness
- Improving engagement and interactivity
- Adding practical examples where requested
- Enhancing clarity and learning progression
- Keeping the same JSON structure

Always respond with the complete enhanced content in the same JSON format.`;

    const prompt = `Enhance this existing module content based on the following feedback:

**Enhancement Request:** ${enhancementPrompt}

**Existing Content:** ${JSON.stringify(existingContent, null, 2)}

Please improve the content while maintaining the same structure and overall quality.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
      max_tokens: 4000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    if (!result.title || !result.lessons) {
      throw new Error("Invalid enhanced content format from OpenAI");
    }

    return result as GeneratedModuleContent;
  } catch (error) {
    console.error("Error enhancing module content:", error);
    throw new Error(`Failed to enhance module content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}