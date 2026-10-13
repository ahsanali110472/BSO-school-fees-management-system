import { Router } from 'express';
import {
  createEnrollment,
  getEnrollments,
  updateEnrollment,
  bulkAssignSection,
} from '../controllers/enrollment.controller.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getEnrollments);
router.post('/', authorize('super_admin', 'school_admin'), createEnrollment);
router.put('/:id', authorize('super_admin', 'school_admin'), updateEnrollment);
router.post('/bulk-assign-section', authorize('super_admin', 'school_admin'), bulkAssignSection);

export default router;

