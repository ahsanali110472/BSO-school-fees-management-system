import { Router } from 'express';
import {
  getTransferCertificateById,
  getTransferCertificates,
  issueTransferCertificate,
} from '../controllers/transfer.controller.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getTransferCertificates);
router.get('/:id', getTransferCertificateById);
router.post('/issue', authorize('super_admin', 'school_admin'), issueTransferCertificate);

export default router;
