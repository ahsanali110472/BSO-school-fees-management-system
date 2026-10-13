import { Router } from 'express';
import {
  createTimetableEntry,
  deleteTimetableEntry,
  getTimetable,
} from '../controllers/timetable.controller.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getTimetable);
router.post('/', authorize('super_admin', 'school_admin'), createTimetableEntry);
router.delete('/:id', authorize('super_admin', 'school_admin'), deleteTimetableEntry);

export default router;
