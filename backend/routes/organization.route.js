const { createOrganization, updateOrganization } = require("../controllers/organization.controller");
const router = require("express").Router();

router.post("/create", createOrganization);
router.post("/update", updateOrganization);

module.exports = router;