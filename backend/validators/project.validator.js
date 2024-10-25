const Joi = require("joi");
const mongoose = require("mongoose");

const objectIdValidation = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ObjectId");
  }
  return value;
};

const createProjectSchema = Joi.object({
  name: Joi.string().trim().required(),
  description: Joi.string().trim().required(),
  start_date: Joi.date().default(Date.now),
  end_date: Joi.date().optional().allow(""),
  manager: Joi.string().custom(objectIdValidation),
  members: Joi.array().items(Joi.string().custom(objectIdValidation)),
  is_active: Joi.boolean().default(true),
});

const updateProjectSchema = Joi.object({
  name: Joi.string().trim().optional(),
  description: Joi.string().trim().optional(),
  start_date: Joi.date().optional(),
  end_date: Joi.date().optional().allow(""),
  manager: Joi.string().custom(objectIdValidation).optional(),
  members: Joi.array()
    .items(Joi.string().custom(objectIdValidation))
    .optional(),
  is_active: Joi.boolean().optional(),
});

module.exports = { createProjectSchema, updateProjectSchema };
