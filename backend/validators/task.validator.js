const Joi = require("joi");
const { objectIdValidation } = require("../utils");

const createTaskSchema = Joi.object({
  project_id: Joi.string()
    .custom(objectIdValidation)
    .required()
    .messages({
      "string.empty": "Project ID is required",
      "any.required": "Project ID is required",
    }),
  type: Joi.string()
    .valid("task", "bug", "story", "epic", "subtask")
    .default("task")
    .messages({
      "any.only": "Task type must be one of: task, bug, story, epic, subtask",
    }),
  title: Joi.string()
    .trim()
    .min(3)
    .max(200)
    .required()
    .messages({
      "string.empty": "Task title is required",
      "string.min": "Task title must be at least 3 characters",
      "string.max": "Task title must not exceed 200 characters",
      "any.required": "Task title is required",
    }),
  description: Joi.string()
    .trim()
    .max(5000)
    .allow("")
    .optional()
    .messages({
      "string.max": "Task description must not exceed 5000 characters",
    }),
  status: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "Task status is required",
      "any.required": "Task status is required",
    }),
  priority: Joi.string()
    .valid("lowest", "low", "medium", "high", "highest")
    .default("medium")
    .messages({
      "any.only": "Priority must be one of: lowest, low, medium, high, highest",
    }),
  assignee: Joi.string()
    .custom(objectIdValidation)
    .allow(null)
    .optional()
    .messages({
      "string.empty": "Assignee must be a valid user ID",
    }),
  due_date: Joi.date()
    .allow(null)
    .optional()
    .messages({
      "date.base": "Due date must be a valid date",
    }),
  parent_id: Joi.string()
    .custom(objectIdValidation)
    .allow(null)
    .optional()
    .messages({
      "string.empty": "Parent ID must be a valid task ID",
    }),
});


const updateTaskSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(3)
    .max(200)
    .optional()
    .messages({
      "string.min": "Task title must be at least 3 characters",
      "string.max": "Task title must not exceed 200 characters",
    }),
  description: Joi.string()
    .trim()
    .max(5000)
    .allow("")
    .optional()
    .messages({
      "string.max": "Task description must not exceed 5000 characters",
    }),
  priority: Joi.string()
    .valid("lowest", "low", "medium", "high", "highest")
    .optional()
    .messages({
      "any.only": "Priority must be one of: lowest, low, medium, high, highest",
    }),
  assignee: Joi.string()
    .custom(objectIdValidation)
    .allow(null)
    .optional(),
  due_date: Joi.date()
    .allow(null)
    .optional()
    .messages({
      "date.base": "Due date must be a valid date",
    }),
  type: Joi.string()
    .valid("task", "bug", "story", "epic", "subtask")
    .optional()
    .messages({
      "any.only": "Task type must be one of: task, bug, story, epic, subtask",
    }),
});

const updateTaskStatusSchema = Joi.object({
  status: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "Status is required",
      "any.required": "Status is required",
    }),
  prevRank: Joi.string()
    .allow(null)
    .optional(),
  nextRank: Joi.string()
    .allow(null)
    .optional(),
});

const commentSchema = Joi.object({
  message: Joi.string()
    .trim()
    .min(1)
    .max(5000)
    .required()
    .messages({
      "string.empty": "Comment message is required",
      "string.min": "Comment message must not be empty",
      "string.max": "Comment message must not exceed 5000 characters",
      "any.required": "Comment message is required",
    }),
});

const updateCommentSchema = Joi.object({
  message: Joi.string()
    .trim()
    .min(1)
    .max(5000)
    .required()
    .messages({
      "string.empty": "Comment message is required",
      "string.min": "Comment message must not be empty",
      "string.max": "Comment message must not exceed 5000 characters",
      "any.required": "Comment message is required",
    }),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  commentSchema,
  updateCommentSchema,
};
