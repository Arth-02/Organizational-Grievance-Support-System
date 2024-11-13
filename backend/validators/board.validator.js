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

module.exports = {
  createBoardSchema,
  updateBoardSchema,
  addAndDeleteBoardTagSchema,
  updateBoardTagSchema,
};
