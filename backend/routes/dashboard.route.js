const router = require("express").Router();
const { getDashboardStats } = require("../controllers/dashboard.controller");
const { isLoggedIn } = require("../middlewares/auth.middleware");

// Dashboard routes
router.get("/stats", isLoggedIn, getDashboardStats);

module.exports = router;
