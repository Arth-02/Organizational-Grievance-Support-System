const SUPER_ADMIN = "super_admin";
const DEV = "dev";
const ADD_USER = {
  name: "Add User",
  id: 1,
};
const UPDATE_USER = {
  name: "Update User",
  id: 2,
};
const DELETE_USER = {
  name: "Delete User",
  id: 3,
};
const VIEW_USER = {
  name: "View User",
  id: 4,
};
const UPDATE_USER_ROLE = {
  name: "Update User Role",
  id: 5,
};
const UPDATE_GRIEVANCE = {
  name: "Update Grievance",
  id: 6,
};
const DELETE_GRIEVANCE = {
  name: "Delete Grievance",
  id: 7,
};
const UPDATE_GRIEVANCE_STATUS = {
  name: "Update Grievance Status",
  id: 8,
};
const ADD_DEPARTMENT = {
  name: "Add Department",
  id: 9,
};
const UPDATE_DEPARTMENT = {
  name: "Update Department",
  id: 10,
};
const DELETE_DEPARTMENT = {
  name: "Delete Department",
  id: 11,
};
const UPDATE_ORGANIZATION = {
  name: "Update Organization",
  id: 12,
};
const CREATE_ROLE = {
  name: "Create Role",
  id: 13,
};
const UPDATE_ROLE = {
  name: "Update Role",
  id: 14,
};
const DELETE_ROLE = {
  name: "Delete Role",
  id: 15,
};
const VIEW_ROLE = {
  name: "View Role",
  id: 16,
};
const UPDATE_PERMISSION = {
  name: "Add or Remove Permission",
  id: 17,
};
const VIEW_PERMISSION = {
  name: "View Permission",
  id: 18,
};

const PERMISSIONS = [
  ADD_USER,
  UPDATE_USER,
  DELETE_USER,
  VIEW_USER,
  UPDATE_USER_ROLE,
  UPDATE_GRIEVANCE,
  DELETE_GRIEVANCE,
  UPDATE_GRIEVANCE_STATUS,
  ADD_DEPARTMENT,
  UPDATE_DEPARTMENT,
  DELETE_DEPARTMENT,
  UPDATE_ORGANIZATION,
  CREATE_ROLE,
  UPDATE_ROLE,
  DELETE_ROLE,
  VIEW_ROLE,
  UPDATE_PERMISSION,
  VIEW_PERMISSION,
];

const DEFAULT_ADMIN_PERMISSIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

module.exports = {
  DEV,
  SUPER_ADMIN,
  PERMISSIONS,
  ADD_USER,
  UPDATE_USER,
  DELETE_USER,
  VIEW_USER,
  UPDATE_USER_ROLE,
  UPDATE_GRIEVANCE,
  DELETE_GRIEVANCE,
  UPDATE_GRIEVANCE_STATUS,
  ADD_DEPARTMENT,
  UPDATE_DEPARTMENT,
  DELETE_DEPARTMENT,
  UPDATE_ORGANIZATION,
  DEFAULT_ADMIN_PERMISSIONS
};
