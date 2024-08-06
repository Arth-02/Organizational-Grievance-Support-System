const router = require("express").Router();
const userRoutes = require("./user.route");
const roleRoutes = require("./role.route");
const organizationRoutes = require("./organization.route");
const devRoutes = require("./dev.route");

router.use("/users", userRoutes);
router.use("/roles", roleRoutes);
router.use("/organizations", organizationRoutes);
router.use("/super-admin", devRoutes);

module.exports = router;
