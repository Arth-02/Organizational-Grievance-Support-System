const AuditLog = require("../models/auditLog.model");
const {
  errorResponse,
  successResponse,
  catchResponse,
} = require("../utils/response");

/**
 * Organization-level audit log controller
 * These functions return audit logs scoped to the user's organization
 * @requirements 6.4
 */

/**
 * Get all audit logs for the user's organization
 */
const getOrganizationAuditLogs = async (req, res) => {
  try {
    const organizationId = req.user?.organization_id;
    
    if (!organizationId) {
      return errorResponse(res, 400, "Organization not found");
    }

    const {
      page = 1,
      limit = 20,
      action,
      entity_type,
      performed_by,
      startDate,
      endDate,
      search,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query - always scoped to user's organization
    const query = { organization_id: organizationId };

    if (action) {
      query.action = action;
    }

    if (entity_type) {
      query.entity_type = entity_type;
    }

    if (performed_by) {
      query.performed_by = performed_by;
    }

    if (startDate || endDate) {
      query.created_at = {};
      if (startDate) {
        query.created_at.$gte = new Date(startDate);
      }
      if (endDate) {
        query.created_at.$lte = new Date(endDate);
      }
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: "i" } },
        { entity_name: { $regex: search, $options: "i" } },
      ];
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate("performed_by", "firstname lastname username email avatar")
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return successResponse(
      res,
      {
        logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
      "Audit logs retrieved successfully"
    );
  } catch (err) {
    console.error("Get Organization Audit Logs Error:", err);
    return catchResponse(res);
  }
};

/**
 * Get audit log by ID (must belong to user's organization)
 */
const getOrganizationAuditLogById = async (req, res) => {
  try {
    const organizationId = req.user?.organization_id;
    
    if (!organizationId) {
      return errorResponse(res, 400, "Organization not found");
    }

    const log = await AuditLog.findOne({
      _id: req.params.id,
      organization_id: organizationId,
    })
      .populate("performed_by", "firstname lastname username email avatar")
      .lean();

    if (!log) {
      return errorResponse(res, 404, "Audit log not found");
    }

    return successResponse(res, log, "Audit log retrieved successfully");
  } catch (err) {
    console.error("Get Organization Audit Log By ID Error:", err);
    return catchResponse(res);
  }
};

/**
 * Get audit log statistics for the user's organization
 */
const getOrganizationAuditLogStats = async (req, res) => {
  try {
    const organizationId = req.user?.organization_id;
    
    if (!organizationId) {
      return errorResponse(res, 400, "Organization not found");
    }

    const [totalLogs, actionCounts, entityCounts, recentActivity] = await Promise.all([
      // Total logs count
      AuditLog.countDocuments({ organization_id: organizationId }),
      
      // Count by action type
      AuditLog.aggregate([
        { $match: { organization_id: organizationId } },
        { $group: { _id: "$action", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      
      // Count by entity type
      AuditLog.aggregate([
        { $match: { organization_id: organizationId } },
        { $group: { _id: "$entity_type", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      
      // Recent activity (last 7 days)
      AuditLog.aggregate([
        {
          $match: {
            organization_id: organizationId,
            created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return successResponse(
      res,
      {
        totalLogs,
        actionCounts: actionCounts.map((a) => ({ action: a._id, count: a.count })),
        entityCounts: entityCounts.map((e) => ({ entity: e._id, count: e.count })),
        recentActivity: recentActivity.map((r) => ({ date: r._id, count: r.count })),
      },
      "Audit log stats retrieved successfully"
    );
  } catch (err) {
    console.error("Get Organization Audit Log Stats Error:", err);
    return catchResponse(res);
  }
};

/**
 * Get available action types for filtering
 */
const getOrganizationAuditLogActionTypes = async (req, res) => {
  try {
    const organizationId = req.user?.organization_id;
    
    if (!organizationId) {
      return errorResponse(res, 400, "Organization not found");
    }

    const actionTypes = await AuditLog.distinct("action", {
      organization_id: organizationId,
    });

    return successResponse(res, actionTypes, "Action types retrieved successfully");
  } catch (err) {
    console.error("Get Organization Audit Log Action Types Error:", err);
    return catchResponse(res);
  }
};

module.exports = {
  getOrganizationAuditLogs,
  getOrganizationAuditLogById,
  getOrganizationAuditLogStats,
  getOrganizationAuditLogActionTypes,
};
