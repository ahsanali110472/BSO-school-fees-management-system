import { Router } from 'express';
import {
  createClass,
  deleteClass,
  getClassById,
  getClasses,
  updateClass,
} from '../controllers/class.controller.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getClasses);
router.get('/:id', getClassById);

router.post('/', authorize('super_admin', 'school_admin'), createClass);
router.put('/:id', authorize('super_admin', 'school_admin'), updateClass);
router.delete('/:id', authorize('super_admin', 'school_admin'), deleteClass);

export default router;
