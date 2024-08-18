const {
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAllOrganizationDepartments,
  getDepartmentById,
} = require("../controllers/department.controller");
const { checkPermission, isLoggedIn } = require("../middlewares/auth.middleware");

const router = require("express").Router();

router.get("/details/:id", isLoggedIn, getDepartmentById);
router.post("/create", checkPermission([9]), createDepartment);
router.patch("/update/:id", checkPermission([10]), updateDepartment);
router.delete("/delete/:id", checkPermission([11]), deleteDepartment);

module.exports = router;
