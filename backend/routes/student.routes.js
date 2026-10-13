import { Router } from 'express';
import {
  deleteStudent,
  getStudentById,
  getStudents,
  registerStudent,
  updateStudent,
  bulkUpdateStatus,
  getBulkImportTemplate,
  bulkImportStudents,
} from '../controllers/student.controller.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

// Bulk Import & Template
router.get('/bulk-template', authorize('super_admin', 'school_admin'), getBulkImportTemplate);
router.post('/bulk-import', authorize('super_admin', 'school_admin'), bulkImportStudents);

router.get('/', getStudents);
router.get('/:id', getStudentById);

router.post('/', authorize('super_admin', 'school_admin'), registerStudent);
router.post('/bulk-status', authorize('super_admin', 'school_admin'), bulkUpdateStatus);
router.put('/:id', authorize('super_admin', 'school_admin'), updateStudent);
router.delete('/:id', authorize('super_admin', 'school_admin'), deleteStudent);

export default router;

