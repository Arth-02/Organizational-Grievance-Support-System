const {
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAllDepartment,
  getDepartmentById,
  getAllDepartmentName,
  getUsersCountByDepartmentId,
} = require("../controllers/department.controller");
const {
  checkPermission,
  isLoggedIn,
} = require("../middlewares/auth.middleware");
const {
  CREATE_DEPARTMENT,
  UPDATE_DEPARTMENT,
  DELETE_DEPARTMENT,
} = require("../utils/constant");

const router = require("express").Router();

router.get("/details/:id", isLoggedIn, getDepartmentById);
router.get("/all", isLoggedIn, getAllDepartment);
router.get("/names", isLoggedIn, getAllDepartmentName);
router.post(
  "/create",
  checkPermission([CREATE_DEPARTMENT.slug]),
  createDepartment
);
router.patch(
  "/update/:id",
  checkPermission([UPDATE_DEPARTMENT.slug]),
  updateDepartment
);
router.delete(
  "/delete/:id",
  checkPermission([DELETE_DEPARTMENT.slug]),
  deleteDepartment
);
router.get("/users-count/:id", isLoggedIn, getUsersCountByDepartmentId);

module.exports = router;
