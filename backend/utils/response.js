const successResponse = (res, data, message) => {
  return res.status(200).json({ data, message: message, success: true });
};
const errorResponse = (res,status_code, message) => {
  return res.status(status_code).json({error: message, success: false });
};
const catchResponse = (res) => {
  return res.status(500).json({ error: "Internal Server Error", success: false });
};


module.exports = {
  successResponse,
  errorResponse,
  catchResponse,
};