const mongoose = require("mongoose");

const objectIdValidation = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message(
      `Invalid ObjectId of ${helpers.state.path[0]}`
    );
  }
  return value;
};

module.exports = { objectIdValidation };