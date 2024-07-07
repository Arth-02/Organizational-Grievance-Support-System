const successResponse = (res, data, message) => {
  return res.status(200).json({ data, message: message, success: 1 });
};

const errorResponse = (res, status_code, message) => {
  console.log("Error:", message);
  return res.status(status_code).json({message: message, success: 0 });
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