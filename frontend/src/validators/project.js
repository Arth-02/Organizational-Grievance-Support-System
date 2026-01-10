import { z } from "zod";

// Project validation schemas
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Project name must be at least 3 characters" })
    .max(100, { message: "Project name must not exceed 100 characters" }),
  key: z
    .string()
    .min(2, { message: "Project key must be at least 2 characters" })
    .max(10, { message: "Project key must not exceed 10 characters" })
    .regex(/^[A-Z0-9]+$/, { message: "Project key must be uppercase alphanumeric" }),
  description: z
    .string()
    .max(1000, { message: "Description must not exceed 1000 characters" })
    .optional(),
  project_type: z
    .enum(["software", "business", "service_desk"], {
      errorMap: () => ({ message: "Project type must be one of: software, business, service_desk" }),
    })
    .default("software"),
  status: z
    .enum(["planned", "active", "on_hold", "completed", "archived"], {
      errorMap: () => ({ message: "Status must be one of: planned, active, on_hold, completed, archived" }),
    })
    .default("active"),
  start_date: z.coerce.date().optional().nullable(),
  end_date: z.coerce.date().optional().nullable(),
  manager: z.array(z.string()).optional(),
  members: z.array(z.string()).optional(),
  icon: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Project name must be at least 3 characters" })
    .max(100, { message: "Project name must not exceed 100 characters" })
    .optional(),
  description: z
    .string()
    .max(1000, { message: "Description must not exceed 1000 characters" })
    .optional(),
  project_type: z
    .enum(["software", "business", "service_desk"], {
      errorMap: () => ({ message: "Project type must be one of: software, business, service_desk" }),
    })
    .optional(),
  status: z
    .enum(["planned", "active", "on_hold", "completed", "archived"], {
      errorMap: () => ({ message: "Status must be one of: planned, active, on_hold, completed, archived" }),
    })
    .optional(),
  start_date: z.coerce.date().optional().nullable(),
  end_date: z.coerce.date().optional().nullable(),
  icon: z.string().optional(),
});

// Task validation schemas
export const createTaskSchema = z.object({
  project_id: z.string().min(1, { message: "Project ID is required" }),
  type: z
    .enum(["task", "bug", "story", "epic", "subtask"], {
      errorMap: () => ({ message: "Task type must be one of: task, bug, story, epic, subtask" }),
    })
    .default("task"),
  title: z
    .string()
    .min(3, { message: "Task title must be at least 3 characters" })
    .max(200, { message: "Task title must not exceed 200 characters" }),
  description: z
    .string()
    .max(5000, { message: "Task description must not exceed 5000 characters" })
    .optional(),
  status: z.string().min(1, { message: "Task status is required" }),
  priority: z
    .enum(["lowest", "low", "medium", "high", "highest"], {
      errorMap: () => ({ message: "Priority must be one of: lowest, low, medium, high, highest" }),
    })
    .default("medium"),
  assignee: z.string().optional().nullable(),
  due_date: z.coerce.date().optional().nullable(),
  parent_id: z.string().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Task title must be at least 3 characters" })
    .max(200, { message: "Task title must not exceed 200 characters" })
    .optional(),
  description: z
    .string()
    .max(5000, { message: "Task description must not exceed 5000 characters" })
    .optional(),
  priority: z
    .enum(["lowest", "low", "medium", "high", "highest"], {
      errorMap: () => ({ message: "Priority must be one of: lowest, low, medium, high, highest" }),
    })
    .optional(),
  assignee: z.string().optional().nullable(),
  due_date: z.coerce.date().optional().nullable(),
  type: z
    .enum(["task", "bug", "story", "epic", "subtask"], {
      errorMap: () => ({ message: "Task type must be one of: task, bug, story, epic, subtask" }),
    })
    .optional(),
});

// Comment validation schema
export const commentSchema = z.object({
  message: z
    .string()
    .min(1, { message: "Comment message is required" })
    .max(5000, { message: "Comment message must not exceed 5000 characters" }),
});

// Member management schemas
export const addMembersSchema = z
  .object({
    members: z.array(z.string()).min(1, { message: "At least one member is required" }).optional(),
    managers: z.array(z.string()).min(1, { message: "At least one manager is required" }).optional(),
  })
  .refine((data) => data.members || data.managers, {
    message: "At least one of members or managers is required",
  });

export const removeMembersSchema = z
  .object({
    members: z.array(z.string()).min(1, { message: "At least one member is required" }).optional(),
    managers: z.array(z.string()).min(1, { message: "At least one manager is required" }).optional(),
  })
  .refine((data) => data.members || data.managers, {
    message: "At least one of members or managers is required",
  });
