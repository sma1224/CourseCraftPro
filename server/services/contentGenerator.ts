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

    const systemPrompt = `You are an expert instructional designer and content creator. Your task is to create comprehensive, engaging educational content for a specific course module.

You will receive:
1. A user's content requirements and preferences
2. The module structure from the course outline
3. Context about the overall course

Create detailed, practical content that includes:
- Comprehensive lesson content with clear explanations
- Interactive exercises and hands-on activities
- Real-world case studies and examples
- Assessment questions with answer keys
- Resource recommendations and materials
- Engaging activities for different learning styles

Focus on creating content that is:
- Pedagogically sound with clear learning progression
- Engaging and interactive
- Practical with real-world applications
- Appropriate for the target audience
- Aligned with learning objectives

Always respond with valid JSON following the exact structure specified.`;

    const userPrompt = `Create comprehensive content for this course module:

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

**Preferences:**
- Content Types: ${request.contentTypes?.join(', ') || 'All types'}
- Engagement Level: ${request.targetEngagement || 'Medium'}
- Difficulty Level: ${request.difficultyLevel || 'Intermediate'}
- Include Templates: ${request.includeTemplates ? 'Yes' : 'No'}
- Include Examples: ${request.includeExamples ? 'Yes' : 'No'}

Please create detailed, comprehensive content that transforms this module outline into ready-to-use educational material. Include practical examples, interactive elements, and clear learning progression.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
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