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
router.post("/create", checkPermission(["CREATE_DEPARTMENT"]), createDepartment);
router.patch("/update/:id", checkPermission(["UPDATE_DEPARTMENT"]), updateDepartment);
router.delete("/delete/:id", checkPermission(["DELETE_DEPARTMENT"]), deleteDepartment);

module.exports = router;
