const { approveOrganization } = require("../controllers/dev.controller");
const { checkRole } = require("../middlewares/auth.middleware");
const { DEV } = require("../utils/constant");

const router = require("express").Router();

router.post("/verify-organization", checkRole([DEV]) , approveOrganization);

module.exports = router;