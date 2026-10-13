import { Router } from 'express';
import {
  createTeacher,
  deleteTeacher,
  getTeacherById,
  getTeachers,
  updateTeacher,
} from '../controllers/teacher.controller.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getTeachers);
router.get('/:id', getTeacherById);

router.post('/', authorize('super_admin', 'school_admin'), createTeacher);
router.put('/:id', authorize('super_admin', 'school_admin'), updateTeacher);
router.delete('/:id', authorize('super_admin', 'school_admin'), deleteTeacher);

export default router;
