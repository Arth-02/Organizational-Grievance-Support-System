const {
  successResponse,
  errorResponse,
  catchResponse,
} = require("../utils/response");
const dashboardService = require("../services/dashboard.service");

/**
 * Get dashboard stats for current user
 */
const getDashboardStats = async (req, res) => {
  try {
    const result = await dashboardService.getDashboardStats(req.user);
    if (!result.isSuccess) {
      return errorResponse(res, result.code || 400, result.message);
    }
    return successResponse(res, result.data, "Dashboard stats fetched successfully");
  } catch (err) {
    console.error("Get Dashboard Stats Error:", err);
    return catchResponse(res);
  }
};

module.exports = {
  getDashboardStats,
};
