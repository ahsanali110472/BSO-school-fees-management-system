import AuditLog from '../models/AuditLog.js';

class AuditService {
  /**
   * Record an audit event asynchronously without blocking business logic
   * @param {Object} options
   * @param {Object} [options.req] Express request for IP & User Agent
   * @param {Object} [options.user] User object
   * @param {string} options.action Action code (e.g. 'RECORD_PAYMENT', 'LOGIN')
   * @param {string} options.module Module (e.g. 'PAYMENTS', 'AUTH', 'STUDENTS')
   * @param {string} [options.recordId] Target entity id or reference
   * @param {string} options.description Human-readable description
   * @param {any} [options.oldData] Previous state
   * @param {any} [options.newData] New state
   * @param {string} [options.status] 'SUCCESS' | 'FAILURE' | 'WARNING'
   */
  static async log({
    req = null,
    user = null,
    action,
    module = 'SYSTEM',
    recordId = null,
    description,
    oldData = null,
    newData = null,
    status = 'SUCCESS',
  }) {
    try {
      const activeUser = user || req?.user;

      let ip = '127.0.0.1';
      let userAgent = 'Unknown';

      if (req) {
        ip =
          req.headers['x-forwarded-for']?.split(',')[0] ||
          req.socket?.remoteAddress ||
          req.ip ||
          '127.0.0.1';
        userAgent = req.headers['user-agent'] || 'Unknown';
      }

      // Sanitize oldData and newData to ensure passwords and sensitive tokens are never stored
      const sanitizedOld = this._sanitizeData(oldData);
      const sanitizedNew = this._sanitizeData(newData);

      await AuditLog.create({
        user: activeUser?._id || null,
        userName: activeUser?.name || 'Anonymous / System',
        userRole: activeUser?.role || 'system',
        action: action.toUpperCase(),
        module: module.toUpperCase(),
        recordId: recordId ? String(recordId) : null,
        description,
        oldData: sanitizedOld,
        newData: sanitizedNew,
        ipAddress: ip,
        userAgent,
        status,
      });
    } catch (err) {
      console.error('[AuditService Error] Failed to write audit log:', err.message);
    }
  }

  /**
   * Helper to strip passwords, tokens, secrets
   */
  static _sanitizeData(data) {
    if (!data) return null;
    if (typeof data !== 'object') return data;

    try {
      const copy = JSON.parse(JSON.stringify(data));
      const sensitiveKeys = ['password', 'token', 'jwt', 'secret', 'merchantPassword'];

      const scrub = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        for (const key of Object.keys(obj)) {
          if (sensitiveKeys.includes(key.toLowerCase())) {
            obj[key] = '********';
          } else if (typeof obj[key] === 'object') {
            scrub(obj[key]);
          }
        }
      };

      scrub(copy);
      return copy;
    } catch {
      return '[Unparseable Data]';
    }
  }
}

export default AuditService;
