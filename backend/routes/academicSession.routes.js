import { Router } from 'express';
import {
  createSession,
  getCurrentSession,
  getSessions,
  setCurrentSession,
  updateSession,
} from '../controllers/academicSession.controller.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

// Protect all routes
router.use(protect);

router.get('/current', getCurrentSession);
router.get('/', getSessions);

// Write permissions restricted to Super Admin & School Admin
router.post('/', authorize('super_admin', 'school_admin'), createSession);
router.put('/:id', authorize('super_admin', 'school_admin'), updateSession);
router.patch('/:id/current', authorize('super_admin', 'school_admin'), setCurrentSession);

export default router;
