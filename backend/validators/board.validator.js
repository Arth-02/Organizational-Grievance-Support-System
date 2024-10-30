const Joi = require("joi");

// Define validation schema for Task updates
const taskUpdateSchema = Joi.object({
  tag: Joi.string(),
  title: Joi.string(),
  description: Joi.string(),
  due_date: Joi.date().allow(null),
  assignee: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)),
  attachments: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)),
  created_by: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  priority: Joi.string().valid("low", "medium", "high"),
  is_active: Joi.boolean(),
});

// Define validation schema for Board updates
const updateBoardSchema = Joi.object({
  tags: Joi.array().items(Joi.string()),
  tasks: Joi.array().items(taskUpdateSchema),
  is_active: Joi.boolean(),
});

module.exports = { updateBoardSchema };
