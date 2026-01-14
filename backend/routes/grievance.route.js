const {
  createGrievance,
  updateGrievance,
  getGrievanceById,
  updateGrievanceAttachment,
  deleteGrievanceById,
  getAllGrievances,
  updateGrievanceAssignee,
  updateGrievanceStatus,
} = require("../controllers/grievance.controller");
const upload = require("../utils/multer");
const {
  checkPermission,
  isLoggedIn,
} = require("../middlewares/auth.middleware");
const {
  checkSubscriptionLimit,
} = require("../middlewares/subscription.middleware");
const {
  DELETE_GRIEVANCE,
  UPDATE_GRIEVANCE_ASSIGNEE,
  UPDATE_GRIEVANCE,
} = require("../utils/constant");
const router = require("express").Router();

router.post(
  "/create",
  isLoggedIn,
  checkSubscriptionLimit('storage'),
  upload.array("attachments", 5),
  createGrievance
);

router.get("/details/:id", isLoggedIn, getGrievanceById);
router.patch(
  "/update/attachment/:id",
  isLoggedIn,
  checkSubscriptionLimit('storage'),
  upload.array("attachments", 5),
  updateGrievanceAttachment
);
router.delete(
  "/delete/:id",
  checkPermission([DELETE_GRIEVANCE.slug]),
  deleteGrievanceById
);

router.get("/all", isLoggedIn, getAllGrievances);
router.patch("/update/:id", isLoggedIn, updateGrievance);
router.patch(
  "/updateassignee/:id",
  checkPermission([UPDATE_GRIEVANCE_ASSIGNEE.slug, UPDATE_GRIEVANCE.slug]),
  updateGrievanceAssignee
);
router.patch("/updatestatus/:id", isLoggedIn, updateGrievanceStatus);

module.exports = router;
