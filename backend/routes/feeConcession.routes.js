import { Router } from 'express';
import {
  assignStudentConcession,
  createFeeConcession,
  getFeeConcessions,
  getStudentConcessions,
  revokeStudentConcession,
  updateFeeConcession,
} from '../controllers/feeConcession.controller.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

// Concession Templates
router.get('/', getFeeConcessions);
router.post('/', authorize('super_admin', 'school_admin', 'accountant'), createFeeConcession);
router.put('/:id', authorize('super_admin', 'school_admin', 'accountant'), updateFeeConcession);

// Student Assigned Concessions
router.get('/students', getStudentConcessions);
router.post('/assign', authorize('super_admin', 'school_admin', 'accountant'), assignStudentConcession);
router.patch('/revoke/:id', authorize('super_admin', 'school_admin', 'accountant'), revokeStudentConcession);

export default router;
