import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    userName: {
      type: String,
      default: 'System / Anonymous',
    },
    userRole: {
      type: String,
      default: 'system',
    },
    action: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    module: {
      type: String,
      required: true,
      enum: [
        'AUTH',
        'USERS',
        'STUDENTS',
        'TEACHERS',
        'ACADEMICS',
        'FEES',
        'PAYMENTS',
        'PROMOTIONS',
        'SETTINGS',
        'SYSTEM',
      ],
      default: 'SYSTEM',
    },
    recordId: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      required: true,
    },
    oldData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
      default: 'Unknown',
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'WARNING'],
      default: 'SUCCESS',
    },
  },
  {
    timestamps: { createdAt: 'timestamp', updatedAt: false },
  }
);

// High-performance search indexes
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ module: 1, timestamp: -1 });
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ action: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
