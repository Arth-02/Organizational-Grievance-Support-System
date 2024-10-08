const {
  createGrievance,
  updateGrievance,
  getGrievanceById,
  updateGrievanceAttachment,
  deleteGrievanceById,
} = require("../controllers/grievance.controller");
const upload = require("../helpers/multer");
const {
  checkPermission,
  isLoggedIn,
} = require("../middlewares/auth.middleware");
const router = require("express").Router();

router.post(
  "/create",
  isLoggedIn,
  upload.array("attachments", 5),
  createGrievance
);
router.put(
  "/update/:id",
  checkPermission([
    "UPDATE_GRIEVANCE",
    "UPDATE_GRIEVANCE_STATUS",
    "UPDATE_GRIEVANCE_ASSIGNEE",
  ]),
  updateGrievance
);
router.get("/details/:id", isLoggedIn, getGrievanceById);
router.put(
  "/update/attachment/:id",
  isLoggedIn,
  upload.array("attachments", 5),
  updateGrievanceAttachment
);
router.delete(
  "/delete/:id",
  checkPermission(["DELETE_GRIEVANCE"]),
  deleteGrievanceById
);

module.exports = router;
