const {
  createOrganization,
  updateOrganization,
  getOrganizationById,
} = require("../controllers/organization.controller");
const upload = require("../utils/multer");
const {
  isLoggedIn,
  checkPermission,
} = require("../middlewares/auth.middleware");
const { UPDATE_ORGANIZATION } = require("../utils/constant");
const router = require("express").Router();

router.post("/create", upload.array("logo", 1), createOrganization);
router.post(
  "/update",
  checkPermission([UPDATE_ORGANIZATION.slug]),
  updateOrganization
);
router.get("/details/:id", isLoggedIn, getOrganizationById);

module.exports = router;
