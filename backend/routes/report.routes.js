import express from 'express';
import {
  getCollections,
  exportCollectionsExcel,
  getOutstanding,
  exportOutstandingExcel,
  getStudentLedger,
  exportStudentLedgerExcel,
  getClassSummary,
  exportClassSummaryExcel,
  getPaymentMethods,
} from '../controllers/report.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All reporting routes require authenticated session with admin or accountant privileges
router.use(protect);
router.use(authorize('super_admin', 'school_admin', 'accountant'));

// 1. Collections Report (Daily / Monthly)
router.get('/collections', getCollections);
router.get('/collections/export-excel', exportCollectionsExcel);

// 2. Outstanding Fees / Defaulters
router.get('/outstanding', getOutstanding);
router.get('/outstanding/export-excel', exportOutstandingExcel);

// 3. Student Fee Ledger
router.get('/student-ledger/:studentId', getStudentLedger);
router.get('/student-ledger/:studentId/export-excel', exportStudentLedgerExcel);

// 4. Class & Section Summary
router.get('/class-summary', getClassSummary);
router.get('/class-summary/export-excel', exportClassSummaryExcel);

// 5. Payment Methods & Gateway Breakdown
router.get('/payment-methods', getPaymentMethods);

export default router;
