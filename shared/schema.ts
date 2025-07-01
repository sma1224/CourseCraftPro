import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: varchar("status", { enum: ["draft", "in_progress", "completed"] }).default("draft"),
  courseType: varchar("course_type"),
  targetAudience: text("target_audience"),
  duration: text("duration"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course outlines table
export const courseOutlines = pgTable("course_outlines", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: jsonb("content").notNull(), // Stores the structured outline as JSON
  version: integer("version").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Module content table for detailed course content
export const moduleContent = pgTable("module_content", {
  id: serial("id").primaryKey(),
  outlineId: integer("outline_id").notNull().references(() => courseOutlines.id, { onDelete: "cascade" }),
  moduleIndex: integer("module_index").notNull(), // Which module in the outline (0-based)
  title: text("title").notNull(),
  status: varchar("status", { enum: ["not_started", "in_progress", "complete", "needs_review"] }).default("not_started"),
  content: jsonb("content"), // Detailed content including lessons, exercises, assessments
  estimatedTime: integer("estimated_time"), // Time in minutes to complete content creation
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content generation sessions for tracking AI interactions
export const contentSessions = pgTable("content_sessions", {
  id: serial("id").primaryKey(),
  moduleContentId: integer("module_content_id").notNull().references(() => moduleContent.id, { onDelete: "cascade" }),
  userPrompt: text("user_prompt").notNull(),
  aiResponse: jsonb("ai_response"), // Generated content response
  sessionData: jsonb("session_data"), // Context and conversation history
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  outlines: many(courseOutlines),
}));

export const courseOutlinesRelations = relations(courseOutlines, ({ one, many }) => ({
  project: one(projects, {
    fields: [courseOutlines.projectId],
    references: [projects.id],
  }),
  moduleContent: many(moduleContent),
}));

export const moduleContentRelations = relations(moduleContent, ({ one, many }) => ({
  outline: one(courseOutlines, {
    fields: [moduleContent.outlineId],
    references: [courseOutlines.id],
  }),
  sessions: many(contentSessions),
}));

export const contentSessionsRelations = relations(contentSessions, ({ one }) => ({
  moduleContent: one(moduleContent, {
    fields: [contentSessions.moduleContentId],
    references: [moduleContent.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectProjectSchema = createSelectSchema(projects);

export const insertCourseOutlineSchema = createInsertSchema(courseOutlines).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectCourseOutlineSchema = createSelectSchema(courseOutlines);

export const insertModuleContentSchema = createInsertSchema(moduleContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectModuleContentSchema = createSelectSchema(moduleContent);

export const insertContentSessionSchema = createInsertSchema(contentSessions).omit({
  id: true,
  createdAt: true,
});

export const selectContentSessionSchema = createSelectSchema(contentSessions);

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = z.infer<typeof selectProjectSchema>;
export type InsertCourseOutline = z.infer<typeof insertCourseOutlineSchema>;
export type CourseOutline = z.infer<typeof selectCourseOutlineSchema>;
export type InsertModuleContent = z.infer<typeof insertModuleContentSchema>;
export type ModuleContent = z.infer<typeof selectModuleContentSchema>;
export type InsertContentSession = z.infer<typeof insertContentSessionSchema>;
export type ContentSession = z.infer<typeof selectContentSessionSchema>;

// Course generation request schema
export const courseGenerationRequestSchema = z.object({
  description: z.string().min(10, "Course description must be at least 10 characters"),
  title: z.string().optional(),
  targetAudience: z.string().optional(),
  duration: z.string().optional(),
  courseType: z.string().optional(),
});

export type CourseGenerationRequest = z.infer<typeof courseGenerationRequestSchema>;

// Content generation request schema
export const contentGenerationRequestSchema = z.object({
  moduleIndex: z.number().min(0),
  userPrompt: z.string().min(10, "Content description must be at least 10 characters"),
  contentTypes: z.array(z.enum(["lesson", "exercise", "case_study", "assessment", "resources", "activities"])).optional(),
  targetEngagement: z.enum(["low", "medium", "high"]).optional(),
  difficultyLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  includeTemplates: z.boolean().optional(),
  includeExamples: z.boolean().optional(),
});

export type ContentGenerationRequest = z.infer<typeof contentGenerationRequestSchema>;
