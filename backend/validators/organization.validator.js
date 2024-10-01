const Joi = require("joi");

const organizationSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().trim().email().required(),
  website: Joi.string().trim().required(),
  logo: Joi.object(),
  description: Joi.string().trim().required(),
  city: Joi.string().trim().required(),
  state: Joi.string().trim().required(),
  country: Joi.string().trim().required(),
  pincode: Joi.string().trim().required(),
  phone: Joi.string().trim().required(),
  address: Joi.string().trim().required(),
});

const updateOrganizationSchema = Joi.object({
  name: Joi.string().trim(),
  website: Joi.string().trim(),
  logo: Joi.string().trim(),
  description: Joi.string().trim(),
  city: Joi.string().trim(),
  state: Joi.string().trim(),
  country: Joi.string().trim(),
  pincode: Joi.string().trim(),
  phone: Joi.string().trim(),
  address: Joi.string().trim(),
});

module.exports = {
  organizationSchema,
  updateOrganizationSchema
};
