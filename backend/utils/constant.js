const SUPER_ADMIN = "SUPER_ADMIN";
const ADMIN = "ADMIN";
const DEV = "DEV";
const CREATE_USER = {
  name: "Create User",
  slug: "CREATE_USER",
};
const UPDATE_USER = {
  name: "Update User",
  slug: "UPDATE_USER",
};
const DELETE_USER = {
  name: "Delete User",
  slug: "DELETE_USER",
};
const VIEW_USER = {
  name: "View User",
  slug: "VIEW_USER",
};
const UPDATE_USER_ROLE = {
  name: "Update User Role",
  slug: "UPDATE_USER_ROLE",
};
const UPDATE_GRIEVANCE = {
  name: "Update Grievance",
  slug: "UPDATE_GRIEVANCE",
};
const DELETE_GRIEVANCE = {
  name: "Delete Grievance",
  slug: "DELETE_GRIEVANCE",
};
const CREATE_DEPARTMENT = {
  name: "Create Department",
  slug: "CREATE_DEPARTMENT",
};
const UPDATE_DEPARTMENT = {
  name: "Update Department",
  slug: "UPDATE_DEPARTMENT",
};
const DELETE_DEPARTMENT = {
  name: "Delete Department",
  slug: "DELETE_DEPARTMENT",
};
const UPDATE_ORGANIZATION = {
  name: "Update Organization",
  slug: "UPDATE_ORGANIZATION",
};
const DELETE_ORGANIZATION = {
  name: "Delete Organization",
  slug: "DELETE_ORGANIZATION",
};
const CREATE_ROLE = {
  name: "Create Role",
  slug: "CREATE_ROLE",
};
const UPDATE_ROLE = {
  name: "Update Role",
  slug: "UPDATE_ROLE",
};
const DELETE_ROLE = {
  name: "Delete Role",
  slug: "DELETE_ROLE",
};
const VIEW_ROLE = {
  name: "View Role",
  slug: "VIEW_ROLE",
};
const UPDATE_PERMISSION = {
  name: "Update Permission",
  slug: "UPDATE_PERMISSION",
};
const VIEW_PERMISSION = {
  name: "View Permission",
  slug: "VIEW_PERMISSION",
};
const VIEW_DEPARTMENT = {
  name: "View Department",
  slug: "VIEW_DEPARTMENT",
};
const UPDATE_GRIEVANCE_ASSIGNEE = {
  name: "Update Grievance Assignee",
  slug: "UPDATE_GRIEVANCE_ASSIGNEE",
};
const CREATE_PROJECT = {
  name: "Create Project",
  slug: "CREATE_PROJECT",
};
const UPDATE_PROJECT = {
  name: "Update Project",
  slug: "UPDATE_PROJECT",
};
const DELETE_PROJECT = {
  name: "Delete Project",
  slug: "DELETE_PROJECT",
};
const VIEW_PROJECT = {
  name: "View Project",
  slug: "VIEW_PROJECT",
};

const PERMISSIONS = [
  CREATE_USER,
  UPDATE_USER,
  DELETE_USER,
  VIEW_USER,
  UPDATE_USER_ROLE,
  UPDATE_GRIEVANCE,
  DELETE_GRIEVANCE,
  CREATE_DEPARTMENT,
  UPDATE_DEPARTMENT,
  DELETE_DEPARTMENT,
  UPDATE_ORGANIZATION,
  DELETE_ORGANIZATION,
  CREATE_ROLE,
  UPDATE_ROLE,
  DELETE_ROLE,
  VIEW_ROLE,
  UPDATE_PERMISSION,
  VIEW_PERMISSION,
  VIEW_DEPARTMENT,
  UPDATE_GRIEVANCE_ASSIGNEE,
  CREATE_PROJECT,
  UPDATE_PROJECT,
  DELETE_PROJECT,
  VIEW_PROJECT,
];

const DEFAULT_ADMIN_PERMISSIONS = [
  "CREATE_USER",
  "UPDATE_USER",
  "DELETE_USER",
  "VIEW_USER",
  "UPDATE_USER_ROLE",
  "UPDATE_GRIEVANCE",
  "DELETE_GRIEVANCE",
  "CREATE_DEPARTMENT",
  "UPDATE_DEPARTMENT",
  "DELETE_DEPARTMENT",
  "UPDATE_ORGANIZATION",
  "DELETE_ORGANIZATION",
  "CREATE_ROLE",
  "UPDATE_ROLE",
  "DELETE_ROLE",
  "VIEW_ROLE",
  "UPDATE_PERMISSION",
  "VIEW_PERMISSION",
  "VIEW_DEPARTMENT",
  "UPDATE_GRIEVANCE_ASSIGNEE",
  "CREATE_PROJECT",
  "UPDATE_PROJECT",
  "DELETE_PROJECT",
  "VIEW_PROJECT",
];

module.exports = {
  DEV,
  SUPER_ADMIN,
  ADMIN,
  PERMISSIONS,
  CREATE_USER,
  UPDATE_USER,
  DELETE_USER,
  VIEW_USER,
  CREATE_ROLE,
  UPDATE_ROLE,
  UPDATE_USER_ROLE,
  DELETE_ROLE,
  VIEW_ROLE,
  UPDATE_GRIEVANCE,
  UPDATE_GRIEVANCE_ASSIGNEE,
  DELETE_GRIEVANCE,
  CREATE_DEPARTMENT,
  VIEW_DEPARTMENT,
  UPDATE_DEPARTMENT,
  DELETE_DEPARTMENT,
  UPDATE_ORGANIZATION,
  DELETE_ORGANIZATION,
  DEFAULT_ADMIN_PERMISSIONS,
  UPDATE_PERMISSION,
  VIEW_PERMISSION,
  CREATE_PROJECT,
  UPDATE_PROJECT,
  DELETE_PROJECT,
  VIEW_PROJECT,
};
