const successResponse = (res, data, message, status_code = 200) => {
  return res.status(status_code).json({ data, message: message, success: 1 });
};

const errorResponse = (res, status_code, message, errors) => {
  console.log("Error:", message);
  return res.status(status_code).json({message: message, success: 0, errors });
};

const catchResponse = (res) => {
  console.log("Catch Error");
  return res.status(500).json({ message: "Internal Server Error", success: 1 });
};

module.exports = {
  successResponse,
  errorResponse,
  catchResponse,
};