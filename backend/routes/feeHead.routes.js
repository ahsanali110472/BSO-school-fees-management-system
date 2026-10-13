import { Router } from 'express';
import {
  createFeeHead,
  deleteFeeHead,
  getFeeHeads,
  updateFeeHead,
} from '../controllers/feeHead.controller.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getFeeHeads);
router.post('/', authorize('super_admin', 'school_admin', 'accountant'), createFeeHead);
router.put('/:id', authorize('super_admin', 'school_admin', 'accountant'), updateFeeHead);
router.delete('/:id', authorize('super_admin', 'school_admin'), deleteFeeHead);

export default router;
