const Grievance = require("../models/grievance.model");
const Task = require("../models/task.model");
const Project = require("../models/project.model");
const User = require("../models/user.model");
const Department = require("../models/department.model");
const Role = require("../models/role.model");

/**
 * Get dashboard stats based on user permissions
 * @param {Object} user - Current user (from isLoggedIn middleware with role populated)
 * @returns {Object} - Dashboard stats
 */
const getDashboardStats = async (user) => {
  try {
    const { _id: userId, organization_id, role, special_permissions } = user;

    // Role is already populated by isLoggedIn middleware with name and permissions
    // permissions is an array of permission slugs (strings)
    const rolePermissions = role?.permissions || [];
    const allPermissions = [
      ...new Set([...rolePermissions, ...(special_permissions || [])]),
    ];

    // Stats object to build
    const stats = {
      user: {
        name: user.firstname ? `${user.firstname} ${user.lastname}` : user.username,
        role: role?.name || "User",
      },
    };

    // Grievance stats - everyone can see their own grievances
    const grievanceBase = { organization_id };
    const [myGrievances, assignedGrievances, openGrievances] = await Promise.all([
      Grievance.countDocuments({ ...grievanceBase, created_by: userId }),
      Grievance.countDocuments({ ...grievanceBase, assigned_to: userId }),
      Grievance.countDocuments({
        ...grievanceBase,
        $or: [{ created_by: userId }, { assigned_to: userId }],
        status: { $ne: "closed" },
      }),
    ]);

    stats.grievances = {
      created: myGrievances,
      assigned: assignedGrievances,
      open: openGrievances,
    };

    // Task stats - only if user has tasks or VIEW_PROJECT
    const taskBase = {};
    const hasProjectAccess = allPermissions.includes("VIEW_PROJECT");

    const [assignedTasks, overdueTasks, completedTasks] = await Promise.all([
      Task.countDocuments({ assignee: userId }),
      Task.countDocuments({
        assignee: userId,
        due_date: { $lt: new Date() },
        status: { $nin: ["done", "completed", "closed"] },
      }),
      Task.countDocuments({
        assignee: userId,
        status: { $in: ["done", "completed", "closed"] },
      }),
    ]);

    stats.tasks = {
      assigned: assignedTasks,
      overdue: overdueTasks,
      completed: completedTasks,
    };

    // Project stats - if user has VIEW_PROJECT permission
    if (hasProjectAccess) {
      const projectCount = await Project.countDocuments({
        organization_id,
        deleted_at: null,
      });
      stats.projects = {
        total: projectCount,
      };
    }

    // Employee stats - if user has VIEW_USER permission
    if (allPermissions.includes("VIEW_USER")) {
      const [totalEmployees, activeEmployees] = await Promise.all([
        User.countDocuments({ organization_id, is_deleted: false }),
        User.countDocuments({ organization_id, is_deleted: false, is_active: true }),
      ]);
      stats.employees = {
        total: totalEmployees,
        active: activeEmployees,
      };
    }

    // Department stats - if user has VIEW_DEPARTMENT permission
    if (allPermissions.includes("VIEW_DEPARTMENT")) {
      const departmentCount = await Department.countDocuments({
        organization_id,
        deleted_at: null,
      });
      stats.departments = {
        total: departmentCount,
      };
    }

    // Role stats - if user has VIEW_ROLE permission
    if (allPermissions.includes("VIEW_ROLE")) {
      const roleCount = await Role.countDocuments({
        organization_id,
        deleted_at: null,
      });
      stats.roles = {
        total: roleCount,
      };
    }

    return { isSuccess: true, data: stats };
  } catch (err) {
    console.error("Error in getDashboardStats service:", err);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

module.exports = {
  getDashboardStats,
};
