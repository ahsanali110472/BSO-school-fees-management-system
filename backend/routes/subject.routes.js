import { Router } from 'express';
import {
  createSubject,
  deleteSubject,
  getSubjects,
  updateSubject,
} from '../controllers/subject.controller.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getSubjects);

router.post('/', authorize('super_admin', 'school_admin'), createSubject);
router.put('/:id', authorize('super_admin', 'school_admin'), updateSubject);
router.delete('/:id', authorize('super_admin', 'school_admin'), deleteSubject);

export default router;
