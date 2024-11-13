const Joi = require("joi");

const addTaskSchema = Joi.object({
  tag: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().required(),
  due_date: Joi.date(),
  assignee_to: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)),
  attachments: Joi.array().items(Joi.object()),
  priority: Joi.string().valid("low", "medium", "high").required(),
});

const updateTaskSchema = Joi.object({
  tag: Joi.string(),
  title: Joi.string(),
  description: Joi.string(),
  due_date: Joi.date(),
  assignee_to: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  created_by: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  priority: Joi.string().valid("low", "medium", "high"),
});

const updateTaskAttachmentchema = Joi.object({
  attachments: Joi.array().items(Joi.object()),
  delete_attachments: Joi.array().items(Joi.string()),
});

const updateTaskSubmissionSchema = Joi.object({
  is_submitted: Joi.boolean().required(),
});

const updateTaskFinishSchema = Joi.object({
  is_finished: Joi.boolean().required(),
});

module.exports = {
  addTaskSchema,
  updateTaskSchema,
  updateTaskAttachmentchema,
  updateTaskSubmissionSchema,
  updateTaskFinishSchema,
};
