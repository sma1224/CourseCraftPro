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

  // Course outline generation route
  app.post('/api/generate-outline', isAuthenticated, async (req: any, res) => {
    try {
      console.log("Received outline generation request:", req.body);
      const requestData = courseGenerationRequestSchema.parse(req.body);
      console.log("Parsed request data:", requestData);
      const outline = await generateCourseOutline(requestData);
      console.log("Generated outline successfully:", outline.title);
      res.json(outline);
    } catch (error) {
      console.error("Error generating course outline:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to generate course outline" 
      });
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
      const userId = req.user.claims.sub;
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

  return httpServer;
}
