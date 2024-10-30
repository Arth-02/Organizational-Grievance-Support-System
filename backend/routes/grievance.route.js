const {
  createGrievance,
  updateGrievance,
  getGrievanceById,
  updateGrievanceAttachment,
  deleteGrievanceById,
  getAllGrievances,
} = require("../controllers/grievance.controller");
const upload = require("../utils/multer");
const {
  checkPermission,
  isLoggedIn,
} = require("../middlewares/auth.middleware");
const {
  UPDATE_GRIEVANCE,
  UPDATE_GRIEVANCE_ASSIGNEE,
  UPDATE_GRIEVANCE_STATUS,
  DELETE_GRIEVANCE,
} = require("../utils/constant");
const router = require("express").Router();

router.post(
  "/create",
  isLoggedIn,
  upload.array("attachments", 5),
  createGrievance
);

router.get("/details/:id", isLoggedIn, getGrievanceById);
router.patch(
  "/update/attachment/:id",
  isLoggedIn,
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

module.exports = router;
