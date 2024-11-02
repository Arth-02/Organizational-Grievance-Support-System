const Joi = require("joi");

// Define validation schema for Task updates
const taskUpdateSchema = Joi.object({
  tag: Joi.string(),
  title: Joi.string(),
  description: Joi.string(),
  due_date: Joi.date().allow(null),
  assignee_to: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)),
  attachments: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)),
  created_by: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  priority: Joi.string().valid("low", "medium", "high"),
  is_active: Joi.boolean(),
});

const createBoardSchema = Joi.object({
  name: Joi.string().required(),
});

const updateBoardSchema = Joi.object({
  name: Joi.string(),
  is_active: Joi.boolean(),
});

const addAndDeleteBoardTagSchema = Joi.object({
  tag: Joi.string().required(),
});

// Define validation schema for Board updates
const updateBoardTagSchema = Joi.object({
  oldtag: Joi.string().required(),
  newtag: Joi.string().required(),
});

module.exports = {
  createBoardSchema,
  updateBoardSchema,
  addAndDeleteBoardTagSchema,
  updateBoardTagSchema,
  taskUpdateSchema,
};
