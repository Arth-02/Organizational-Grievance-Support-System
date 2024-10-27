const { createProject, updateProject, getAllProjects } = require("../controllers/project.controller");
const { checkPermission, isLoggedIn } = require("../middlewares/auth.middleware");
const { CREATE_PROJECT, VIEW_PROJECT } = require("../utils/constant");

const router = require("express").Router();

router.get("/all",checkPermission([VIEW_PROJECT.slug]), getAllProjects);
router.post("/create",checkPermission([CREATE_PROJECT.slug]), createProject);
router.patch("/update/:id",isLoggedIn, updateProject);

module.exports = router;