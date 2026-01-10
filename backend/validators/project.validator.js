const Joi = require("joi");
const { objectIdValidation } = require("../utils");

const createProjectSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .required()
    .messages({
      "string.empty": "Project name is required",
      "string.min": "Project name must be at least 3 characters",
      "string.max": "Project name must not exceed 100 characters",
      "any.required": "Project name is required",
    }),
  key: Joi.string()
    .trim()
    .min(2)
    .max(10)
    .uppercase()
    .pattern(/^[A-Z0-9]+$/)
    .required()
    .messages({
      "string.empty": "Project key is required",
      "string.min": "Project key must be at least 2 characters",
      "string.max": "Project key must not exceed 10 characters",
      "string.pattern.base": "Project key must contain only uppercase alphanumeric characters",
      "any.required": "Project key is required",
    }),
  description: Joi.string()
    .trim()
    .max(1000)
    .allow("")
    .optional()
    .messages({
      "string.max": "Description must not exceed 1000 characters",
    }),
  project_type: Joi.string()
    .valid("software", "business", "service_desk")
    .default("software")
    .messages({
      "any.only": "Project type must be one of: software, business, service_desk",
    }),
  status: Joi.string()
    .valid("planned", "active", "on_hold", "completed", "archived")
    .default("active")
    .messages({
      "any.only": "Status must be one of: planned, active, on_hold, completed, archived",
    }),
  start_date: Joi.date()
    .optional()
    .messages({
      "date.base": "Start date must be a valid date",
    }),
  end_date: Joi.date()
    .optional()
    .allow(null)
    .messages({
      "date.base": "End date must be a valid date",
    }),
  manager: Joi.array()
    .items(Joi.string().custom(objectIdValidation))
    .optional()
    .messages({
      "array.base": "Manager must be an array of user IDs",
    }),
  members: Joi.array()
    .items(Joi.string().custom(objectIdValidation))
    .optional()
    .messages({
      "array.base": "Members must be an array of user IDs",
    }),
  icon: Joi.string()
    .trim()
    .allow("")
    .optional(),
});

const updateProjectSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .optional()
    .messages({
      "string.min": "Project name must be at least 3 characters",
      "string.max": "Project name must not exceed 100 characters",
    }),
  description: Joi.string()
    .trim()
    .max(1000)
    .allow("")
    .optional()
    .messages({
      "string.max": "Description must not exceed 1000 characters",
    }),
  project_type: Joi.string()
    .valid("software", "business", "service_desk")
    .optional()
    .messages({
      "any.only": "Project type must be one of: software, business, service_desk",
    }),
  status: Joi.string()
    .valid("planned", "active", "on_hold", "completed", "archived")
    .optional()
    .messages({
      "any.only": "Status must be one of: planned, active, on_hold, completed, archived",
    }),
  start_date: Joi.date()
    .optional()
    .messages({
      "date.base": "Start date must be a valid date",
    }),
  end_date: Joi.date()
    .optional()
    .allow(null)
    .messages({
      "date.base": "End date must be a valid date",
    }),
  icon: Joi.string()
    .trim()
    .allow("")
    .optional(),
});

const addMembersSchema = Joi.object({
  members: Joi.array()
    .items(Joi.string().custom(objectIdValidation))
    .min(1)
    .optional()
    .messages({
      "array.base": "Members must be an array of user IDs",
      "array.min": "At least one member is required",
    }),
  managers: Joi.array()
    .items(Joi.string().custom(objectIdValidation))
    .min(1)
    .optional()
    .messages({
      "array.base": "Managers must be an array of user IDs",
      "array.min": "At least one manager is required",
    }),
}).or("members", "managers").messages({
  "object.missing": "At least one of members or managers is required",
});

const removeMembersSchema = Joi.object({
  members: Joi.array()
    .items(Joi.string().custom(objectIdValidation))
    .min(1)
    .optional()
    .messages({
      "array.base": "Members must be an array of user IDs",
      "array.min": "At least one member is required",
    }),
  managers: Joi.array()
    .items(Joi.string().custom(objectIdValidation))
    .min(1)
    .optional()
    .messages({
      "array.base": "Managers must be an array of user IDs",
      "array.min": "At least one manager is required",
    }),
}).or("members", "managers").messages({
  "object.missing": "At least one of members or managers is required",
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  addMembersSchema,
  removeMembersSchema,
};
