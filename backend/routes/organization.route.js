const {
  createOrganization,
  updateOrganization,
  getOrganizationById,
} = require("../controllers/organization.controller");
const upload = require("../helpers/multer");
const { isLoggedIn } = require("../middlewares/auth.middleware");
const router = require("express").Router();

router.post("/create", upload.array("logo", 1), createOrganization);
router.post("/update", updateOrganization);
router.get("/details/:id", isLoggedIn, getOrganizationById);

module.exports = router;
