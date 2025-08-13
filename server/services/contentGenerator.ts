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

    const systemPrompt = `You are an expert instructional designer and textbook author. You MUST strictly follow user specifications.

CRITICAL MANDATORY REQUIREMENTS - FAILURE TO FOLLOW WILL RESULT IN REJECTION:
1. WORD COUNT ENFORCEMENT: Generate content that matches EXACTLY the target word count specified by the user
2. REQUIREMENTS COMPLIANCE: Include ONLY the content types the user has explicitly selected in their checklist
3. DETAIL LEVEL ADHERENCE: Generate content complexity matching user's selected detail level
4. CONTENT TYPE INCLUSION: If user selected specific requirements, those MUST be included

WORD COUNT RULES (STRICTLY ENFORCE):
- Brief (300-500 words): Write concise, essential content only
- Quick (500-800 words): Write focused content with key examples  
- Detailed (800-1200 words): Write comprehensive content with multiple examples
- Comprehensive (1200+ words): Write extensive content with in-depth analysis
- CUSTOM TARGET: If user specifies exact word count (e.g. 5000 words), generate EXACTLY that amount

CONTENT INCLUSION RULES (MANDATORY):
- If user selects "Theoretical Foundations": MUST include academic theory and research
- If user selects "Practical Examples": MUST include real-world scenarios and implementations
- If user selects "Interactive Exercises": MUST generate step-by-step hands-on activities
- If user selects "Case Studies": MUST include detailed real-world examples with analysis
- If user selects "Assessments": MUST create comprehensive quizzes and evaluation methods
- If user selects "Industry Applications": MUST focus on specific professional use cases

FAILURE TO INCLUDE SELECTED CONTENT TYPES WILL RESULT IN REJECTION.

WORD COUNT ENFORCEMENT STRATEGY:
- Write detailed, comprehensive explanations for each concept
- Include extensive examples and case studies  
- Provide in-depth analysis and commentary
- Add comprehensive background information
- Include detailed step-by-step instructions
- Expand on practical applications with multiple scenarios
- Add extensive context and professional insights

RESPONSE FORMAT:
You must respond with a valid JSON object. The "content" field in each lesson MUST contain the actual detailed educational content with the specified word count. Do not use placeholder text or brief summaries.

CRITICAL: The total word count across ALL lesson "content" fields must equal ${request.targetWordCount || 1000} words.

{
  "title": "string",
  "overview": "string (100-200 words)",
  "learningObjectives": ["string"],
  "lessons": [
    {
      "title": "string",
      "content": "DETAILED EDUCATIONAL CONTENT HERE - This field must contain the actual comprehensive lesson content with the required word count, not a summary or placeholder",
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

    const userPrompt = `MANDATORY GENERATION PARAMETERS - DO NOT DEVIATE:

🎯 TARGET WORD COUNT: ${request.targetWordCount || 1000} words TOTAL (EXACTLY this amount)
📊 DETAIL LEVEL: ${request.contentType || 'detailed'} 
📋 SELECTED REQUIREMENTS: ${request.selectedRequirements && request.selectedRequirements.length > 0 ? 
  request.selectedRequirements.map((r: any) => r.id).join(', ') : 'none'}

**MODULE TO GENERATE:**
- Title: ${request.moduleTitle}
- Description: ${request.moduleDescription}
- Course: ${request.courseTitle}

**USER'S SELECTED CONTENT REQUIREMENTS (MUST INCLUDE ALL):**
${request.selectedRequirements && request.selectedRequirements.length > 0 ? 
  request.selectedRequirements.map((r: any) => `✅ ${r.title}: ${r.description}`).join('\n') : 
  '❌ No requirements selected - generate standard content'}

**GENERATION RULES:**
🔹 Write EXACTLY ${request.targetWordCount || 1000} words of content across all lessons combined
🔹 Include ALL selected requirement types from the checklist above
🔹 Generate ${request.contentType === 'comprehensive' ? '4-6' : request.contentType === 'detailed' ? '3-4' : '2-3'} lessons with substantial content
🔹 Each lesson should be roughly ${Math.floor((request.targetWordCount || 1000) / (request.contentType === 'comprehensive' ? 5 : request.contentType === 'detailed' ? 4 : 3))} words

**CONTENT MUST INCLUDE BASED ON USER SELECTIONS:**
${request.selectedRequirements?.find((r: any) => r.id === 'theoretical') ? '🧠 THEORETICAL FOUNDATIONS: Include academic theory, research findings, and conceptual frameworks' : ''}
${request.selectedRequirements?.find((r: any) => r.id === 'practical') ? '🔧 PRACTICAL EXAMPLES: Include real-world scenarios, company case studies, and actionable implementations' : ''}
${request.selectedRequirements?.find((r: any) => r.id === 'interactive-exercises') ? '🎯 INTERACTIVE EXERCISES: Create step-by-step hands-on activities with clear instructions' : ''}
${request.selectedRequirements?.find((r: any) => r.id === 'case-studies') ? '📋 CASE STUDIES: Develop detailed real-world examples with analysis and outcomes' : ''}
${request.selectedRequirements?.find((r: any) => r.id === 'assessments') ? '📝 ASSESSMENTS: Create comprehensive evaluation methods with questions and answers' : ''}
${request.selectedRequirements?.find((r: any) => r.id === 'industry') ? '🏢 INDUSTRY APPLICATIONS: Focus on specific professional use cases and contexts' : ''}

**MANDATORY CONTENT GENERATION CHECKLIST:**
${request.selectedRequirements && request.selectedRequirements.length > 0 ? 
  request.selectedRequirements.map((r: any) => `✅ Include ${r.title}: ${r.description}`).join('\n') : 
  '❌ Standard approach: Include theory, examples, and applications'}

**VERIFICATION BEFORE RESPONDING:**
1. ✅ Total word count = ${request.targetWordCount || 1000} words exactly
2. ✅ All selected requirements included
3. ✅ Content complexity matches "${request.contentType || 'detailed'}" level
4. ✅ JSON format with all required fields

GENERATE EXACTLY ${request.targetWordCount || 1000} WORDS OF EDUCATIONAL CONTENT NOW.`;

    // Add a third message to reinforce requirements
    const enforcementPrompt = `CRITICAL REMINDER: You must generate EXACTLY ${request.targetWordCount || 1000} words across all lesson content. This is not a suggestion - it's a requirement. The user has specifically requested this word count and selected specific content types. Failure to follow these specifications exactly will result in rejection.

WORD COUNT VERIFICATION: Count your words as you write and ensure the total equals ${request.targetWordCount || 1000} words.
CONTENT TYPE VERIFICATION: Include only the content types the user selected: ${request.selectedRequirements?.map((r: any) => r.title).join(', ') || 'standard content'}.

Generate the requested content now with exactly the specified word count and content types.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
        { role: "assistant", content: "I understand I must generate exactly the specified word count and include only the selected content types. I will verify my word count and content types before responding." },
        { role: "user", content: enforcementPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.9,
      max_tokens: 16000,
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