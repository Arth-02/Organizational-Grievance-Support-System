const { verifyOrganization } = require("../controllers/super.admin.controller");
const { checkRole } = require("../middlewares/admin.middleware");
const { SUPER_ADMIN } = require("../utils/constant");

const router = require("express").Router();

router.post("/verify-organization", checkRole([SUPER_ADMIN]) , verifyOrganization);

module.exports = router;