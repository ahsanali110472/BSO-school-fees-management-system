import { Router } from 'express';
import {
  createSection,
  deleteSection,
  getSections,
  updateSection,
} from '../controllers/section.controller.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getSections);

router.post('/', authorize('super_admin', 'school_admin'), createSection);
router.put('/:id', authorize('super_admin', 'school_admin'), updateSection);
router.delete('/:id', authorize('super_admin', 'school_admin'), deleteSection);

export default router;
