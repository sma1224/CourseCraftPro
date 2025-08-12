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
- STRICTLY ADHERE to the specified word count and detail level requirements
- MANDATORY: Include ALL content types specifically requested by the user's checklist selections
- Include real-world examples embedded within the explanations
- Use textbook-style writing with clear topic sentences and detailed elaboration
- Avoid lists, bullet points, or slide-style formatting
- Write as if creating content for a published educational textbook

Content Structure Requirements:
- Each lesson must meet the EXACT word count specified by the user
- Include concrete examples woven into the narrative
- Provide theoretical foundations AND practical applications as specified
- Use academic but accessible language
- Include transitional sentences between concepts
- Build concepts progressively with thorough explanations
- MANDATORY: Generate exercises, case studies, and assessments if specifically requested by user
- Tailor content complexity to the specified detail level (brief, quick, detailed, comprehensive)

USER REQUIREMENTS ENFORCEMENT:
- Pay close attention to the SELECTED CONTENT REQUIREMENTS section - these are user-specified
- Include ONLY the types of content the user has explicitly selected (checked items)
- If user selected "Interactive Exercises", generate detailed hands-on activities
- If user selected "Case Studies", include real-world examples with full analysis
- If user selected "Assessments", create comprehensive evaluation methods
- If user selected specific detail level, adjust word count and complexity accordingly
- Respect the exact target word count specified by the user

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

**SELECTED CONTENT REQUIREMENTS (MUST INCLUDE ALL CHECKED ITEMS):**
${request.selectedRequirements && request.selectedRequirements.length > 0 ? 
  request.selectedRequirements.map((r: any) => `✓ ${r.title}: ${r.description} (Priority: ${r.priority.toUpperCase()})`).join('\n') : 
  'No specific requirements selected - use standard comprehensive approach'}

**MANDATORY REQUIREMENTS PROCESSING:**
${request.includeExercises ? '- MUST include hands-on exercises with step-by-step instructions' : ''}
${request.includeCaseStudies ? '- MUST include real-world case studies with detailed analysis' : ''}
${request.includeAssessments ? '- MUST include comprehensive assessments and quizzes' : ''}

**CRITICAL GENERATION PARAMETERS:**

TARGET WORD COUNT: ${request.targetWordCount || 1000} words MINIMUM (strictly enforce this count)
CONTENT DETAIL LEVEL: ${request.contentType || 'detailed'} (adjust complexity accordingly)

**FORMATTING REQUIREMENTS:**
- Use proper markdown formatting with clear headers and subheaders
- Include line breaks between sections and paragraphs
- Use ## for main sections, ### for subsections
- Add blank lines between paragraphs for readability
- Format as professional courseware reading material

**CONTENT LENGTH & DETAIL REQUIREMENTS:**
${request.contentType === 'brief' ? `
- TARGET: 300-500 words of concise but complete explanations
- Focus on essential concepts and key takeaways
- Include 1-2 practical examples per lesson
- Provide clear, direct explanations without extensive elaboration` : ''}
${request.contentType === 'quick' ? `
- TARGET: 500-800 words with clear explanations and essential details
- Include 2-3 practical examples per lesson
- Provide good balance of theory and application
- Add practical exercises if selected in requirements` : ''}
${request.contentType === 'detailed' ? `
- TARGET: 800-1200 words with comprehensive coverage, examples, and detailed explanations
- Include 3-4 practical examples per lesson
- Provide thorough theoretical foundations with extensive practical applications
- Include detailed case studies and exercises based on selected requirements` : ''}
${request.contentType === 'comprehensive' ? `
- TARGET: 1200+ words with in-depth analysis, multiple examples, case studies, and thorough coverage
- Include 4+ practical examples per lesson
- Provide extensive theoretical foundations with comprehensive practical applications
- Include detailed case studies, exercises, and assessments based on all selected requirements
- Add industry insights and advanced considerations` : ''}

**SPECIFIC CONTENT INCLUSION INSTRUCTIONS:**
- If "Theoretical Foundations" is selected: Include academic theory, research findings, and conceptual frameworks
- If "Practical Examples" is selected: Include real-world scenarios, company case studies, and actionable implementations
- If "Interactive Exercises" is selected: Create step-by-step hands-on activities with clear instructions
- If "Case Studies" is selected: Develop detailed real-world examples with analysis and outcomes
- If "Assessments & Quizzes" is selected: Include comprehensive evaluation methods with questions and answers
- If "Industry Applications" is selected: Focus on specific industry use cases and professional contexts

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

**FINAL GENERATION INSTRUCTIONS:**
1. Generate content that EXACTLY matches the target word count of ${request.targetWordCount || 1000} words
2. Include ONLY the content types selected in the requirements checklist above
3. Adjust detail level and complexity to match "${request.contentType || 'detailed'}" specification
4. If no specific requirements were selected, use standard comprehensive approach with theory, examples, and practical applications
5. Structure the response as a complete JSON object with all required fields populated

Transform this module outline into publication-ready educational courseware following ALL above specifications.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 12000,
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