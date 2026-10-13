import { Router } from 'express';
import {
  deleteFeeStructure,
  getFeeStructureByClass,
  getFeeStructures,
  upsertFeeStructure,
} from '../controllers/feeStructure.controller.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getFeeStructures);
router.get('/class/:classId', getFeeStructureByClass);
router.get('/class/:classId/session/:sessionId', getFeeStructureByClass);
router.post('/', authorize('super_admin', 'school_admin', 'accountant'), upsertFeeStructure);
router.delete('/:id', authorize('super_admin', 'school_admin'), deleteFeeStructure);

export default router;
