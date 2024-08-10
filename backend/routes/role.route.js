const { resetPermissions, createRole, updateRole, deleteRole, getRoleById, getAllOrganizationsRoles } = require("../controllers/role.controller");
const { checkPermission, verifyOrganization } = require("../middlewares/auth.middleware");
const { route } = require("./department.route");
const router = require("express").Router();

router.get("/reset-permissions", resetPermissions);
router.post("/details/:id",checkPermission([16]), verifyOrganization, getRoleById);
router.post("/all",checkPermission([16]), verifyOrganization, getAllOrganizationsRoles);
router.post("/create",checkPermission([13]), verifyOrganization,createRole);
router.patch("/update/:id",checkPermission([14]), verifyOrganization,updateRole);
router.delete("/delete/:id",checkPermission([15]), verifyOrganization,deleteRole);

module.exports = router;