const Joi = require("joi");
const { objectIdValidation } = require("../utils");

// Column key validation: alphanumeric with hyphens allowed
const columnKeyPattern = /^[a-zA-Z0-9-]+$/;

const columnSchema = Joi.object({
  key: Joi.string()
    .trim()
    .pattern(columnKeyPattern)
    .required()
    .messages({
      "string.empty": "Column key is required",
      "string.pattern.base": "Column key must be alphanumeric with hyphens allowed",
      "any.required": "Column key is required",
    }),
  label: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      "string.empty": "Column label is required",
      "string.min": "Column label must not be empty",
      "string.max": "Column label must not exceed 100 characters",
      "any.required": "Column label is required",
    }),
  order: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      "number.base": "Column order must be a number",
      "number.integer": "Column order must be an integer",
      "number.min": "Column order must be at least 0",
      "any.required": "Column order is required",
    }),
});

const createBoardSchema = Joi.object({
  project_id: Joi.string()
    .custom(objectIdValidation)
    .required()
    .messages({
      "string.empty": "Project ID is required",
      "any.required": "Project ID is required",
    }),
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      "string.empty": "Board name is required",
      "string.min": "Board name must not be empty",
      "string.max": "Board name must not exceed 100 characters",
      "any.required": "Board name is required",
    }),
  columns: Joi.array()
    .items(columnSchema)
    .min(1)
    .unique("key")
    .required()
    .messages({
      "array.base": "Columns must be an array",
      "array.min": "At least one column is required",
      "array.unique": "Column keys must be unique",
      "any.required": "Columns are required",
    }),
});

const updateBoardSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      "string.min": "Board name must not be empty",
      "string.max": "Board name must not exceed 100 characters",
    }),
  columns: Joi.array()
    .items(columnSchema)
    .min(1)
    .unique("key")
    .optional()
    .messages({
      "array.base": "Columns must be an array",
      "array.min": "At least one column is required",
      "array.unique": "Column keys must be unique",
    }),
  is_active: Joi.boolean()
    .optional()
    .messages({
      "boolean.base": "is_active must be a boolean",
    }),
});

module.exports = {
  createBoardSchema,
  updateBoardSchema,
  columnSchema,
};
