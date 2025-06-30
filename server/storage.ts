import {
  users,
  projects,
  courseOutlines,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type CourseOutline,
  type InsertCourseOutline,
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
}

export const storage = new DatabaseStorage();
