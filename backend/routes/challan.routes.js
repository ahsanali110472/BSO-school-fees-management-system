import { Router } from 'express';
import {
  generateBatchChallans,
  getChallanById,
  getChallans,
  voidChallan,
} from '../controllers/challan.controller.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getChallans);
router.get('/:id', getChallanById);
router.post('/generate', authorize('super_admin', 'school_admin', 'accountant'), generateBatchChallans);
router.patch('/:id/void', authorize('super_admin', 'school_admin', 'accountant'), voidChallan);

export default router;
