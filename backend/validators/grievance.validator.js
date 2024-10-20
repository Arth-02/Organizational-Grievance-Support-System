const Joi = require("joi");

const createGrievanceSchema = Joi.object({
  title: Joi.string().min(5).max(100).required(),
  department_id: Joi.string().length(24).required(),
  description: Joi.string().min(10).max(1000).required(),
  priority: Joi.string().valid("low", "medium", "high").required(),
  attachments: Joi.array().items(Joi.object()),
  status: Joi.string()
    .valid(
      "submitted",
      "in-progress",
      "resolved",
      "dismissed"
    )
    .default("submitted")
    .required(),
});

const updateFullGrievanceSchema = Joi.object({
  title: Joi.string().min(5).max(100),
  description: Joi.string().min(10).max(1000),
  department_id: Joi.string(),
  priority: Joi.string().valid("low", "medium", "high"),
  status: Joi.string().valid(
    "submitted",
    "in-progress",
    "resolved",
    "dismissed"
  ),
  is_active: Joi.boolean(),
  assigned_to: Joi.string().length(24),
});

const updateAssignedGrievanceSchema = Joi.object({
  assigned_to: Joi.string().length(24).required(),
});

const updateStatusGrievanceSchema = Joi.object({
  status: Joi.string()
    .valid(
      "submitted",
      "in-progress",
      "resolved",
      "dismissed"
    )
    .required(),
});

const updateMyGrievanceSchema = Joi.object({
  title: Joi.string().min(5).max(100),
  description: Joi.string().min(10).max(1000),
  priority: Joi.string().valid("low", "medium", "high"),
});

const updateGrievanceAttachmentSchema = Joi.object({
  attachments: Joi.array().items(Joi.object()),
  delete_attachments: Joi.array().items(Joi.string()),
});

module.exports = {
  createGrievanceSchema,
  updateFullGrievanceSchema,
  updateAssignedGrievanceSchema,
  updateStatusGrievanceSchema,
  updateGrievanceAttachmentSchema,
  updateMyGrievanceSchema,
};
