const objectIdValidation = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message(
      `Invalid ObjectId of ${helpers.state.path.join(".")}`
    );
  }
  return value;
};

module.exports = { objectIdValidation };