import AuditLog from '../models/AuditLog.js';
import mongoose from 'mongoose';

/**
 * Get paginated and filtered audit logs (Restricted to Super Admin & School Admin)
 */
export const getAuditLogs = async (req, res, next) => {
  try {
    const {
      module,
      action,
      userId,
      status,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (module && module !== 'all') {
      filter.module = module.toUpperCase();
    }
    if (action && action !== 'all') {
      filter.action = action.toUpperCase();
    }
    if (status && status !== 'all') {
      filter.status = status.toUpperCase();
    }
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.user = userId;
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.timestamp.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.timestamp.$lte = end;
      }
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      filter.$or = [
        { description: { $regex: q, $options: 'i' } },
        { userName: { $regex: q, $options: 'i' } },
        { recordId: { $regex: q, $options: 'i' } },
        { action: { $regex: q, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(filter),
      AuditLog.find(filter)
        .populate('user', 'name email role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single audit log record by ID
 */
export const getAuditLogById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const log = await AuditLog.findById(id).populate('user', 'name email role').lean();

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log entry not found',
      });
    }

    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get audit statistics & module distribution
 */
export const getAuditSummary = async (_req, res, next) => {
  try {
    const [totalLogs, moduleStats, recentFailures] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.aggregate([
        { $group: { _id: '$module', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      AuditLog.countDocuments({ status: 'FAILURE' }),
    ]);

    res.json({
      success: true,
      data: {
        totalLogs,
        recentFailures,
        moduleDistribution: moduleStats.map((m) => ({
          module: m._id,
          count: m.count,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
