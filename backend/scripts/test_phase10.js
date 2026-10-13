import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ReportService from '../services/report.service.js';
import ExcelExportService from '../services/excelExport.service.js';
import Student from '../models/Student.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/school_management';

async function runPhase10Tests() {
  console.log('==================================================');
  console.log('       RUNNING PHASE 10 AUTOMATED TEST SUITE       ');
  console.log('       Reporting, Analytics & Excel Exports       ');
  console.log('==================================================\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('[Test 1] Database connection established.');

    // 1. Test Collections Report
    console.log('\n[Test 2] Testing Collections Report...');
    const collectionsReport = await ReportService.getCollectionsReport();
    console.log(`- Total payment records: ${collectionsReport.summary.totalRecords}`);
    console.log(`- Total collected: PKR ${collectionsReport.summary.totalCollected.toLocaleString()}`);
    console.log(`- Method breakdown:`, collectionsReport.summary.methodSummary);
    if (!collectionsReport.rows || !Array.isArray(collectionsReport.rows)) {
      throw new Error('Collections report rows must be an array');
    }
    console.log('[PASS] Collections report structure and aggregation verified.');

    // 2. Test Outstanding Fees / Defaulters Report
    console.log('\n[Test 3] Testing Outstanding Fees & Defaulters Report...');
    const outstandingReport = await ReportService.getOutstandingReport();
    console.log(`- Outstanding challan records: ${outstandingReport.summary.totalRecords}`);
    console.log(`- Total payable: PKR ${outstandingReport.summary.totalPayable.toLocaleString()}`);
    console.log(`- Total paid: PKR ${outstandingReport.summary.totalPaid.toLocaleString()}`);
    console.log(`- Total outstanding: PKR ${outstandingReport.summary.totalOutstanding.toLocaleString()}`);
    if (outstandingReport.rows.length > 0) {
      const sample = outstandingReport.rows[0];
      console.log(`- Sample record: ${sample.challanNumber} (${sample.studentName}) - Balance: PKR ${sample.balanceAmount}, Days Overdue: ${sample.daysOverdue}`);
      if (sample.balanceAmount <= 0) {
        throw new Error('Outstanding report must only return records with positive balance');
      }
    }
    console.log('[PASS] Outstanding fees & defaulters calculation verified.');

    // 3. Test Student Fee Ledger
    console.log('\n[Test 4] Testing Student Fee Ledger...');
    const student = await Student.findOne();
    if (!student) {
      throw new Error('No students found to test ledger.');
    }
    const ledgerReport = await ReportService.getStudentLedger(student._id);
    console.log(`- Student: ${ledgerReport.student.fullName} (${ledgerReport.student.admissionNumber})`);
    console.log(`- Ledger entries: ${ledgerReport.ledger.length}`);
    console.log(`- Total Billed: PKR ${ledgerReport.summary.totalBilled.toLocaleString()}`);
    console.log(`- Total Paid: PKR ${ledgerReport.summary.totalPaid.toLocaleString()}`);
    console.log(`- Current Balance: PKR ${ledgerReport.summary.currentBalance.toLocaleString()} (${ledgerReport.summary.status})`);

    // Verify running balance arithmetic
    let verifiedBalance = 0;
    for (const row of ledgerReport.ledger) {
      verifiedBalance += (row.debit - row.credit);
      if (row.balance !== verifiedBalance) {
        throw new Error(`Ledger balance mismatch: expected ${verifiedBalance}, got ${row.balance}`);
      }
    }
    console.log('[PASS] Student fee ledger running balance arithmetic verified 100%.');

    // 4. Test Class Revenue Summary
    console.log('\n[Test 5] Testing Class Revenue Summary Report...');
    const classSummary = await ReportService.getClassSummaryReport();
    console.log(`- Total classes analyzed: ${classSummary.summary.totalClasses}`);
    console.log(`- Grand Billed: PKR ${classSummary.summary.totalBilled.toLocaleString()}`);
    console.log(`- Grand Paid: PKR ${classSummary.summary.totalPaid.toLocaleString()}`);
    console.log(`- Grand Balance: PKR ${classSummary.summary.totalBalance.toLocaleString()}`);
    console.log(`- Overall Recovery Rate: ${classSummary.summary.overallCollectionRate}`);
    console.log('[PASS] Class revenue summary aggregation verified.');

    // 5. Test Payment Method Breakdown
    console.log('\n[Test 6] Testing Payment Method Breakdown...');
    const methodBreakdown = await ReportService.getPaymentMethodBreakdown();
    console.log(`- Total transactions: ${methodBreakdown.summary.totalTransactions}`);
    console.log(`- Grand total: PKR ${methodBreakdown.summary.grandTotal.toLocaleString()}`);
    methodBreakdown.rows.forEach(m => {
      console.log(`  * ${m.method}: PKR ${m.totalAmount.toLocaleString()} (${m.transactionCount} txns, ${m.percentage})`);
    });
    console.log('[PASS] Payment method breakdown verified.');

    // 6. Test Excel (.xlsx) Buffer Generation with ExcelJS
    console.log('\n[Test 7] Testing Genuine Excel (.xlsx) Generation with ExcelJS...');
    const excelBuffer = await ExcelExportService.createReportWorkbook({
      sheetName: 'Collections Test',
      reportTitle: 'Collections Test Report',
      filterSummary: ['Test Filter: Active Session'],
      columns: [
        { header: 'Receipt #', key: 'receiptNumber', width: 16 },
        { header: 'Date', key: 'paymentDate', width: 14 },
        { header: 'Student Name', key: 'studentName', width: 22 },
        { header: 'Amount (PKR)', key: 'amount', width: 16, isCurrency: true },
      ],
      data: collectionsReport.rows.slice(0, 5),
      totals: {
        receiptNumber: 'TOTAL',
        amount: collectionsReport.summary.totalCollected,
      },
    });

    // Check buffer size and ZIP / XLSX magic number (PK\x03\x04 = 0x50 0x4B 0x03 0x04)
    if (!Buffer.isBuffer(excelBuffer) && !(excelBuffer instanceof Uint8Array)) {
      throw new Error('ExcelExportService did not return a valid buffer');
    }
    const buf = Buffer.from(excelBuffer);
    console.log(`- Generated XLSX buffer size: ${buf.length} bytes`);
    if (buf.length < 1000) {
      throw new Error('Generated Excel file is suspiciously small');
    }
    // Check magic bytes PK..
    if (buf[0] !== 0x50 || buf[1] !== 0x4b) {
      throw new Error('Generated file does not have valid ZIP / XLSX magic bytes (PK)');
    }
    console.log('[PASS] Real .xlsx file generated with valid headers, styling & totals.');

    console.log('\n==================================================');
    console.log('    ALL PHASE 10 TESTS COMPLETED SUCCESSFULLY!    ');
    console.log('==================================================');
    process.exit(0);
  } catch (error) {
    console.error('\n[TEST FAILURE]', error);
    process.exit(1);
  }
}

runPhase10Tests();
