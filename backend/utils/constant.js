const ADMIN = "admin";
const HR = "hr";
const EMPLOYEE = "employee";
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
];

const DEFAULT_ADMIN_PERMISSIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

module.exports = {
  ADMIN,
  HR,
  EMPLOYEE,
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
  DEFAULT_ADMIN_PERMISSIONS,
};
