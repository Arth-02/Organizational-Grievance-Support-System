const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const Department = require("../models/department.model");
const Role = require("../models/role.model");
const Grievance = require("../models/grievance.model");
const AuditLog = require("../models/auditLog.model");
const Project = require("../models/project.model");
const Board = require("../models/board.model");
const Task = require("../models/task.model");

// Get dashboard statistics
const getDashboardStats = async () => {
  try {
    const [
      totalOrganizations,
      pendingOrganizations,
      approvedOrganizations,
      totalUsers,
      activeUsers,
      totalDepartments,
      totalRoles,
      totalGrievances,
    ] = await Promise.all([
      Organization.countDocuments(),
      Organization.countDocuments({ is_approved: false }),
      Organization.countDocuments({ is_approved: true }),
      User.countDocuments({ is_deleted: false }),
      User.countDocuments({ is_deleted: false, is_active: true }),
      Department.countDocuments(),
      Role.countDocuments({ is_active: true }),
      Grievance.countDocuments(),
    ]);

    return {
      isSuccess: true,
      data: {
        organizations: {
          total: totalOrganizations,
          pending: pendingOrganizations,
          approved: approvedOrganizations,
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
        },
        departments: { total: totalDepartments },
        roles: { total: totalRoles },
        grievances: { total: totalGrievances },
      },
    };
  } catch (err) {
    console.error("Get Dashboard Stats Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};


// Get recent activity
const getRecentActivity = async (limit = 10) => {
  try {
    // Get recent organizations
    const recentOrganizations = await Organization.find()
      .sort({ created_at: -1 })
      .limit(5)
      .select("name email is_approved created_at")
      .lean();

    // Get recent users
    const recentUsers = await User.find({ is_deleted: false })
      .sort({ created_at: -1 })
      .limit(5)
      .populate("organization_id", "name")
      .select("username email firstname lastname created_at organization_id")
      .lean();

    // Get recent logins
    const recentLogins = await User.find({ 
      is_deleted: false, 
      last_login: { $exists: true } 
    })
      .sort({ last_login: -1 })
      .limit(5)
      .populate("organization_id", "name")
      .select("username email last_login organization_id")
      .lean();

    // Combine and format activities
    const activities = [
      ...recentOrganizations.map((org) => ({
        type: "organization_created",
        title: `New organization: ${org.name}`,
        description: org.is_approved ? "Approved" : "Pending approval",
        timestamp: org.created_at,
        data: org,
      })),
      ...recentUsers.map((user) => ({
        type: "user_created",
        title: `New user: ${user.firstname} ${user.lastname}`,
        description: `${user.email} - ${user.organization_id?.name || "N/A"}`,
        timestamp: user.created_at,
        data: user,
      })),
      ...recentLogins.map((user) => ({
        type: "user_login",
        title: `User login: ${user.username}`,
        description: user.organization_id?.name || "N/A",
        timestamp: user.last_login,
        data: user,
      })),
    ];

    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, limit);

    return { isSuccess: true, data: limitedActivities };
  } catch (err) {
    console.error("Get Recent Activity Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Get growth trends (last 30 days)
const getGrowthTrends = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Organizations growth
    const orgGrowth = await Organization.aggregate([
      { $match: { created_at: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Users growth
    const userGrowth = await User.aggregate([
      { $match: { created_at: { $gte: thirtyDaysAgo }, is_deleted: false } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      isSuccess: true,
      data: {
        organizations: orgGrowth,
        users: userGrowth,
      },
    };
  } catch (err) {
    console.error("Get Growth Trends Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Get all organizations (for admin)
const getAllOrganizations = async (query) => {
  try {
    const {
      page = 1,
      limit = 10,
      name,
      is_approved,
      sort_by = "created_at",
      order = "desc",
    } = query;

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const filter = {};
    if (name) filter.name = { $regex: name, $options: "i" };
    if (is_approved !== undefined) filter.is_approved = is_approved === "true";

    const [organizations, total] = await Promise.all([
      Organization.find(filter)
        .sort({ [sort_by]: order === "desc" ? -1 : 1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      Organization.countDocuments(filter),
    ]);

    // Get user counts for each organization
    const orgsWithStats = await Promise.all(
      organizations.map(async (org) => {
        const userCount = await User.countDocuments({
          organization_id: org._id,
          is_deleted: false,
        });
        return { ...org, userCount };
      })
    );

    const totalPages = Math.ceil(total / limitNumber);

    return {
      isSuccess: true,
      data: orgsWithStats,
      pagination: {
        totalItems: total,
        totalPages,
        currentPage: pageNumber,
        limit: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      },
    };
  } catch (err) {
    console.error("Get All Organizations Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Get organization by ID with full details (for admin)
const getOrganizationById = async (id) => {
  try {
    if (!id || !mongoose.isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid organization ID", code: 400 };
    }

    const organization = await Organization.findById(id).lean();
    if (!organization) {
      return { isSuccess: false, message: "Organization not found", code: 404 };
    }

    // Get additional stats - use organization._id which is already an ObjectId
    const [userCount, departmentCount, roleCount] = await Promise.all([
      User.countDocuments({ organization_id: organization._id, is_deleted: false }),
      Department.countDocuments({ organization_id: organization._id }),
      Role.countDocuments({ organization_id: organization._id, is_active: true }),
    ]);

    // Get recent users
    const recentUsers = await User.find({ organization_id: organization._id, is_deleted: false })
      .sort({ created_at: -1 })
      .limit(5)
      .select("username email firstname lastname is_active created_at")
      .lean();

    return {
      isSuccess: true,
      data: {
        ...organization,
        stats: { userCount, departmentCount, roleCount },
        recentUsers,
      },
    };
  } catch (err) {
    console.error("Get Organization By ID Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Update organization status (suspend/activate)
const updateOrganizationStatus = async (id, is_active) => {
  try {
    if (!id || !mongoose.isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid organization ID", code: 400 };
    }

    const organization = await Organization.findByIdAndUpdate(
      id,
      { is_active },
      { new: true }
    );

    if (!organization) {
      return { isSuccess: false, message: "Organization not found", code: 404 };
    }

    return { isSuccess: true, data: organization };
  } catch (err) {
    console.error("Update Organization Status Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Reject organization (delete pending organization)
const rejectOrganization = async (id, reason) => {
  try {
    if (!id || !mongoose.isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid organization ID", code: 400 };
    }

    const organization = await Organization.findById(id);
    if (!organization) {
      return { isSuccess: false, message: "Organization not found", code: 404 };
    }

    if (organization.is_approved) {
      return { isSuccess: false, message: "Cannot reject an approved organization", code: 400 };
    }

    // Send rejection email
    const { sendEmail } = require("../utils/mail");
    await sendEmail(
      organization.email,
      "Organization Application Rejected",
      `
        <h1>Your organization application has been rejected</h1>
        <p>Organization: ${organization.name}</p>
        ${reason ? `<p>Reason: ${reason}</p>` : ""}
        <p>If you believe this is an error, please contact support.</p>
      `
    );

    // Delete the organization
    await Organization.findByIdAndDelete(id);

    return { isSuccess: true, message: "Organization rejected successfully" };
  } catch (err) {
    console.error("Reject Organization Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Delete organization (soft delete - deactivate)
const deleteOrganization = async (session, id) => {
  try {
    if (!id || !mongoose.isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid organization ID", code: 400 };
    }

    const organization = await Organization.findById(id).session(session);
    if (!organization) {
      return { isSuccess: false, message: "Organization not found", code: 404 };
    }

    // Deactivate all users in the organization
    await User.updateMany(
      { organization_id: id },
      { is_active: false, is_deleted: true }
    ).session(session);

    // Deactivate the organization
    organization.is_active = false;
    await organization.save({ session });

    return { isSuccess: true, message: "Organization deleted successfully" };
  } catch (err) {
    console.error("Delete Organization Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Get organization users (for admin)
const getOrganizationUsers = async (orgId, query) => {
  try {
    if (!orgId || !mongoose.isValidObjectId(orgId)) {
      return { isSuccess: false, message: "Invalid organization ID", code: 400 };
    }

    const {
      page = 1,
      limit = 10,
      username,
      is_active,
      sort_by = "created_at",
      order = "desc",
    } = query;

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Convert to ObjectId for query
    const orgObjectId = new ObjectId(orgId);
    const filter = { organization_id: orgObjectId, is_deleted: false };
    if (username) filter.username = { $regex: username, $options: "i" };
    if (is_active !== undefined && is_active !== "all") filter.is_active = is_active === "true";

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ [sort_by]: order === "desc" ? -1 : 1 })
        .skip(skip)
        .limit(limitNumber)
        .populate("role", "name")
        .populate("department", "name")
        .select("-password")
        .lean(),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNumber);

    return {
      isSuccess: true,
      data: users,
      pagination: {
        totalItems: total,
        totalPages,
        currentPage: pageNumber,
        limit: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      },
    };
  } catch (err) {
    console.error("Get Organization Users Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivity,
  getGrowthTrends,
  getAllOrganizations,
  getOrganizationById,
  updateOrganizationStatus,
  rejectOrganization,
  deleteOrganization,
  getOrganizationUsers,
};

// ==================== USER MANAGEMENT ====================

// Get all users across all organizations (for admin)
const getAllUsers = async (query) => {
  try {
    const {
      page = 1,
      limit = 10,
      username,
      email,
      organization_id,
      is_active,
      sort_by = "created_at",
      order = "desc",
    } = query;

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const filter = { is_deleted: false };
    if (username) filter.username = { $regex: username, $options: "i" };
    if (email) filter.email = { $regex: email, $options: "i" };
    if (organization_id && mongoose.isValidObjectId(organization_id)) {
      filter.organization_id = new ObjectId(organization_id);
    }
    if (is_active !== undefined && is_active !== "all") {
      filter.is_active = is_active === "true";
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ [sort_by]: order === "desc" ? -1 : 1 })
        .skip(skip)
        .limit(limitNumber)
        .populate("organization_id", "name")
        .populate("role", "name")
        .populate("department", "name")
        .select("-password")
        .lean(),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNumber);

    return {
      isSuccess: true,
      data: users,
      pagination: {
        totalItems: total,
        totalPages,
        currentPage: pageNumber,
        limit: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      },
    };
  } catch (err) {
    console.error("Get All Users Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Get user by ID with full details (for admin)
const getUserById = async (id) => {
  try {
    if (!id || !mongoose.isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid user ID", code: 400 };
    }

    const user = await User.findOne({ _id: id, is_deleted: false })
      .populate("organization_id", "name email")
      .populate("role", "name permissions")
      .populate("department", "name")
      .select("-password")
      .lean();

    if (!user) {
      return { isSuccess: false, message: "User not found", code: 404 };
    }

    return { isSuccess: true, data: user };
  } catch (err) {
    console.error("Get User By ID Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Update user status (activate/deactivate)
const updateUserStatus = async (id, is_active) => {
  try {
    if (!id || !mongoose.isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid user ID", code: 400 };
    }

    const user = await User.findOneAndUpdate(
      { _id: id, is_deleted: false },
      { is_active },
      { new: true }
    ).select("-password");

    if (!user) {
      return { isSuccess: false, message: "User not found", code: 404 };
    }

    return { isSuccess: true, data: user };
  } catch (err) {
    console.error("Update User Status Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Delete user (soft delete)
const deleteUser = async (id) => {
  try {
    if (!id || !mongoose.isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid user ID", code: 400 };
    }

    const user = await User.findOneAndUpdate(
      { _id: id, is_deleted: false },
      { is_active: false, is_deleted: true },
      { new: true }
    );

    if (!user) {
      return { isSuccess: false, message: "User not found", code: 404 };
    }

    return { isSuccess: true, message: "User deleted successfully" };
  } catch (err) {
    console.error("Delete User Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Get all organization names (for filter dropdown)
const getAllOrganizationNames = async () => {
  try {
    const organizations = await Organization.find({ is_approved: true })
      .select("_id name")
      .sort({ name: 1 })
      .lean();

    return { isSuccess: true, data: organizations };
  } catch (err) {
    console.error("Get All Organization Names Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivity,
  getGrowthTrends,
  getAllOrganizations,
  getOrganizationById,
  updateOrganizationStatus,
  rejectOrganization,
  deleteOrganization,
  getOrganizationUsers,
  // User management
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  getAllOrganizationNames,
};

// ==================== ROLE MANAGEMENT ====================

// Get all roles across all organizations (for admin)
const getAllRoles = async (query) => {
  try {
    const {
      page = 1,
      limit = 10,
      name,
      organization_id,
      is_active,
      sort_by = "created_at",
      order = "desc",
    } = query;

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const filter = {};
    if (name) filter.name = { $regex: name, $options: "i" };
    if (organization_id && mongoose.isValidObjectId(organization_id)) {
      filter.organization_id = new ObjectId(organization_id);
    }
    if (is_active !== undefined && is_active !== "all") {
      filter.is_active = is_active === "true";
    }

    const [roles, total] = await Promise.all([
      Role.find(filter)
        .sort({ [sort_by]: order === "desc" ? -1 : 1 })
        .skip(skip)
        .limit(limitNumber)
        .populate("organization_id", "name")
        .lean(),
      Role.countDocuments(filter),
    ]);

    // Get user count for each role
    const rolesWithStats = await Promise.all(
      roles.map(async (role) => {
        const userCount = await User.countDocuments({
          role: role._id,
          is_deleted: false,
        });
        return { ...role, userCount };
      })
    );

    const totalPages = Math.ceil(total / limitNumber);

    return {
      isSuccess: true,
      data: rolesWithStats,
      pagination: {
        totalItems: total,
        totalPages,
        currentPage: pageNumber,
        limit: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      },
    };
  } catch (err) {
    console.error("Get All Roles Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Get role by ID with full details (for admin)
const getRoleById = async (id) => {
  try {
    if (!id || !mongoose.isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid role ID", code: 400 };
    }

    const role = await Role.findById(id)
      .populate("organization_id", "name email")
      .lean();

    if (!role) {
      return { isSuccess: false, message: "Role not found", code: 404 };
    }

    // Get users with this role
    const users = await User.find({ role: role._id, is_deleted: false })
      .select("firstname lastname username email is_active")
      .lean();

    return {
      isSuccess: true,
      data: {
        ...role,
        users,
        userCount: users.length,
      },
    };
  } catch (err) {
    console.error("Get Role By ID Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Update role status (activate/deactivate)
const updateRoleStatus = async (id, is_active) => {
  try {
    if (!id || !mongoose.isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid role ID", code: 400 };
    }

    const role = await Role.findByIdAndUpdate(
      id,
      { is_active },
      { new: true }
    );

    if (!role) {
      return { isSuccess: false, message: "Role not found", code: 404 };
    }

    return { isSuccess: true, data: role };
  } catch (err) {
    console.error("Update Role Status Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Delete role (soft delete - deactivate)
const deleteRole = async (id) => {
  try {
    if (!id || !mongoose.isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid role ID", code: 400 };
    }

    // Check if any users have this role
    const userCount = await User.countDocuments({ role: id, is_deleted: false });
    if (userCount > 0) {
      return {
        isSuccess: false,
        message: `Cannot delete role. ${userCount} user(s) are assigned to this role.`,
        code: 400,
      };
    }

    const role = await Role.findByIdAndUpdate(
      id,
      { is_active: false },
      { new: true }
    );

    if (!role) {
      return { isSuccess: false, message: "Role not found", code: 404 };
    }

    return { isSuccess: true, message: "Role deleted successfully" };
  } catch (err) {
    console.error("Delete Role Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivity,
  getGrowthTrends,
  getAllOrganizations,
  getOrganizationById,
  updateOrganizationStatus,
  rejectOrganization,
  deleteOrganization,
  getOrganizationUsers,
  // User management
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  getAllOrganizationNames,
  // Role management
  getAllRoles,
  getRoleById,
  updateRoleStatus,
  deleteRole,
};

// ==================== GRIEVANCE MANAGEMENT ====================

// Get all grievances across all organizations (for admin)
const getAllGrievances = async (query) => {
  try {
    const {
      page = 1,
      limit = 10,
      title,
      organization_id,
      status,
      priority,
      sort_by = "date_reported",
      order = "desc",
    } = query;

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const filter = {};
    if (title) filter.title = { $regex: title, $options: "i" };
    if (organization_id && mongoose.isValidObjectId(organization_id)) {
      filter.organization_id = new ObjectId(organization_id);
    }
    if (status && status !== "all") {
      filter.status = status;
    }
    if (priority && priority !== "all") {
      filter.priority = priority;
    }

    const [grievances, total] = await Promise.all([
      Grievance.find(filter)
        .sort({ [sort_by]: order === "desc" ? -1 : 1 })
        .skip(skip)
        .limit(limitNumber)
        .populate("organization_id", "name")
        .populate("department_id", "name")
        .populate("reported_by", "firstname lastname username email")
        .populate("assigned_to", "firstname lastname username email")
        .lean(),
      Grievance.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNumber);

    return {
      isSuccess: true,
      data: grievances,
      pagination: {
        totalItems: total,
        totalPages,
        currentPage: pageNumber,
        limit: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      },
    };
  } catch (err) {
    console.error("Get All Grievances Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Get grievance by ID with full details (for admin)
const getGrievanceById = async (id) => {
  try {
    if (!id || !mongoose.isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid grievance ID", code: 400 };
    }

    const grievance = await Grievance.findById(id)
      .populate("organization_id", "name email")
      .populate("department_id", "name")
      .populate("reported_by", "firstname lastname username email phone")
      .populate("assigned_to", "firstname lastname username email")
      .populate("attachments")
      .lean();

    if (!grievance) {
      return { isSuccess: false, message: "Grievance not found", code: 404 };
    }

    return { isSuccess: true, data: grievance };
  } catch (err) {
    console.error("Get Grievance By ID Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Update grievance status
const updateGrievanceStatus = async (id, status) => {
  try {
    if (!id || !mongoose.isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid grievance ID", code: 400 };
    }

    const validStatuses = ["submitted", "in-progress", "resolved", "dismissed"];
    if (!validStatuses.includes(status)) {
      return { isSuccess: false, message: "Invalid status", code: 400 };
    }

    const grievance = await Grievance.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!grievance) {
      return { isSuccess: false, message: "Grievance not found", code: 404 };
    }

    return { isSuccess: true, data: grievance };
  } catch (err) {
    console.error("Update Grievance Status Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Delete grievance (soft delete - deactivate)
const deleteGrievance = async (id) => {
  try {
    if (!id || !mongoose.isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid grievance ID", code: 400 };
    }

    const grievance = await Grievance.findByIdAndUpdate(
      id,
      { is_active: false },
      { new: true }
    );

    if (!grievance) {
      return { isSuccess: false, message: "Grievance not found", code: 404 };
    }

    return { isSuccess: true, message: "Grievance deleted successfully" };
  } catch (err) {
    console.error("Delete Grievance Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivity,
  getGrowthTrends,
  getAllOrganizations,
  getOrganizationById,
  updateOrganizationStatus,
  rejectOrganization,
  deleteOrganization,
  getOrganizationUsers,
  // User management
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  getAllOrganizationNames,
  // Role management
  getAllRoles,
  getRoleById,
  updateRoleStatus,
  deleteRole,
  // Grievance management
  getAllGrievances,
  getGrievanceById,
  updateGrievanceStatus,
  deleteGrievance,
};

// ==================== AUDIT LOG MANAGEMENT ====================

// Get all audit logs (for admin)
const getAuditLogs = async (query) => {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      entity_type,
      organization_id,
      performed_by,
      start_date,
      end_date,
      sort_by = "created_at",
      order = "desc",
    } = query;

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 20;
    const skip = (pageNumber - 1) * limitNumber;

    const filter = {};
    if (action && action !== "all") {
      filter.action = action;
    }
    if (entity_type && entity_type !== "all") {
      filter.entity_type = entity_type;
    }
    if (organization_id && mongoose.isValidObjectId(organization_id)) {
      filter.organization_id = new ObjectId(organization_id);
    }
    if (performed_by && mongoose.isValidObjectId(performed_by)) {
      filter.performed_by = new ObjectId(performed_by);
    }
    if (start_date || end_date) {
      filter.created_at = {};
      if (start_date) {
        filter.created_at.$gte = new Date(start_date);
      }
      if (end_date) {
        filter.created_at.$lte = new Date(end_date);
      }
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ [sort_by]: order === "desc" ? -1 : 1 })
        .skip(skip)
        .limit(limitNumber)
        .populate("performed_by", "firstname lastname username email")
        .populate("organization_id", "name")
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNumber);

    return {
      isSuccess: true,
      data: logs,
      pagination: {
        totalItems: total,
        totalPages,
        currentPage: pageNumber,
        limit: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      },
    };
  } catch (err) {
    console.error("Get Audit Logs Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Get audit log statistics
const getAuditLogStats = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const [
      totalLogs,
      todayLogs,
      lastWeekLogs,
      actionCounts,
      entityTypeCounts,
    ] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.countDocuments({ created_at: { $gte: today } }),
      AuditLog.countDocuments({ created_at: { $gte: lastWeek } }),
      AuditLog.aggregate([
        { $group: { _id: "$action", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      AuditLog.aggregate([
        { $group: { _id: "$entity_type", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      isSuccess: true,
      data: {
        totalLogs,
        todayLogs,
        lastWeekLogs,
        topActions: actionCounts,
        entityTypeCounts,
      },
    };
  } catch (err) {
    console.error("Get Audit Log Stats Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Get available action types for filter
const getAuditLogActionTypes = async () => {
  try {
    const actions = await AuditLog.distinct("action");
    return { isSuccess: true, data: actions.sort() };
  } catch (err) {
    console.error("Get Audit Log Action Types Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Get audit log by ID with full details
const getAuditLogById = async (id) => {
  try {
    if (!id || !mongoose.isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid audit log ID", code: 400 };
    }

    const log = await AuditLog.findById(id)
      .populate("performed_by", "firstname lastname username email avatar")
      .populate("organization_id", "name email")
      .lean();

    if (!log) {
      return { isSuccess: false, message: "Audit log not found", code: 404 };
    }

    return { isSuccess: true, data: log };
  } catch (err) {
    console.error("Get Audit Log By ID Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Clear old audit logs
const clearOldAuditLogs = async (daysToKeep = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await AuditLog.deleteMany({
      created_at: { $lt: cutoffDate }
    });

    return { 
      isSuccess: true, 
      data: { deletedCount: result.deletedCount },
      message: `Deleted ${result.deletedCount} audit logs older than ${daysToKeep} days`
    };
  } catch (err) {
    console.error("Clear Old Audit Logs Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// ==================== PROJECT MANAGEMENT ====================

// Get all projects across all organizations (for admin)
const getAllProjects = async (query) => {
  try {
    const {
      page = 1,
      limit = 10,
      name,
      organization_id,
      status,
      project_type,
      sort_by = "created_at",
      order = "desc",
    } = query;

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const filter = { deleted_at: null };
    if (name) filter.name = { $regex: name, $options: "i" };
    if (organization_id && mongoose.isValidObjectId(organization_id)) {
      filter.organization_id = new ObjectId(organization_id);
    }
    if (status && status !== "all") {
      filter.status = status;
    }
    if (project_type && project_type !== "all") {
      filter.project_type = project_type;
    }

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort({ [sort_by]: order === "desc" ? -1 : 1 })
        .skip(skip)
        .limit(limitNumber)
        .populate("organization_id", "name")
        .populate("manager", "firstname lastname username email")
        .populate("created_by", "firstname lastname username")
        .lean(),
      Project.countDocuments(filter),
    ]);

    // Get task counts for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const taskCount = await Task.countDocuments({ project_id: project._id });
        const memberCount = project.members?.length || 0;
        return { ...project, taskCount, memberCount };
      })
    );

    const totalPages = Math.ceil(total / limitNumber);

    return {
      isSuccess: true,
      data: projectsWithStats,
      pagination: {
        totalItems: total,
        totalPages,
        currentPage: pageNumber,
        limit: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      },
    };
  } catch (err) {
    console.error("Get All Projects Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Get project by ID with full details (for admin)
const getProjectById = async (id) => {
  try {
    if (!id || !mongoose.isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid project ID", code: 400 };
    }

    const project = await Project.findOne({ _id: id, deleted_at: null })
      .populate("organization_id", "name email")
      .populate("manager", "firstname lastname username email avatar")
      .populate("members", "firstname lastname username email avatar")
      .populate("created_by", "firstname lastname username email")
      .lean();

    if (!project) {
      return { isSuccess: false, message: "Project not found", code: 404 };
    }

    // Get board with columns (task sections)
    const board = await Board.findOne({ project_id: project._id, is_active: true }).lean();

    // Get task counts per column/section
    const taskCounts = await Task.aggregate([
      { $match: { project_id: project._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Map task counts to columns
    const sections = board?.columns?.map((col) => {
      const taskData = taskCounts.find((tc) => tc._id === col.key);
      return {
        key: col.key,
        label: col.label,
        order: col.order,
        taskCount: taskData?.count || 0,
      };
    }) || [];

    // Get tasks grouped by section with details
    const tasksGrouped = {};
    if (board?.columns) {
      for (const col of board.columns) {
        const tasks = await Task.find({ project_id: project._id, status: col.key })
          .select("issue_key title priority type assignee due_date")
          .populate("assignee", "firstname lastname username avatar")
          .sort({ rank: 1 })
          .limit(10)
          .lean();
        tasksGrouped[col.key] = tasks;
      }
    }

    const totalTasks = taskCounts.reduce((sum, tc) => sum + tc.count, 0);

    return {
      isSuccess: true,
      data: {
        ...project,
        board: board ? { name: board.name, columns: board.columns } : null,
        sections,
        tasksGrouped,
        stats: {
          totalTasks,
          memberCount: project.members?.length || 0,
          managerCount: project.manager?.length || 0,
        },
      },
    };
  } catch (err) {
    console.error("Get Project By ID Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Update project status
const updateProjectStatus = async (id, is_active) => {
  try {
    if (!id || !mongoose.isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid project ID", code: 400 };
    }

    const newStatus = is_active ? "active" : "archived";
    const project = await Project.findOneAndUpdate(
      { _id: id, deleted_at: null },
      { status: newStatus },
      { new: true }
    );

    if (!project) {
      return { isSuccess: false, message: "Project not found", code: 404 };
    }

    return { isSuccess: true, data: project };
  } catch (err) {
    console.error("Update Project Status Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

// Delete project (soft delete)
const deleteProject = async (id) => {
  try {
    if (!id || !mongoose.isValidObjectId(id)) {
      return { isSuccess: false, message: "Invalid project ID", code: 400 };
    }

    const project = await Project.findOneAndUpdate(
      { _id: id, deleted_at: null },
      { deleted_at: new Date(), status: "archived" },
      { new: true }
    );

    if (!project) {
      return { isSuccess: false, message: "Project not found", code: 404 };
    }

    return { isSuccess: true, message: "Project deleted successfully" };
  } catch (err) {
    console.error("Delete Project Error:", err.message);
    return { isSuccess: false, message: "Internal server error", code: 500 };
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivity,
  getGrowthTrends,
  getAllOrganizations,
  getOrganizationById,
  updateOrganizationStatus,
  rejectOrganization,
  deleteOrganization,
  getOrganizationUsers,
  // User management
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  getAllOrganizationNames,
  // Role management
  getAllRoles,
  getRoleById,
  updateRoleStatus,
  deleteRole,
  // Grievance management
  getAllGrievances,
  getGrievanceById,
  updateGrievanceStatus,
  deleteGrievance,
  // Project management
  getAllProjects,
  getProjectById,
  updateProjectStatus,
  deleteProject,
  // Audit log management
  getAuditLogs,
  getAuditLogStats,
  getAuditLogActionTypes,
  getAuditLogById,
  clearOldAuditLogs,
};
