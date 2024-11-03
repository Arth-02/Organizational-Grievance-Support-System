const Joi = require("joi");

const createBoardSchema = Joi.object({
  name: Joi.string().required(),
});

const updateBoardSchema = Joi.object({
  name: Joi.string(),
});

const addAndDeleteBoardTagSchema = Joi.object({
  tag: Joi.string().required(),
});

// Define validation schema for Board updates
const updateBoardTagSchema = Joi.object({
  oldtag: Joi.string().required(),
  newtag: Joi.string().required(),
});

const addBoardTaskSchema = Joi.object({
  tag: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().required(),
  due_date: Joi.date(),
  assignee_to: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)),
  attachments: Joi.array().items(Joi.object()),
  created_by: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  priority: Joi.string().valid("low", "medium", "high").required(),
});

const updateBoardTaskSchema = Joi.object({
  tag: Joi.string(),
  title: Joi.string(),
  description: Joi.string(),
  due_date: Joi.date(),
  assignee_to: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)),
  created_by: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  priority: Joi.string().valid("low", "medium", "high"),
});

const updateBoardTaskAttachmentchema = Joi.object({
  attachments: Joi.array().items(Joi.object()),
  delete_attachments: Joi.array().items(Joi.string()),
});


module.exports = {
  createBoardSchema,
  updateBoardSchema,
  addAndDeleteBoardTagSchema,
  updateBoardTagSchema,
  addBoardTaskSchema,
  updateBoardTaskSchema,
  updateBoardTaskAttachmentchema,
};
