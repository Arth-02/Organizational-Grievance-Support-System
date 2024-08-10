const {
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAllDepartments,
  getDepartmentById,
} = require("../controllers/department.controller");
const { checkPermission, isLoggedIn, verifyOrganization } = require("../middlewares/auth.middleware");

const router = require("express").Router();

router.get("/details/:id", isLoggedIn,verifyOrganization, getDepartmentById);
router.post("/create", checkPermission([9]), verifyOrganization, createDepartment);
router.put("/update/:id", checkPermission([10]), verifyOrganization, updateDepartment);
router.delete("/delete/:id", checkPermission([11]), verifyOrganization, deleteDepartment);

module.exports = router;
