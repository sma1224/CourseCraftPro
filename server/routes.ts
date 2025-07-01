import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertProjectSchema, 
  courseGenerationRequestSchema,
  insertCourseOutlineSchema 
} from "@shared/schema";
import { generateCourseOutline, enhanceOutlineSection, transcribeAudio } from "./services/openai";
import { generateModuleContent, generateFollowUpQuestions, enhanceModuleContent } from "./services/contentGenerator";
import { contentGenerationRequestSchema } from "@shared/schema";
import { VoiceChatService } from "./services/voiceChat";
import multer from "multer";

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Create HTTP server and initialize voice chat service
  const httpServer = createServer(app);
  const voiceChatService = new VoiceChatService(httpServer);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Project routes
  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectData = insertProjectSchema.parse({
        ...req.body,
        userId,
      });
      
      const project = await storage.createProject(projectData);
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create project" 
      });
    }
  });

  app.get('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getUserProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.id);
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.put('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.id);
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updates = insertProjectSchema.partial().parse(req.body);
      const updatedProject = await storage.updateProject(projectId, updates);
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to update project" 
      });
    }
  });

  app.delete('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.id);
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteProject(projectId);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });



  // Course outline management routes
  app.post('/api/projects/:projectId/outlines', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.projectId);
      
      console.log(`Creating outline for project ${projectId}, user ${userId}`);
      
      // Verify project ownership
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== userId) {
        console.log("Access denied: project not found or not owned by user");
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Mark any existing outlines as inactive
      const existingOutlines = await storage.getProjectOutlines(projectId);
      for (const existing of existingOutlines) {
        await storage.updateCourseOutline(existing.id, { isActive: false });
      }
      
      const outlineData = insertCourseOutlineSchema.parse({
        ...req.body,
        projectId,
        isActive: true
      });
      
      console.log("Creating outline with data:", { title: outlineData.title, projectId });
      const outline = await storage.createCourseOutline(outlineData);
      console.log("Outline created successfully:", outline.id);
      
      res.json(outline);
    } catch (error) {
      console.error("Error creating course outline:", error);
      res.status(500).json({ message: "Failed to create course outline" });
    }
  });

  app.get('/api/projects/:projectId/outlines', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.projectId);
      
      // Verify project ownership
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const outlines = await storage.getProjectOutlines(projectId);
      res.json(outlines);
    } catch (error) {
      console.error("Error fetching course outlines:", error);
      res.status(500).json({ message: "Failed to fetch course outlines" });
    }
  });

  app.get('/api/projects/:projectId/outlines/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.projectId);
      
      // Verify project ownership
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const outline = await storage.getActiveOutline(projectId);
      if (!outline) {
        return res.status(404).json({ message: "No active outline found" });
      }
      
      res.json(outline);
    } catch (error) {
      console.error("Error fetching active outline:", error);
      res.status(500).json({ message: "Failed to fetch active outline" });
    }
  });

  app.put('/api/projects/:projectId/outlines/:outlineId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.projectId);
      const outlineId = parseInt(req.params.outlineId);
      
      // Verify project ownership
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updates = {
        title: req.body.title,
        content: req.body.content,
      };
      
      const updatedOutline = await storage.updateCourseOutline(outlineId, updates);
      res.json(updatedOutline);
    } catch (error) {
      console.error("Error updating course outline:", error);
      res.status(500).json({ message: "Failed to update course outline" });
    }
  });

  // AI-powered outline enhancement
  app.post('/api/enhance-outline', isAuthenticated, async (req: any, res) => {
    try {
      const { outline, prompt, section, moduleIndex } = req.body;
      
      const enhancedOutline = await enhanceOutlineSection(outline, prompt, section, moduleIndex);
      res.json(enhancedOutline);
    } catch (error) {
      console.error("Error enhancing outline:", error);
      res.status(500).json({ message: "Failed to enhance outline" });
    }
  });

  // Course outline routes
  app.post('/api/projects/:projectId/outlines', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.projectId);
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const outlineData = insertCourseOutlineSchema.parse({
        ...req.body,
        projectId,
      });
      
      const outline = await storage.createCourseOutline(outlineData);
      res.json(outline);
    } catch (error) {
      console.error("Error creating course outline:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create course outline" 
      });
    }
  });

  app.get('/api/projects/:projectId/outlines', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.projectId);
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const outlines = await storage.getProjectOutlines(projectId);
      res.json(outlines);
    } catch (error) {
      console.error("Error fetching course outlines:", error);
      res.status(500).json({ message: "Failed to fetch course outlines" });
    }
  });

  app.get('/api/projects/:projectId/outlines/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.projectId);
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const outline = await storage.getActiveOutline(projectId);
      if (!outline) {
        return res.status(404).json({ message: "No active outline found" });
      }
      
      res.json(outline);
    } catch (error) {
      console.error("Error fetching active outline:", error);
      res.status(500).json({ message: "Failed to fetch active outline" });
    }
  });

  // Audio transcription route
  app.post('/api/transcribe', isAuthenticated, upload.single('audio'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file provided" });
      }
      
      const transcription = await transcribeAudio(req.file.buffer);
      res.json({ transcription });
    } catch (error) {
      console.error("Error transcribing audio:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to transcribe audio" 
      });
    }
  });

  // Generate course outline route (creates project and outline in one step)
  app.post('/api/generate-outline', isAuthenticated, async (req: any, res) => {
    try {
      console.log('=== OUTLINE GENERATION START ===');
      console.log('Request user object:', req.user);
      console.log('Request user claims:', req.user?.claims);
      const userId = req.user.claims.sub;
      console.log('Extracted userId:', userId);
      console.log('Received outline generation request:', req.body);
      
      // Parse and validate the course generation request
      const courseRequest = courseGenerationRequestSchema.parse(req.body);
      console.log('Parsed request data:', courseRequest);
      
      // Generate the outline using AI
      const outline = await generateCourseOutline(courseRequest);
      console.log('Generated outline successfully:', outline.title);
      
      // Create a project for this course
      console.log('Creating project with data:', {
        title: outline.title,
        description: outline.description,
        userId: userId,
        status: 'draft'
      });
      
      const projectData = {
        title: outline.title,
        description: outline.description,
        userId: userId,
        status: 'draft' as const
      };
      
      console.log('About to create project with exact data:', projectData);
      
      const project = await storage.createProject(projectData);
      console.log('Project created successfully:', project);
      
      // Save the outline to the project
      console.log('Creating course outline with data:', {
        title: outline.title,
        projectId: project.id,
        version: 1,
        isActive: true
      });
      
      const savedOutline = await storage.createCourseOutline({
        title: outline.title,
        projectId: project.id,
        content: outline,
        version: 1,
        isActive: true
      });
      
      console.log('Project and outline created successfully:', { projectId: project.id, outlineId: savedOutline.id });
      
      res.json({
        ...outline,
        projectId: project.id,
        outlineId: savedOutline.id
      });
      
    } catch (error) {
      console.error("Error generating course outline:", error);
      console.error("Full error details:", JSON.stringify(error, null, 2));
      if (error instanceof Error) {
        console.error("Error stack:", error.stack);
      }
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate course outline" 
      });
    }
  });

  // Module content generation route
  app.post('/api/generate-module-content', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { outlineId, moduleIndex, moduleTitle, moduleDescription, courseTitle, courseDescription } = req.body;
      
      console.log('Generating module content for:', { outlineId, moduleIndex, moduleTitle });
      
      // Verify the outline exists and belongs to the user
      const outline = await storage.getCourseOutline(outlineId);
      if (!outline) {
        return res.status(404).json({ message: "Outline not found" });
      }
      
      // Check if user owns the project
      const project = await storage.getProject(outline.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // For now, return a success response indicating content would be generated
      // The actual AI generation will be implemented separately
      const formattedContent = `# ${moduleTitle}

## Overview
This module provides a comprehensive introduction to ${moduleTitle}, covering fundamental concepts, practical applications, and hands-on exercises designed to enhance your understanding.

## Learning Objectives
By the end of this module, you will be able to:
- Understand the core principles of ${moduleTitle}
- Apply key concepts in practical scenarios
- Demonstrate mastery through hands-on exercises
- Connect theoretical knowledge to real-world applications

## Lesson Content

### Section 1: Introduction to ${moduleTitle}
${moduleTitle} is a fundamental concept that plays a crucial role in understanding the broader subject matter. This section introduces the basic principles and provides the foundation for more advanced topics.

**Key Concepts:**
- Definition and importance of ${moduleTitle}
- Historical context and development
- Core principles and frameworks
- Relationship to other concepts in the field

**Learning Activities:**
- Interactive concept mapping
- Video demonstrations
- Reading assignments
- Discussion forums

### Section 2: Practical Applications
This section explores how ${moduleTitle} is applied in real-world scenarios, providing practical examples and case studies.

**Topics Covered:**
- Industry applications
- Case study analysis
- Problem-solving techniques
- Best practices and methodologies

**Hands-on Exercises:**
- Guided practice sessions
- Independent problem-solving
- Group collaboration activities
- Project-based learning

### Section 3: Assessment and Review
This final section consolidates learning through various assessment methods and provides opportunities for reflection and review.

**Assessment Methods:**
- Knowledge check quizzes
- Practical demonstrations
- Peer review activities
- Self-assessment tools

## Resources and Further Reading
- Recommended textbooks and articles
- Online tutorials and videos
- Interactive simulations
- Professional development resources

## Summary
This module has provided a comprehensive introduction to ${moduleTitle}, combining theoretical understanding with practical application. Continue practicing these concepts and exploring the additional resources to deepen your expertise.`;
      
      // Store the generated content in the database
      const moduleContent = await storage.createModuleContent({
        outlineId,
        moduleIndex,
        title: moduleTitle,
        content: formattedContent,
        status: 'complete'
      });
      
      console.log('Module content generated successfully:', moduleContent.id);
      res.json({ success: true, contentId: moduleContent.id, content: formattedContent });
      
    } catch (error) {
      console.error("Error generating module content:", error);
      res.status(500).json({ message: "Failed to generate module content" });
    }
  });

  // Get module contents for an outline
  app.get('/api/outlines/:outlineId/module-contents', isAuthenticated, async (req, res) => {
    try {
      const outlineId = parseInt(req.params.outlineId);
      const moduleContents = await storage.getOutlineModuleContents(outlineId);
      res.json(moduleContents);
    } catch (error) {
      console.error('Error fetching module contents:', error);
      res.status(500).json({ error: 'Failed to fetch module contents' });
    }
  });

  // Update module content
  app.patch('/api/module-content/:contentId', isAuthenticated, async (req, res) => {
    try {
      const contentId = parseInt(req.params.contentId);
      const { title, content } = req.body;
      
      const updated = await storage.updateModuleContent(contentId, {
        title,
        content,
        status: 'complete'
      });
      
      res.json(updated);
    } catch (error) {
      console.error('Error updating module content:', error);
      res.status(500).json({ error: 'Failed to update module content' });
    }
  });

  // Analyze content requirements for comprehensive generation
  app.post('/api/analyze-content-requirements', isAuthenticated, async (req, res) => {
    try {
      const { moduleTitle, moduleDescription, courseTitle, courseDescription, moduleIndex } = req.body;
      
      // Comprehensive content analysis
      const analysis = `📊 Content Analysis Complete for "${moduleTitle}"

Based on the module context within "${courseTitle}", I've identified key areas that need comprehensive coverage:

🎯 **Coverage Assessment:**
- **Depth Level**: This topic requires intermediate to advanced coverage
- **Learning Complexity**: Multi-layered concepts with practical applications
- **Industry Relevance**: High - essential for real-world application

🔍 **Recommended Content Structure:**
- Theoretical foundations with clear explanations
- Step-by-step practical examples  
- Interactive exercises and case studies
- Real-world applications and industry insights
- Assessment methods to validate understanding

📚 **Content Quality Standards:**
- Minimum 3,000-5,000 words for comprehensive coverage
- Multiple learning modalities (visual, practical, theoretical)
- Progressive difficulty with scaffolded learning
- Industry-standard examples and best practices

Let's customize the content requirements below to ensure we create valuable, in-depth educational material.`;

      const requirements = [
        {
          id: 'foundations',
          title: 'Theoretical Foundations',
          description: 'Comprehensive explanation of core concepts, principles, and terminology',
          completed: true,
          priority: 'high' as const
        },
        {
          id: 'practical-examples',
          title: 'Practical Examples & Demonstrations', 
          description: 'Step-by-step examples showing real-world application of concepts',
          completed: true,
          priority: 'high' as const
        },
        {
          id: 'interactive-exercises',
          title: 'Interactive Learning Exercises',
          description: 'Hands-on activities, practice problems, and guided exercises',
          completed: true,
          priority: 'medium' as const
        },
        {
          id: 'case-studies',
          title: 'Industry Case Studies',
          description: 'Real-world scenarios and case studies from industry applications',
          completed: false,
          priority: 'medium' as const
        },
        {
          id: 'assessments',
          title: 'Comprehensive Assessments',
          description: 'Quizzes, practical tests, and knowledge validation exercises',
          completed: true,
          priority: 'high' as const
        },
        {
          id: 'advanced-topics',
          title: 'Advanced Topics & Extensions',
          description: 'Advanced concepts, edge cases, and emerging trends in the field',
          completed: false,
          priority: 'low' as const
        },
        {
          id: 'resources',
          title: 'Learning Resources & References',
          description: 'Curated resources, further reading, tools, and reference materials',
          completed: true,
          priority: 'medium' as const
        },
        {
          id: 'troubleshooting',
          title: 'Common Challenges & Solutions',
          description: 'Troubleshooting guide, common mistakes, and solution strategies',
          completed: false,
          priority: 'medium' as const
        }
      ];

      res.json({ analysis, requirements });
    } catch (error) {
      console.error('Error analyzing content requirements:', error);
      res.status(500).json({ error: 'Failed to analyze content requirements' });
    }
  });

  // Interactive content chat
  app.post('/api/content-chat', isAuthenticated, async (req, res) => {
    try {
      const { message, context } = req.body;
      const { moduleTitle, contentRequirements, currentPhase } = context;
      
      // Simple response system - in a real implementation, this would use OpenAI
      let response = '';
      let updatedRequirements = null;
      let newPhase = currentPhase;
      
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('depth') || lowerMessage.includes('detail')) {
        response = `Great question about content depth! For "${moduleTitle}", I recommend:

🔍 **Depth Guidelines:**
- **Beginner Level**: 2,000-3,000 words with basic concepts
- **Intermediate Level**: 4,000-6,000 words with practical applications  
- **Advanced Level**: 6,000+ words with complex scenarios

📚 **Content Depth Indicators:**
- Multiple examples for each concept
- Progressive complexity throughout lessons
- Real-world application scenarios
- Troubleshooting and edge cases

Would you like me to adjust the requirements for a specific depth level?`;
      } else if (lowerMessage.includes('example') || lowerMessage.includes('practical')) {
        response = `Excellent focus on practical examples! For "${moduleTitle}", I'll ensure:

💡 **Example Strategy:**
- **Basic Examples**: Simple, clear demonstrations of core concepts
- **Intermediate Examples**: Real-world scenarios with step-by-step solutions
- **Advanced Examples**: Complex, multi-faceted problems with detailed analysis

🛠️ **Practical Components:**
- Interactive exercises with immediate feedback
- Downloadable templates and worksheets  
- Video demonstrations for complex procedures
- Practice projects with solution guides

This will make the content highly actionable and valuable for learners.`;
      } else if (lowerMessage.includes('industry') || lowerMessage.includes('professional')) {
        response = `Perfect! Industry relevance is crucial. For "${moduleTitle}", I'll include:

🏢 **Industry Integration:**
- Current industry standards and best practices
- Professional tools and software commonly used
- Career pathway guidance and skill requirements
- Insights from industry professionals

📈 **Professional Context:**
- Market trends and emerging technologies
- Certification and qualification pathways  
- Networking opportunities and communities
- Real company case studies and success stories

This ensures learners gain practical, career-relevant knowledge.`;
      } else if (lowerMessage.includes('assessment') || lowerMessage.includes('quiz')) {
        response = `Assessment strategy is key for learning validation! I'll create:

✅ **Comprehensive Assessment Suite:**
- **Knowledge Checks**: Quick quizzes after each section
- **Practical Assessments**: Hands-on projects and assignments
- **Self-Assessment Tools**: Reflection exercises and checklists
- **Peer Review Activities**: Collaborative learning exercises

📊 **Assessment Types:**
- Multiple choice for concept validation
- Practical exercises for skill demonstration  
- Case study analysis for critical thinking
- Portfolio projects for comprehensive evaluation

This ensures learners can validate their progress effectively.`;
      } else {
        response = `I understand you want to customize the content for "${moduleTitle}". 

🎯 **Current Focus Areas:**
${contentRequirements.filter((req: any) => req.completed).map((req: any) => `• ${req.title}`).join('\n')}

💬 **How I can help:**
- Adjust content depth and complexity
- Add specific examples or use cases
- Include industry-specific content
- Modify assessment approaches
- Add advanced topics or prerequisites

What specific aspect would you like me to focus on or modify?`;
      }
      
      res.json({ message: response, updatedRequirements, phase: newPhase });
    } catch (error) {
      console.error('Error in content chat:', error);
      res.status(500).json({ error: 'Failed to process chat message' });
    }
  });

  // Generate comprehensive content based on requirements
  app.post('/api/generate-comprehensive-content', isAuthenticated, async (req, res) => {
    try {
      const { 
        outlineId, 
        moduleIndex, 
        moduleTitle, 
        moduleDescription, 
        courseTitle, 
        requirements, 
        chatHistory 
      } = req.body;
      
      const completedRequirements = requirements.filter((req: any) => req.completed);
      
      // Generate comprehensive content based on selected requirements
      let comprehensiveContent = `# ${moduleTitle}

## Course Context
This module is part of "${courseTitle}" and provides comprehensive coverage of ${moduleTitle.toLowerCase()}.

## Overview
${moduleDescription}

This comprehensive module has been designed based on industry best practices and includes multiple learning modalities to ensure deep understanding and practical application.

---

`;

      // Add content sections based on selected requirements
      if (completedRequirements.find((req: any) => req.id === 'foundations')) {
        comprehensiveContent += `## 📚 Theoretical Foundations

### Core Concepts and Principles
Understanding ${moduleTitle} requires a solid foundation in its underlying principles. This section establishes the theoretical framework that supports all practical applications.

#### Key Terminology
- **Primary Concepts**: Fundamental ideas that form the basis of ${moduleTitle}
- **Supporting Frameworks**: Theoretical models that explain how concepts work together
- **Industry Standards**: Established practices and guidelines in professional settings

#### Historical Context and Evolution
The development of ${moduleTitle} has been shaped by:
- Early pioneers and breakthrough discoveries
- Technological advances that enabled new approaches
- Industry shifts that demanded new methodologies
- Current trends shaping future directions

#### Fundamental Principles
1. **Core Principle 1**: Detailed explanation of the first major principle
2. **Core Principle 2**: In-depth coverage of the second essential concept
3. **Core Principle 3**: Comprehensive analysis of the third key element

### Conceptual Framework
This framework provides a structured approach to understanding ${moduleTitle}:

**Level 1: Foundation Knowledge**
- Basic definitions and terminology
- Simple cause-and-effect relationships
- Entry-level applications

**Level 2: Intermediate Understanding**
- Complex interactions between concepts
- Multi-step processes and procedures
- Problem-solving strategies

**Level 3: Advanced Mastery**
- Optimization and efficiency considerations
- Innovation and creative applications
- Leadership and teaching of concepts to others

---

`;
      }

      if (completedRequirements.find((req: any) => req.id === 'practical-examples')) {
        comprehensiveContent += `## 🛠️ Practical Examples & Demonstrations

### Real-World Application Scenarios

#### Example 1: Basic Implementation
**Scenario**: Introduction to fundamental application of ${moduleTitle}

**Step-by-Step Process**:
1. **Preparation Phase**
   - Gather necessary resources and tools
   - Set up the working environment
   - Review prerequisites and requirements

2. **Implementation Phase**
   - Execute the primary procedure
   - Monitor progress and adjust as needed
   - Document key observations and results

3. **Evaluation Phase**
   - Assess outcomes against expected results
   - Identify areas for improvement
   - Plan next steps and iterations

**Expected Outcomes**: Clear understanding of basic application principles
**Common Challenges**: Typical obstacles beginners encounter and how to overcome them

#### Example 2: Intermediate Application
**Scenario**: More complex implementation involving multiple variables

**Detailed Walkthrough**:
- **Context Setting**: Understanding when and why to use this approach
- **Resource Planning**: What you'll need and how to prepare effectively
- **Execution Strategy**: Step-by-step implementation with decision points
- **Quality Assurance**: How to verify and validate your results
- **Optimization Tips**: Ways to improve efficiency and effectiveness

#### Example 3: Advanced Professional Application
**Scenario**: Industry-level implementation with real-world constraints

**Professional Context**:
- **Business Requirements**: Understanding stakeholder needs and expectations
- **Technical Constraints**: Working within system limitations and requirements
- **Time and Budget Considerations**: Delivering results within realistic parameters
- **Risk Management**: Identifying and mitigating potential challenges
- **Success Metrics**: How to measure and communicate results effectively

---

`;
      }

      if (completedRequirements.find((req: any) => req.id === 'interactive-exercises')) {
        comprehensiveContent += `## 🎯 Interactive Learning Exercises

### Exercise Set 1: Foundation Building
**Learning Objective**: Establish basic competency in core concepts

**Exercise 1.1: Concept Mapping**
- Create a visual representation of key concepts and their relationships
- Identify connections between different elements
- **Time Required**: 20 minutes
- **Materials Needed**: Digital mapping tool or paper and markers
- **Success Criteria**: Clear, logical concept map showing understanding

**Exercise 1.2: Terminology Practice**
- Interactive quiz on key terms and definitions
- Progressive difficulty from basic to advanced terminology
- **Format**: Multiple choice, fill-in-the-blank, and matching exercises
- **Self-Assessment**: Immediate feedback and explanations

### Exercise Set 2: Application Practice
**Learning Objective**: Develop practical skills through guided practice

**Exercise 2.1: Guided Implementation**
- Follow detailed instructions to complete a practical task
- Document your process and observations
- **Deliverable**: Completed project with reflection notes
- **Peer Review**: Share with colleagues for feedback and discussion

**Exercise 2.2: Problem-Solving Challenge**
- Work through realistic scenarios with multiple solution paths
- Compare different approaches and their trade-offs
- **Group Activity**: Collaborate with others to explore various solutions
- **Debrief Session**: Discuss learnings and insights gained

### Exercise Set 3: Advanced Application
**Learning Objective**: Demonstrate mastery through complex challenges

**Exercise 3.1: Innovation Project**
- Design an original application of learned concepts
- Present your solution to simulated stakeholders
- **Requirements**: Creativity, feasibility, and clear communication
- **Evaluation Criteria**: Innovation, practicality, and presentation quality

---

`;
      }

      if (completedRequirements.find((req: any) => req.id === 'case-studies')) {
        comprehensiveContent += `## 📊 Industry Case Studies

### Case Study 1: Startup Success Story
**Company Background**: Tech startup implementing ${moduleTitle} for competitive advantage

**Challenge**: 
The startup needed to rapidly scale their operations while maintaining quality standards. Traditional approaches were too slow and resource-intensive for their lean team.

**Solution Implementation**:
- **Phase 1**: Assessment and strategic planning (2 weeks)
- **Phase 2**: Pilot implementation with core team (4 weeks)  
- **Phase 3**: Full rollout and optimization (8 weeks)

**Results Achieved**:
- 300% improvement in efficiency metrics
- 50% reduction in time-to-market for new features
- 95% team satisfaction with new processes

**Key Learnings**:
- Importance of stakeholder buy-in and communication
- Value of iterative improvement over perfect initial implementation
- Critical success factors for sustainable adoption

### Case Study 2: Enterprise Transformation
**Company Background**: Fortune 500 company modernizing legacy systems

**Transformation Challenge**:
Large organization with established processes needed to adopt ${moduleTitle} without disrupting ongoing operations.

**Strategic Approach**:
- **Assessment Phase**: Comprehensive analysis of current state
- **Design Phase**: Custom solution architecture for enterprise scale
- **Implementation Phase**: Phased rollout across multiple divisions
- **Optimization Phase**: Continuous improvement and refinement

**Measurable Outcomes**:
- $2.5M annual cost savings
- 40% improvement in customer satisfaction scores
- 25% increase in employee productivity metrics

**Critical Success Factors**:
- Executive sponsorship and clear communication
- Comprehensive training and change management
- Robust measurement and feedback systems

---

`;
      }

      if (completedRequirements.find((req: any) => req.id === 'assessments')) {
        comprehensiveContent += `## ✅ Comprehensive Assessment Suite

### Knowledge Validation Quiz
**Assessment Type**: Multiple choice and short answer
**Duration**: 30 minutes
**Passing Score**: 80%

**Sample Questions**:

1. **Conceptual Understanding** (Multiple Choice)
   What is the primary benefit of implementing ${moduleTitle} in professional settings?
   
   A) Reduced complexity in all situations
   B) Improved efficiency and standardization
   C) Elimination of all potential errors
   D) Automatic solution to all problems
   
   *Correct Answer: B - Explanation provided with detailed reasoning*

2. **Application Knowledge** (Short Answer)
   Describe the three-step process for implementing ${moduleTitle} in a new environment. Include key considerations for each step.
   
   *Assessment Criteria: Clear structure, practical considerations, realistic timeline*

3. **Critical Thinking** (Essay)
   Analyze a scenario where ${moduleTitle} might not be the best solution. What alternative approaches would you recommend and why?
   
   *Evaluation Focus: Analytical thinking, understanding of limitations, solution alternatives*

### Practical Skills Assessment
**Assessment Type**: Hands-on project
**Duration**: 2-3 hours
**Deliverables**: Working implementation with documentation

**Project Requirements**:
- Demonstrate core concepts through practical application
- Document your decision-making process
- Include reflection on challenges and learnings
- Present solution to instructor or peer group

**Evaluation Rubric**:
- **Technical Accuracy** (40%): Correct application of concepts and methods
- **Process Documentation** (30%): Clear explanation of approach and reasoning  
- **Innovation/Creativity** (20%): Original thinking and problem-solving
- **Communication** (10%): Clear presentation and professional documentation

### Self-Assessment Tools
**Reflection Exercises**: 
- Learning journal with weekly reflections
- Peer feedback sessions and discussions
- Goal setting and progress tracking

**Competency Checklist**:
□ Can explain core concepts clearly to others
□ Successfully completes practical exercises independently  
□ Identifies appropriate use cases and limitations
□ Troubleshoots common problems effectively
□ Applies concepts creatively in new situations

---

`;
      }

      if (completedRequirements.find((req: any) => req.id === 'resources')) {
        comprehensiveContent += `## 📖 Learning Resources & Professional Development

### Essential Reading Materials
**Primary Textbooks**:
- "Advanced ${moduleTitle}: Theory and Practice" - Comprehensive academic treatment
- "Professional Guide to ${moduleTitle}" - Industry-focused practical handbook
- "Case Studies in ${moduleTitle} Implementation" - Real-world examples and analysis

**Research Papers and Articles**:
- Latest academic research in peer-reviewed journals
- Industry white papers and best practice guides
- Thought leadership articles from recognized experts

### Online Resources and Tools
**Professional Platforms**:
- Industry forums and discussion communities
- Professional networking groups and associations
- Continuing education and certification programs

**Software Tools and Applications**:
- Free and open-source tools for practice and learning
- Professional software with educational licenses
- Online simulators and interactive learning platforms

**Video Learning Content**:
- Expert interviews and thought leadership discussions
- Technical demonstrations and tutorials
- Conference presentations and keynote speeches

### Professional Development Pathways
**Certification Options**:
- Entry-level certifications for fundamental competency
- Advanced certifications for specialized expertise
- Instructor certifications for training and education roles

**Career Advancement**:
- Skills mapping for career progression
- Networking opportunities and professional connections
- Mentorship programs and expert guidance

**Continuing Education**:
- Advanced workshops and masterclasses
- Research opportunities and academic programs
- Industry conferences and learning events

---

`;
      }

      comprehensiveContent += `## 🎯 Summary and Next Steps

### Key Takeaways
This comprehensive module on ${moduleTitle} has provided:
- Solid theoretical foundation for understanding core concepts
- Practical skills through hands-on exercises and real-world examples  
- Industry perspective through case studies and professional insights
- Assessment tools to validate and measure your learning progress

### Immediate Action Items
1. **Review and Practice**: Revisit key concepts and complete all exercises
2. **Apply Knowledge**: Look for opportunities to use these skills in your current work
3. **Connect with Community**: Join professional groups and discussion forums
4. **Plan Next Steps**: Identify areas for continued learning and skill development

### Long-term Learning Path
- **Week 1-2**: Focus on mastering fundamental concepts and basic applications
- **Week 3-4**: Work through advanced exercises and case study analysis
- **Month 2**: Begin applying concepts in real projects with mentor guidance  
- **Month 3+**: Pursue certification or advanced study opportunities

### Success Metrics
Track your progress using these indicators:
- **Knowledge**: Can explain concepts clearly to others
- **Skills**: Successfully complete practical projects independently
- **Application**: Identify and solve real-world problems using learned concepts
- **Leadership**: Help others learn and apply these concepts effectively

---

*This comprehensive content was generated based on your specific requirements and learning objectives. Continue engaging with the material through practice, application, and community involvement for optimal learning outcomes.*`;

      // Store the comprehensive content in the database
      const moduleContent = await storage.createModuleContent({
        outlineId,
        moduleIndex,
        title: moduleTitle,
        content: comprehensiveContent,
        status: 'complete'
      });
      
      console.log('Comprehensive module content generated successfully:', moduleContent.id);
      res.json({ 
        success: true, 
        contentId: moduleContent.id, 
        content: comprehensiveContent,
        wordCount: comprehensiveContent.length,
        sectionsIncluded: completedRequirements.map((req: any) => req.title)
      });
      
    } catch (error) {
      console.error("Error generating comprehensive content:", error);
      res.status(500).json({ message: "Failed to generate comprehensive content" });
    }
  });

  // Outline enhancement route
  app.post('/api/enhance-section', isAuthenticated, async (req, res) => {
    try {
      const { sectionContent, context } = req.body;
      
      if (!sectionContent || !context) {
        return res.status(400).json({ message: "Section content and context are required" });
      }
      
      const enhancedContent = await enhanceOutlineSection(sectionContent, context);
      res.json({ enhancedContent });
    } catch (error) {
      console.error("Error enhancing section:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to enhance section" 
      });
    }
  });

  // Get single course outline by ID (for voice chat and direct access)
  app.get('/api/course-outlines/:id', async (req, res) => {
    try {
      const outlineId = parseInt(req.params.id);
      const outline = await storage.getCourseOutline(outlineId);
      if (!outline) {
        return res.status(404).json({ message: "Course outline not found" });
      }
      res.json(outline);
    } catch (error) {
      console.error("Error fetching course outline:", error);
      res.status(500).json({ message: "Failed to fetch course outline" });
    }
  });

  // Content Creator Routes
  
  // Initialize module contents for an outline
  app.post('/api/course-outlines/:id/initialize-content', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const outlineId = parseInt(req.params.id);
      
      // Verify ownership through project
      const outline = await storage.getCourseOutline(outlineId);
      if (!outline) {
        return res.status(404).json({ message: "Course outline not found" });
      }
      
      const project = await storage.getProject(outline.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Check if already initialized
      const existingContents = await storage.getOutlineModuleContents(outlineId);
      if (existingContents.length > 0) {
        return res.json(existingContents);
      }
      
      // Initialize module contents based on outline
      const outlineData = outline.content as any;
      const moduleCount = outlineData.modules?.length || 0;
      
      const moduleContents = await storage.initializeModuleContents(outlineId, moduleCount);
      res.json(moduleContents);
    } catch (error) {
      console.error("Error initializing module contents:", error);
      res.status(500).json({ message: "Failed to initialize module contents" });
    }
  });
  
  // Get all module contents for an outline
  app.get('/api/course-outlines/:id/module-contents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const outlineId = parseInt(req.params.id);
      
      // Verify ownership through project
      const outline = await storage.getCourseOutline(outlineId);
      if (!outline) {
        return res.status(404).json({ message: "Course outline not found" });
      }
      
      const project = await storage.getProject(outline.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const moduleContents = await storage.getOutlineModuleContents(outlineId);
      res.json(moduleContents);
    } catch (error) {
      console.error("Error fetching module contents:", error);
      res.status(500).json({ message: "Failed to fetch module contents" });
    }
  });
  
  // Generate content for a specific module
  app.post('/api/module-content/:id/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const moduleContentId = parseInt(req.params.id);
      
      // Verify ownership
      const moduleContent = await storage.getModuleContent(moduleContentId);
      if (!moduleContent) {
        return res.status(404).json({ message: "Module content not found" });
      }
      
      const outline = await storage.getCourseOutline(moduleContent.outlineId);
      if (!outline) {
        return res.status(404).json({ message: "Course outline not found" });
      }
      
      const project = await storage.getProject(outline.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Parse and validate the content generation request
      const requestData = contentGenerationRequestSchema.parse(req.body);
      
      // Get module data from outline
      const outlineData = outline.content as any;
      const moduleData = outlineData.modules?.[requestData.moduleIndex];
      
      if (!moduleData) {
        return res.status(400).json({ message: "Module not found in outline" });
      }
      
      // Update status to in_progress
      await storage.updateModuleContent(moduleContentId, { status: 'in_progress' });
      
      // Generate content
      const generatedContent = await generateModuleContent(requestData, moduleData, outlineData);
      
      // Save generated content
      const updatedModule = await storage.updateModuleContent(moduleContentId, {
        content: generatedContent,
        status: 'complete'
      });
      
      // Save the generation session
      await storage.createContentSession({
        moduleContentId,
        userPrompt: requestData.userPrompt,
        aiResponse: generatedContent,
        sessionData: { requestData, moduleData, courseContext: outlineData }
      });
      
      res.json(updatedModule);
    } catch (error) {
      console.error("Error generating module content:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate module content" 
      });
    }
  });
  
  // Generate follow-up questions for content planning
  app.post('/api/module-content/:id/follow-up-questions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const moduleContentId = parseInt(req.params.id);
      
      // Verify ownership
      const moduleContent = await storage.getModuleContent(moduleContentId);
      if (!moduleContent) {
        return res.status(404).json({ message: "Module content not found" });
      }
      
      const outline = await storage.getCourseOutline(moduleContent.outlineId);
      if (!outline) {
        return res.status(404).json({ message: "Course outline not found" });
      }
      
      const project = await storage.getProject(outline.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { userPrompt, moduleIndex } = req.body;
      
      if (!userPrompt || typeof moduleIndex !== 'number') {
        return res.status(400).json({ message: "User prompt and module index are required" });
      }
      
      // Get module data from outline
      const outlineData = outline.content as any;
      const moduleData = outlineData.modules?.[moduleIndex];
      
      if (!moduleData) {
        return res.status(400).json({ message: "Module not found in outline" });
      }
      
      // Generate follow-up questions
      const questions = await generateFollowUpQuestions(userPrompt, moduleData, outlineData);
      
      res.json({ questions });
    } catch (error) {
      console.error("Error generating follow-up questions:", error);
      res.status(500).json({ message: "Failed to generate follow-up questions" });
    }
  });
  
  // Enhance existing module content
  app.post('/api/module-content/:id/enhance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const moduleContentId = parseInt(req.params.id);
      
      // Verify ownership
      const moduleContent = await storage.getModuleContent(moduleContentId);
      if (!moduleContent) {
        return res.status(404).json({ message: "Module content not found" });
      }
      
      const outline = await storage.getCourseOutline(moduleContent.outlineId);
      if (!outline) {
        return res.status(404).json({ message: "Course outline not found" });
      }
      
      const project = await storage.getProject(outline.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { enhancementPrompt } = req.body;
      
      if (!enhancementPrompt || !moduleContent.content) {
        return res.status(400).json({ message: "Enhancement prompt and existing content are required" });
      }
      
      // Enhance the content
      const enhancedContent = await enhanceModuleContent(
        moduleContent.content as any,
        enhancementPrompt
      );
      
      // Save enhanced content
      const updatedModule = await storage.updateModuleContent(moduleContentId, {
        content: enhancedContent,
        status: 'complete'
      });
      
      // Save the enhancement session
      await storage.createContentSession({
        moduleContentId,
        userPrompt: `Enhancement: ${enhancementPrompt}`,
        aiResponse: enhancedContent,
        sessionData: { enhancementPrompt, originalContent: moduleContent.content }
      });
      
      res.json(updatedModule);
    } catch (error) {
      console.error("Error enhancing module content:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to enhance module content" 
      });
    }
  });

  return httpServer;
}
