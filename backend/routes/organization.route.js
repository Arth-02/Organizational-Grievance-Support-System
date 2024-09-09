const { createOrganization, updateOrganization } = require("../controllers/organization.controller");
const upload = require("../helpers/multer");
const router = require("express").Router();

router.post("/create",upload.array("logo",1) ,createOrganization);
router.post("/update", updateOrganization);

module.exports = router;