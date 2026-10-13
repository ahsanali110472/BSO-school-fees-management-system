import ReportService from '../services/report.service.js';
import ExcelExportService from '../services/excelExport.service.js';

/**
 * 1. Collections Report (Daily & Monthly)
 */
export const getCollections = async (req, res, next) => {
  try {
    const { startDate, endDate, sessionId, classId, paymentMethod } = req.query;
    const report = await ReportService.getCollectionsReport({
      startDate,
      endDate,
      sessionId,
      classId,
      paymentMethod,
    });

    res.json({
      success: true,
      message: 'Collections report fetched successfully',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export Collections to genuine Excel .xlsx
 */
export const exportCollectionsExcel = async (req, res, next) => {
  try {
    const { startDate, endDate, sessionId, classId, paymentMethod } = req.query;
    const report = await ReportService.getCollectionsReport({
      startDate,
      endDate,
      sessionId,
      classId,
      paymentMethod,
    });

    const columns = [
      { header: 'Receipt #', key: 'receiptNumber', width: 16 },
      { header: 'Payment Date', key: 'paymentDate', width: 14 },
      { header: 'Student ID', key: 'studentId', width: 14 },
      { header: 'Admission #', key: 'admissionNumber', width: 16 },
      { header: 'Student Name', key: 'studentName', width: 22 },
      { header: 'Class', key: 'className', width: 14 },
      { header: 'Fee Month', key: 'feeMonth', width: 16 },
      { header: 'Invoice #', key: 'invoice', width: 16 },
      { header: 'Amount (PKR)', key: 'amount', width: 16, isCurrency: true },
      { header: 'Method', key: 'paymentMethod', width: 16 },
      { header: 'Txn Ref', key: 'transactionId', width: 16 },
      { header: 'Received By', key: 'receivedBy', width: 16 },
    ];

    const filterSummary = [];
    if (startDate || endDate) filterSummary.push(`Period: ${startDate || 'Any'} to ${endDate || 'Any'}`);
    if (paymentMethod && paymentMethod !== 'all') filterSummary.push(`Method: ${paymentMethod}`);

    const buffer = await ExcelExportService.createReportWorkbook({
      sheetName: 'Collections',
      reportTitle: 'Fee Collections & Receipts Report',
      filterSummary,
      columns,
      data: report.rows,
      totals: {
        receiptNumber: 'TOTAL',
        amount: report.summary.totalCollected,
      },
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Collections_Report.xlsx"');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Outstanding Fees / Defaulters Report
 */
export const getOutstanding = async (req, res, next) => {
  try {
    const { sessionId, classId, sectionId, minOverdueDays, search } = req.query;
    const report = await ReportService.getOutstandingReport({
      sessionId,
      classId,
      sectionId,
      minOverdueDays: minOverdueDays ? parseInt(minOverdueDays, 10) : 0,
      search,
    });

    res.json({
      success: true,
      message: 'Outstanding fees report fetched successfully',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export Outstanding Fees to genuine Excel .xlsx
 */
export const exportOutstandingExcel = async (req, res, next) => {
  try {
    const { sessionId, classId, sectionId, minOverdueDays, search } = req.query;
    const report = await ReportService.getOutstandingReport({
      sessionId,
      classId,
      sectionId,
      minOverdueDays: minOverdueDays ? parseInt(minOverdueDays, 10) : 0,
      search,
    });

    const columns = [
      { header: 'Challan #', key: 'challanNumber', width: 16 },
      { header: 'Admission #', key: 'admissionNumber', width: 14 },
      { header: 'Student Name', key: 'studentName', width: 20 },
      { header: 'Father Name', key: 'fatherName', width: 20 },
      { header: 'Class', key: 'className', width: 12 },
      { header: 'Section', key: 'sectionName', width: 10 },
      { header: 'Fee Month', key: 'feeMonth', width: 14 },
      { header: 'Due Date', key: 'dueDate', width: 14 },
      { header: 'Days Overdue', key: 'daysOverdue', width: 14, align: 'center' },
      { header: 'Total Payable', key: 'totalPayable', width: 15, isCurrency: true },
      { header: 'Paid Amount', key: 'paidAmount', width: 15, isCurrency: true },
      { header: 'Remaining Balance', key: 'balanceAmount', width: 18, isCurrency: true },
      { header: 'Status', key: 'status', width: 12, align: 'center' },
      { header: 'Phone / Contact', key: 'phone', width: 16 },
    ];

    const filterSummary = [];
    if (minOverdueDays) filterSummary.push(`Min Overdue: ${minOverdueDays} days`);

    const buffer = await ExcelExportService.createReportWorkbook({
      sheetName: 'Defaulters',
      reportTitle: 'Outstanding Fees & Defaulters Report',
      filterSummary,
      columns,
      data: report.rows,
      totals: {
        challanNumber: 'TOTAL',
        totalPayable: report.summary.totalPayable,
        paidAmount: report.summary.totalPaid,
        balanceAmount: report.summary.totalOutstanding,
      },
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Outstanding_Fees_Report.xlsx"');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Student Fee Ledger (Debit & Credit Statement)
 */
export const getStudentLedger = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const report = await ReportService.getStudentLedger(studentId);

    res.json({
      success: true,
      message: 'Student fee ledger retrieved successfully',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export Student Fee Ledger to genuine Excel .xlsx
 */
export const exportStudentLedgerExcel = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const report = await ReportService.getStudentLedger(studentId);

    const columns = [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Type', key: 'type', width: 12, align: 'center' },
      { header: 'Reference #', key: 'reference', width: 18 },
      { header: 'Description', key: 'description', width: 34 },
      { header: 'Debit (Billed)', key: 'debit', width: 16, isCurrency: true },
      { header: 'Credit (Paid)', key: 'credit', width: 16, isCurrency: true },
      { header: 'Running Balance', key: 'balance', width: 18, isCurrency: true },
    ];

    const studentInfo = report.student;
    const filterSummary = [
      `Student: ${studentInfo.fullName} (${studentInfo.admissionNumber})`,
      `Class: ${studentInfo.className} - ${studentInfo.sectionName}`,
      `Current Balance: PKR ${report.summary.currentBalance.toLocaleString()}`,
    ];

    const buffer = await ExcelExportService.createReportWorkbook({
      sheetName: 'Student Ledger',
      reportTitle: `Student Financial Fee Ledger — ${studentInfo.fullName}`,
      filterSummary,
      columns,
      data: report.ledger,
      totals: {
        date: 'TOTAL',
        debit: report.summary.totalBilled,
        credit: report.summary.totalPaid,
        balance: report.summary.currentBalance,
      },
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Ledger_${studentInfo.admissionNumber || 'Student'}.xlsx"`
    );
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Class & Section Summary Report
 */
export const getClassSummary = async (req, res, next) => {
  try {
    const { sessionId } = req.query;
    const report = await ReportService.getClassSummaryReport({ sessionId });

    res.json({
      success: true,
      message: 'Class fee summary fetched successfully',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export Class Revenue Summary to genuine Excel .xlsx
 */
export const exportClassSummaryExcel = async (req, res, next) => {
  try {
    const { sessionId } = req.query;
    const report = await ReportService.getClassSummaryReport({ sessionId });

    const columns = [
      { header: 'Class Name', key: 'className', width: 18 },
      { header: 'Code', key: 'code', width: 12 },
      { header: 'Total Challans', key: 'challanCount', width: 16, align: 'center' },
      { header: 'Total Invoiced (PKR)', key: 'totalBilled', width: 20, isCurrency: true },
      { header: 'Total Collected (PKR)', key: 'totalPaid', width: 20, isCurrency: true },
      { header: 'Outstanding Balance (PKR)', key: 'totalBalance', width: 22, isCurrency: true },
      { header: 'Recovery Rate', key: 'collectionRate', width: 16, align: 'center' },
    ];

    const buffer = await ExcelExportService.createReportWorkbook({
      sheetName: 'Class Summary',
      reportTitle: 'Class-Wise Fee Revenue & Recovery Summary',
      columns,
      data: report.rows,
      totals: {
        className: 'TOTAL',
        totalBilled: report.summary.totalBilled,
        totalPaid: report.summary.totalPaid,
        totalBalance: report.summary.totalBalance,
        collectionRate: report.summary.overallCollectionRate,
      },
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Class_Revenue_Summary.xlsx"');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Payment Methods & Gateway Breakdown
 */
export const getPaymentMethods = async (req, res, next) => {
  try {
    const { startDate, endDate, sessionId } = req.query;
    const report = await ReportService.getPaymentMethodBreakdown({
      startDate,
      endDate,
      sessionId,
    });

    res.json({
      success: true,
      message: 'Payment method breakdown retrieved successfully',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};
