import express from 'express';
import {
  recordPayment,
  getPayments,
  getPaymentById,
  reversePayment,
  getPaymentSummary,
  initiateDigitalPayment,
} from '../controllers/payment.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Summary metrics
router.get('/summary', authorize('super_admin', 'school_admin', 'accountant'), getPaymentSummary);

// Digital payment initiation (Easypaisa / JazzCash)
router.post('/digital/initiate', authorize('super_admin', 'accountant'), initiateDigitalPayment);

// Payment collection and listing
router
  .route('/')
  .get(authorize('super_admin', 'school_admin', 'accountant'), getPayments)
  .post(authorize('super_admin', 'accountant'), recordPayment);

// Single receipt
router.route('/:id').get(authorize('super_admin', 'school_admin', 'accountant'), getPaymentById);

// Reverse payment
router.post('/:id/reverse', authorize('super_admin', 'accountant'), reversePayment);

export default router;
