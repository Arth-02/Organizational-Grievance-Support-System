const {
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/department.controller");
const { checkPermission } = require("../middlewares/auth.middleware");

const router = require("express").Router();

router.post("/create", checkPermission([9]), createDepartment);
router.put("/update/:id", checkPermission([10]), updateDepartment);
router.delete("/delete/:id", checkPermission([11]), deleteDepartment);

module.exports = router;
