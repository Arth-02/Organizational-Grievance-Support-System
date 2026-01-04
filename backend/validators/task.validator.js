const Joi = require("joi");
const { objectIdValidation } = require("../utils");

const addTaskSchema = Joi.object({
  tag: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().required(),
  due_date: Joi.date(),
  assignee_to: Joi.array().items(Joi.string().custom(objectIdValidation).label("assignee_to")),
  attachments: Joi.array().items(Joi.object()),
  priority: Joi.string().valid("low", "medium", "high").required(),
});

const updateTaskSchema = Joi.object({
  tag: Joi.string(),
  title: Joi.string(),
  description: Joi.string(),
  due_date: Joi.date(),
  assignee_to: Joi.array().items(Joi.string().custom(objectIdValidation).label("assignee_to")),
  created_by: Joi.string().custom(objectIdValidation).label("created_by"),
  priority: Joi.string().valid("low", "medium", "high"),
  prevRank: Joi.string().allow(null),
  nextRank: Joi.string().allow(null),
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
