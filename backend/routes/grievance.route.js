const {
  createGrievance,
  updateGrievance,
  deleteGrievance,
  getGrievance,
} = require("../controllers/grievance.controller");
const upload = require("../helpers/upload");
const { checkPermission, isLoggedIn } = require("../middlewares/auth.middleware");
const router = require("express").Router();

router.post("/create",isLoggedIn,createGrievance);
router.put("/update/:id", updateGrievance);
router.delete("/delete/:id", deleteGrievance);
router.get("/get/:id", getGrievance);

module.exports = router;
