import { Router } from 'express';
import {
  createAssignment,
  deleteAssignment,
  getAssignments,
} from '../controllers/teacherAssignment.controller.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getAssignments);
router.post('/', authorize('super_admin', 'school_admin'), createAssignment);
router.delete('/:id', authorize('super_admin', 'school_admin'), deleteAssignment);

export default router;
