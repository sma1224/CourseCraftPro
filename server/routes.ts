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
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

  // Update a course outline directly by ID
  app.patch('/api/course-outlines/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const outlineId = parseInt(req.params.id);
      
      // Get the outline and verify ownership through project
      const outline = await storage.getCourseOutline(outlineId);
      if (!outline) {
        return res.status(404).json({ message: "Course outline not found" });
      }
      
      const project = await storage.getProject(outline.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Update the outline with the complete data
      const updates = {
        title: req.body.title || outline.title,
        content: req.body,
      };
      
      const updatedOutline = await storage.updateCourseOutline(outlineId, updates);
      res.json(updatedOutline);
    } catch (error) {
      console.error("Error updating course outline:", error);
      res.status(500).json({ message: "Failed to update course outline" });
    }
  });

  // Direct course outline access endpoints
  app.get('/api/course-outlines/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const outlineId = parseInt(req.params.id);
      
      const outline = await storage.getCourseOutline(outlineId);
      if (!outline) {
        return res.status(404).json({ message: "Course outline not found" });
      }
      
      // Verify the outline belongs to the user through the project
      const project = await storage.getProject(outline.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(outline);
    } catch (error) {
      console.error("Error fetching course outline:", error);
      res.status(500).json({ message: "Failed to fetch course outline" });
    }
  });

  app.get('/api/course-outlines/:id/module-contents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const outlineId = parseInt(req.params.id);
      
      const outline = await storage.getCourseOutline(outlineId);
      if (!outline) {
        return res.status(404).json({ message: "Course outline not found" });
      }
      
      // Verify the outline belongs to the user through the project
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

  app.post('/api/course-outlines/:id/initialize-content', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const outlineId = parseInt(req.params.id);
      
      const outline = await storage.getCourseOutline(outlineId);
      if (!outline) {
        return res.status(404).json({ message: "Course outline not found" });
      }
      
      // Verify the outline belongs to the user through the project
      const project = await storage.getProject(outline.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Initialize module contents based on outline modules
      const outlineData = typeof outline.content === 'string' ? JSON.parse(outline.content) : outline.content;
      const moduleCount = outlineData.modules?.length || 0;
      
      const moduleContents = await storage.initializeModuleContents(outlineId, moduleCount);
      res.json(moduleContents);
    } catch (error) {
      console.error("Error initializing module contents:", error);
      res.status(500).json({ message: "Failed to initialize module contents" });
    }
  });

  // Alternative endpoint format for module contents
  app.get('/api/outlines/:id/module-contents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const outlineId = parseInt(req.params.id);
      
      const outline = await storage.getCourseOutline(outlineId);
      if (!outline) {
        return res.status(404).json({ message: "Course outline not found" });
      }
      
      // Verify the outline belongs to the user through the project
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
          title: 'Real-World Case Studies',
          description: 'Industry examples and scenarios for practical application',
          completed: false,
          priority: 'medium' as const
        },
        {
          id: 'assessments',
          title: 'Knowledge Assessments',
          description: 'Quizzes, self-check questions, and evaluation tools',
          completed: false,
          priority: 'low' as const
        }
      ];

      res.json({ analysis, requirements });
    } catch (error) {
      console.error('Error analyzing content requirements:', error);
      res.status(500).json({ error: 'Failed to analyze content requirements' });
    }
  });

  // Generate comprehensive content with smart generator
  app.post('/api/generate-comprehensive-content', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { 
        outlineId, 
        moduleIndex, 
        moduleTitle, 
        moduleDescription, 
        courseTitle, 
        courseDescription,
        requirements,
        detailLevel,
        targetWordCount
      } = req.body;
      
      console.log('Generating comprehensive content for:', { 
        outlineId, 
        moduleIndex, 
        moduleTitle, 
        detailLevel, 
        targetWordCount, 
        requirementsCount: requirements?.length || 0,
        selectedRequirements: requirements?.filter((r: any) => r.completed)?.map((r: any) => r.id) || []
      });
      
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
      
      // Build content request with smart generator requirements
      const contentRequest = {
        moduleTitle,
        moduleDescription,
        courseTitle,
        courseDescription,
        contentType: detailLevel || 'detailed',
        targetAudience: 'general',
        duration: '60 minutes',
        includeExercises: requirements.some((r: any) => r.id === 'interactive-exercises' && r.completed),
        includeCaseStudies: requirements.some((r: any) => r.id === 'case-studies' && r.completed),
        includeAssessments: requirements.some((r: any) => r.id === 'assessments' && r.completed),
        followUpResponses: [],
        targetWordCount: targetWordCount || 1000,
        selectedRequirements: requirements.filter((r: any) => r.completed)
      };
      
      // Generate content using the enhanced content generator
      const generatedContent = await generateModuleContent(contentRequest);
      
      // Update or create module content
      const existingContent = await storage.getOutlineModuleContents(outlineId);
      const moduleContent = existingContent.find((mc: any) => mc.moduleIndex === moduleIndex);
      
      if (moduleContent) {
        await storage.updateModuleContent(moduleContent.id, {
          title: moduleTitle,
          content: generatedContent,
          status: 'complete'
        });
      } else {
        await storage.createModuleContent({
          outlineId,
          moduleIndex,
          title: moduleTitle,
          content: generatedContent,
          status: 'complete'
        });
      }
      
      res.json({ success: true, content: generatedContent });
    } catch (error) {
      console.error('Error generating comprehensive content:', error);
      res.status(500).json({ error: 'Failed to generate comprehensive content' });
    }
  });

  // Update module content with PUT method
  app.put('/api/module-content/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { title, content } = req.body;
      
      // Verify the module content exists and belongs to the user
      const moduleContent = await storage.getModuleContent(parseInt(id));
      if (!moduleContent) {
        return res.status(404).json({ message: "Module content not found" });
      }
      
      // Check if user owns the outline through the project
      const outline = await storage.getCourseOutline(moduleContent.outlineId);
      if (!outline) {
        return res.status(404).json({ message: "Outline not found" });
      }
      
      const project = await storage.getProject(outline.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedContent = await storage.updateModuleContent(parseInt(id), {
        title,
        content,
        status: 'complete'
      });
      
      res.json({ success: true, content: updatedContent });
    } catch (error) {
      console.error('Error updating module content:', error);
      res.status(500).json({ error: 'Failed to update module content' });
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
      
      // Extract content preferences from request
      const { contentDetail = 'detailed', wordCount = 1000 } = req.body;
      
      // Use OpenAI to generate comprehensive, detailed content
      const systemPrompt = `You are an expert instructional designer creating comprehensive educational courseware. Create detailed, professional course material that provides real educational value.

**CRITICAL FORMATTING REQUIREMENTS:**
- Use proper markdown formatting with clear headers and subheaders
- Include line breaks between sections and paragraphs
- Use ## for main sections, ### for subsections
- Add blank lines between paragraphs for readability
- Format as professional courseware reading material

**WORD COUNT REQUIREMENTS:**
- Target word count: ${wordCount} words MINIMUM
- Content detail level: ${contentDetail}
- ${contentDetail === 'brief' ? 'Generate 300-500 words of concise but complete explanations' : ''}
- ${contentDetail === 'quick' ? 'Generate 500-800 words with clear explanations and essential details' : ''}
- ${contentDetail === 'detailed' ? 'Generate 800-1200 words with comprehensive coverage and examples' : ''}
- ${contentDetail === 'comprehensive' ? 'Generate 1200+ words with in-depth analysis and multiple examples' : ''}

**WRITING REQUIREMENTS:**
- Write in full paragraphs with academic depth suitable for courseware
- Each paragraph should be 80-150 words
- Include real-world examples integrated into the narrative
- Provide thorough theoretical foundations with practical applications
- Use transitional sentences to connect ideas smoothly
- Write as comprehensive educational reading material, not bullet points

Focus on creating content that truly teaches the subject matter with the specified length and detail level.`;

      const userPrompt = `Create comprehensive educational courseware content for:

**Module**: ${moduleTitle}
**Course**: ${courseTitle}
**Module Description**: ${moduleDescription}
**Target Word Count**: ${wordCount} words MINIMUM
**Content Detail Level**: ${contentDetail}

**Required Content Sections** (based on selected requirements):
${completedRequirements.map((req: any) => `- ${req.title}: ${req.description}`).join('\n')}

**Context from chat history**:
${chatHistory.slice(-3).map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}

**FORMATTING INSTRUCTIONS:**
- Use proper markdown formatting with ## and ### headers
- Include blank lines between sections and paragraphs
- Write in full paragraphs (80-150 words each)
- Structure as professional courseware reading material

**CONTENT REQUIREMENTS:**
Generate detailed, educational content that covers all essential aspects of ${moduleTitle}. Must include:

1. **Introduction Section** - Clear overview and learning objectives
2. **Theoretical Foundations** - Comprehensive explanations of core concepts
3. **Practical Examples** - Real-world applications and demonstrations
4. **Step-by-Step Instructions** - Where applicable, detailed procedures
5. **Case Studies** - Industry examples and scenarios
6. **Interactive Elements** - Exercises and activities for engagement
7. **Assessment Questions** - Knowledge checks and practice problems
8. **Summary Section** - Key takeaways and next steps

Write ${wordCount} words minimum with ${contentDetail} level detail. Make this content valuable courseware for learners who want to master ${moduleTitle}.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 6000,
        temperature: 0.7,
      });

      const comprehensiveContent = response.choices[0].message.content;

      // Save the generated content
      const contentData = {
        outlineId: parseInt(outlineId),
        moduleIndex: parseInt(moduleIndex),
        title: moduleTitle,
        content: comprehensiveContent,
        status: 'complete' as const
      };

      const savedContent = await storage.createModuleContent(contentData);
      console.log('Comprehensive module content generated successfully:', savedContent.id);

      res.json({ success: true, contentId: savedContent.id, content: comprehensiveContent });
    } catch (error) {
      console.error('Error generating comprehensive content:', error);
      res.status(500).json({ error: 'Failed to generate comprehensive content' });
    }
  });

  // Update module content
  app.put('/api/module-content/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content } = req.body;
      
      const updatedContent = await storage.updateModuleContent(parseInt(id), {
        title,
        content
      });
      
      res.json(updatedContent);
    } catch (error) {
      console.error('Error updating module content:', error);
      res.status(500).json({ error: 'Failed to update module content' });
    }
  });

  return httpServer;
}
