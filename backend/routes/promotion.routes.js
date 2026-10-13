import { Router } from 'express';
import {
  executePromotionBatch,
  getPromotionCandidates,
  getPromotionHistory,
} from '../controllers/promotion.controller.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/candidates', getPromotionCandidates);
router.get('/history', getPromotionHistory);
router.post('/batch', authorize('super_admin', 'school_admin'), executePromotionBatch);

export default router;
