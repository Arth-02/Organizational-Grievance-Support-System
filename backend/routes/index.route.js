const router = require("express").Router();
const userRoutes = require("./user.route");
const roleRoutes = require("./role.route");
const organizationRoutes = require("./organization.route");
const superAdminRoutes = require("./super.admin.route");

router.use("/users", userRoutes);
router.use("/roles", roleRoutes);
router.use("/organizations", organizationRoutes);
router.use("/super-admin", superAdminRoutes);

module.exports = router;
