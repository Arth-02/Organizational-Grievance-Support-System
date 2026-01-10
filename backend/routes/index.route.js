const router = require("express").Router();
const userRoutes = require("./user.route");
const roleRoutes = require("./role.route");
const organizationRoutes = require("./organization.route");
const departmentRoutes = require("./department.route");
const devRoutes = require("./dev.route");
const grievanceRoutes = require("./grievance.route");

router.use("/users", userRoutes);
router.use("/roles", roleRoutes);
router.use("/organizations", organizationRoutes);
router.use("/departments", departmentRoutes);
router.use("/super-admin", devRoutes);
router.use("/grievances", grievanceRoutes);

module.exports = router;
