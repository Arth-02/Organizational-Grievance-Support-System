const { resetPermissions } = require("../controllers/role.controller");
const router = require("express").Router();

router.get("/reset-permissions",resetPermissions);

module.exports = router;