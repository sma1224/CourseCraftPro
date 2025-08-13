import {
  users,
  projects,
  courseOutlines,
  moduleContent,
  lessonContent,
  contentSessions,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type CourseOutline,
  type InsertCourseOutline,
  type ModuleContent,
  type InsertModuleContent,
  type LessonContent,
  type InsertLessonContent,
  type ContentSession,
  type InsertContentSession,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations - required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Project operations
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;
  getUserProjects(userId: string): Promise<Project[]>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;
  
  // Course outline operations
  createCourseOutline(outline: InsertCourseOutline): Promise<CourseOutline>;
  getCourseOutline(id: number): Promise<CourseOutline | undefined>;
  getProjectOutlines(projectId: number): Promise<CourseOutline[]>;
  updateCourseOutline(id: number, updates: Partial<InsertCourseOutline>): Promise<CourseOutline>;
  getActiveOutline(projectId: number): Promise<CourseOutline | undefined>;
  
  // Module content operations
  createModuleContent(content: InsertModuleContent): Promise<ModuleContent>;
  getModuleContent(id: number): Promise<ModuleContent | undefined>;
  getOutlineModuleContents(outlineId: number): Promise<ModuleContent[]>;
  updateModuleContent(id: number, updates: Partial<InsertModuleContent>): Promise<ModuleContent>;
  initializeModuleContents(outlineId: number, moduleCount: number): Promise<ModuleContent[]>;
  
  // Lesson content operations
  createLessonContent(content: InsertLessonContent): Promise<LessonContent>;
  getLessonContent(id: number): Promise<LessonContent | undefined>;
  getModuleLessonContents(outlineId: number, moduleIndex: number): Promise<LessonContent[]>;
  getOutlineLessonContents(outlineId: number): Promise<LessonContent[]>;
  updateLessonContent(id: number, updates: Partial<InsertLessonContent>): Promise<LessonContent>;
  deleteLessonContent(id: number): Promise<void>;
  
  // Content session operations
  createContentSession(session: InsertContentSession): Promise<ContentSession>;
  getModuleContentSessions(moduleContentId: number): Promise<ContentSession[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Project operations
  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values(project)
      .returning();
    return newProject;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    return project;
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.updatedAt));
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Course outline operations
  async createCourseOutline(outline: InsertCourseOutline): Promise<CourseOutline> {
    // Set previous outlines as inactive
    await db
      .update(courseOutlines)
      .set({ isActive: false })
      .where(eq(courseOutlines.projectId, outline.projectId));

    const [newOutline] = await db
      .insert(courseOutlines)
      .values(outline)
      .returning();
    return newOutline as CourseOutline;
  }

  async getCourseOutline(id: number): Promise<CourseOutline | undefined> {
    const [outline] = await db
      .select()
      .from(courseOutlines)
      .where(eq(courseOutlines.id, id));
    return outline as CourseOutline | undefined;
  }

  async getProjectOutlines(projectId: number): Promise<CourseOutline[]> {
    const outlines = await db
      .select()
      .from(courseOutlines)
      .where(eq(courseOutlines.projectId, projectId))
      .orderBy(desc(courseOutlines.createdAt));
    return outlines as CourseOutline[];
  }

  async updateCourseOutline(id: number, updates: Partial<InsertCourseOutline>): Promise<CourseOutline> {
    const [outline] = await db
      .update(courseOutlines)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(courseOutlines.id, id))
      .returning();
    return outline as CourseOutline;
  }

  async getActiveOutline(projectId: number): Promise<CourseOutline | undefined> {
    const [outline] = await db
      .select()
      .from(courseOutlines)
      .where(and(
        eq(courseOutlines.projectId, projectId),
        eq(courseOutlines.isActive, true)
      ));
    return outline as CourseOutline | undefined;
  }

  // Module content operations
  async createModuleContent(content: InsertModuleContent): Promise<ModuleContent> {
    const [moduleContentRecord] = await db
      .insert(moduleContent)
      .values(content)
      .returning();
    return moduleContentRecord as ModuleContent;
  }

  async getModuleContent(id: number): Promise<ModuleContent | undefined> {
    const [content] = await db
      .select()
      .from(moduleContent)
      .where(eq(moduleContent.id, id));
    return content as ModuleContent | undefined;
  }

  async getOutlineModuleContents(outlineId: number): Promise<ModuleContent[]> {
    const contents = await db
      .select()
      .from(moduleContent)
      .where(eq(moduleContent.outlineId, outlineId))
      .orderBy(moduleContent.moduleIndex);
    return contents as ModuleContent[];
  }

  async updateModuleContent(id: number, updates: Partial<InsertModuleContent>): Promise<ModuleContent> {
    const [updated] = await db
      .update(moduleContent)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(moduleContent.id, id))
      .returning();
    return updated as ModuleContent;
  }

  async initializeModuleContents(outlineId: number, moduleCount: number): Promise<ModuleContent[]> {
    // Get the outline to extract module titles
    const outline = await this.getCourseOutline(outlineId);
    if (!outline) {
      throw new Error('Outline not found');
    }

    const outlineData = outline.content as any;
    const modules = outlineData.modules || [];

    const moduleContents: InsertModuleContent[] = [];
    for (let i = 0; i < moduleCount && i < modules.length; i++) {
      moduleContents.push({
        outlineId,
        moduleIndex: i,
        title: modules[i].title || `Module ${i + 1}`,
        status: 'not_started',
        estimatedTime: 120, // Default 2 hours
      });
    }

    const results: ModuleContent[] = [];
    for (const content of moduleContents) {
      const created = await this.createModuleContent(content);
      results.push(created);
    }

    return results;
  }

  // Content session operations
  async createContentSession(session: InsertContentSession): Promise<ContentSession> {
    const [sessionRecord] = await db
      .insert(contentSessions)
      .values(session)
      .returning();
    return sessionRecord as ContentSession;
  }

  async getModuleContentSessions(moduleContentId: number): Promise<ContentSession[]> {
    const sessions = await db
      .select()
      .from(contentSessions)
      .where(eq(contentSessions.moduleContentId, moduleContentId))
      .orderBy(desc(contentSessions.createdAt));
    return sessions as ContentSession[];
  }

  // Lesson content operations
  async createLessonContent(content: InsertLessonContent): Promise<LessonContent> {
    const [lessonContentRecord] = await db
      .insert(lessonContent)
      .values(content)
      .returning();
    return lessonContentRecord as LessonContent;
  }

  async getLessonContent(id: number): Promise<LessonContent | undefined> {
    const [content] = await db
      .select()
      .from(lessonContent)
      .where(eq(lessonContent.id, id));
    return content as LessonContent | undefined;
  }

  async getModuleLessonContents(outlineId: number, moduleIndex: number): Promise<LessonContent[]> {
    const contents = await db
      .select()
      .from(lessonContent)
      .where(and(
        eq(lessonContent.outlineId, outlineId),
        eq(lessonContent.moduleIndex, moduleIndex)
      ))
      .orderBy(lessonContent.lessonIndex);
    return contents as LessonContent[];
  }

  async getOutlineLessonContents(outlineId: number): Promise<LessonContent[]> {
    const contents = await db
      .select()
      .from(lessonContent)
      .where(eq(lessonContent.outlineId, outlineId))
      .orderBy(lessonContent.moduleIndex, lessonContent.lessonIndex);
    return contents as LessonContent[];
  }

  async updateLessonContent(id: number, updates: Partial<InsertLessonContent>): Promise<LessonContent> {
    const [content] = await db
      .update(lessonContent)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(lessonContent.id, id))
      .returning();
    return content as LessonContent;
  }

  async deleteLessonContent(id: number): Promise<void> {
    await db.delete(lessonContent).where(eq(lessonContent.id, id));
  }
}

export const storage = new DatabaseStorage();
