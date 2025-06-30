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

export const courseOutlinesRelations = relations(courseOutlines, ({ one }) => ({
  project: one(projects, {
    fields: [courseOutlines.projectId],
    references: [projects.id],
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

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = z.infer<typeof selectProjectSchema>;
export type InsertCourseOutline = z.infer<typeof insertCourseOutlineSchema>;
export type CourseOutline = z.infer<typeof selectCourseOutlineSchema>;

// Course generation request schema
export const courseGenerationRequestSchema = z.object({
  description: z.string().min(10, "Course description must be at least 10 characters"),
  title: z.string().optional(),
  targetAudience: z.string().optional(),
  duration: z.string().optional(),
  courseType: z.string().optional(),
});

export type CourseGenerationRequest = z.infer<typeof courseGenerationRequestSchema>;
