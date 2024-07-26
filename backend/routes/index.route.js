const router = require("express").Router();
const userRoutes = require("./user.route");
const roleRoutes = require("./role.route");

router.use("/users", userRoutes);
router.use("/roles", roleRoutes);

module.exports = router;
