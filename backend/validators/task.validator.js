const Joi = require("joi");

const addBoardTaskSchema = Joi.object({
  tag: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().required(),
  due_date: Joi.date(),
  assignee_to: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)),
  attachments: Joi.array().items(Joi.object()),
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
  addBoardTaskSchema,
  updateBoardTaskSchema,
  updateBoardTaskAttachmentchema,
};
