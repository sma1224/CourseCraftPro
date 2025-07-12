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
  request: ContentGenerationRequest,
  moduleData: any,
  courseContext: any
): Promise<GeneratedModuleContent> {
  try {
    console.log("Starting module content generation:", {
      moduleIndex: request.moduleIndex,
      moduleTitle: moduleData.title
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

Always respond with valid JSON following the exact structure specified.`;

    const userPrompt = `Create comprehensive textbook-style content for this course module:

**Module Information:**
- Title: ${moduleData.title}
- Description: ${moduleData.description}
- Learning Objectives: ${moduleData.learningObjectives?.join(', ') || 'Not specified'}
- Duration: ${moduleData.duration || 'Not specified'}

**Course Context:**
- Course Title: ${courseContext.title}
- Target Audience: ${courseContext.targetAudience}
- Course Type: ${courseContext.courseType}
- Overall Objectives: ${courseContext.learningObjectives?.join(', ') || 'Not specified'}

**Content Requirements:**
${request.userPrompt}

**CRITICAL INSTRUCTIONS:**
- Write each lesson as a comprehensive textbook chapter with ${request.wordCount || 1000} words of detailed explanation
- Content Detail Level: ${request.contentDetail || 'detailed'}
- Use full paragraphs, NOT bullet points or lists
- Include real-world examples integrated into the narrative flow
- Provide thorough theoretical foundations with practical applications
- Write in an academic but accessible tone suitable for textbook publication
- Each lesson should read like a complete educational article or textbook section
- Include detailed explanations of concepts, processes, and applications
- Use transitional sentences to connect ideas smoothly
- Provide concrete examples and scenarios embedded within the text

Content Detail Requirements:
${request.contentDetail === 'brief' ? '- Focus on key concepts with concise explanations (300-500 words per lesson)' : ''}
${request.contentDetail === 'quick' ? '- Provide clear explanations with essential details (500-800 words per lesson)' : ''}
${request.contentDetail === 'detailed' ? '- Include comprehensive coverage with examples (800-1200 words per lesson)' : ''}
${request.contentDetail === 'comprehensive' ? '- Provide in-depth analysis with multiple examples and case studies (1200+ words per lesson)' : ''}

Transform this module outline into publication-ready educational content with comprehensive explanations and detailed coverage of all topics.`;

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