import express from 'express';
import {
  getAuditLogs,
  getAuditLogById,
  getAuditSummary,
} from '../controllers/auditLog.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
// Super Admin and School Admin can inspect security & audit trails
router.use(authorize('super_admin', 'school_admin'));

router.get('/', getAuditLogs);
router.get('/summary', getAuditSummary);
router.get('/:id', getAuditLogById);

export default router;
