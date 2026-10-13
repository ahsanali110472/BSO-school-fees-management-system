import mongoose from 'mongoose';
import Challan from '../models/Challan.js';
import Payment from '../models/Payment.js';
import Student from '../models/Student.js';
import Enrollment from '../models/Enrollment.js';
import Class from '../models/Class.js';
import Section from '../models/Section.js';
import AcademicSession from '../models/AcademicSession.js';
import User from '../models/User.js';
import FeeHead from '../models/FeeHead.js';

class ReportService {
  /**
   * 1. Collections Report (Daily / Date-range / Monthly)
   */
  static async getCollectionsReport({
    startDate,
    endDate,
    sessionId,
    classId,
    paymentMethod,
  } = {}) {
    const filter = { status: 'completed' };

    // Date range filter
    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.paymentDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.paymentDate.$lte = end;
      }
    }

    if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
      filter.academicSession = sessionId;
    }
    if (classId && mongoose.Types.ObjectId.isValid(classId)) {
      filter.class = classId;
    }
    if (paymentMethod && paymentMethod !== 'all') {
      filter.paymentMethod = paymentMethod;
    }

    const payments = await Payment.find(filter)
      .populate('student', 'admissionNumber name father studentId contact')
      .populate('class', 'name code')
      .populate('academicSession', 'name year')
      .populate('challan', 'challanNumber monthName billingYear billingMonth totalPayable balanceAmount')
      .populate('receivedBy', 'name email')
      .sort({ paymentDate: -1 })
      .lean();

    let totalCollected = 0;
    const methodSummary = {};

    const rows = payments.map((p) => {
      const amount = Number(p.amount || 0);
      totalCollected += amount;

      const method = p.paymentMethod || 'other';
      methodSummary[method] = (methodSummary[method] || 0) + amount;

      return {
        receiptNumber: p.receiptNumber || 'N/A',
        paymentDate: p.paymentDate ? new Date(p.paymentDate).toISOString().split('T')[0] : 'N/A',
        studentId: p.student?.studentId || p.student?._id?.toString().slice(-6) || 'N/A',
        admissionNumber: p.student?.admissionNumber || 'N/A',
        studentName: p.student?.name || 'N/A',
        className: p.class?.name || 'N/A',
        feeMonth: p.challan ? `${p.challan.monthName || ''} ${p.challan.billingYear || ''}`.trim() : 'N/A',
        invoice: p.challan?.challanNumber || 'N/A',
        amount: amount,
        paymentMethod: p.paymentMethod?.replace('_', ' ').toUpperCase() || 'CASH',
        transactionId: p.transactionId || '-',
        receivedBy: p.receivedBy?.name || 'Cashier',
      };
    });

    return {
      summary: {
        totalRecords: rows.length,
        totalCollected,
        methodSummary,
      },
      rows,
    };
  }

  /**
   * 2. Outstanding Fees / Defaulters Report
   */
  static async getOutstandingReport({
    sessionId,
    classId,
    sectionId,
    minOverdueDays = 0,
    search = '',
  } = {}) {
    const filter = {
      status: { $in: ['unpaid', 'partially_paid', 'overdue'] },
      balanceAmount: { $gt: 0 },
    };

    if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
      filter.academicSession = sessionId;
    }
    if (classId && mongoose.Types.ObjectId.isValid(classId)) {
      filter.class = classId;
    }
    if (sectionId && mongoose.Types.ObjectId.isValid(sectionId)) {
      filter.section = sectionId;
    }

    const challans = await Challan.find(filter)
      .populate('student', 'admissionNumber name father studentId contact')
      .populate('class', 'name code')
      .populate('section', 'name')
      .populate('academicSession', 'name year')
      .sort({ dueDate: 1, balanceAmount: -1 })
      .lean();

    const now = new Date();
    let totalPayableSum = 0;
    let totalPaidSum = 0;
    let totalOutstandingSum = 0;

    let rows = challans.map((c) => {
      const payable = Number(c.totalPayable || 0);
      const paid = Number(c.paidAmount || 0);
      const balance = Number(c.balanceAmount || 0);

      const dueDate = c.dueDate ? new Date(c.dueDate) : null;
      let daysOverdue = 0;
      if (dueDate && dueDate < now) {
        daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      totalPayableSum += payable;
      totalPaidSum += paid;
      totalOutstandingSum += balance;

      return {
        id: c._id,
        challanNumber: c.challanNumber || 'N/A',
        studentId: c.student?.studentId || c.student?._id?.toString().slice(-6) || 'N/A',
        admissionNumber: c.student?.admissionNumber || 'N/A',
        studentName: c.student?.name || 'N/A',
        fatherName: c.student?.father?.name || 'N/A',
        phone: c.student?.contact?.phone || 'N/A',
        className: c.class?.name || 'N/A',
        sectionName: c.section?.name || 'Default',
        feeMonth: `${c.monthName || ''} ${c.billingYear || ''}`.trim(),
        dueDate: dueDate ? dueDate.toISOString().split('T')[0] : 'N/A',
        daysOverdue,
        totalPayable: payable,
        paidAmount: paid,
        balanceAmount: balance,
        status: (c.status || 'unpaid').toUpperCase(),
      };
    });

    if (minOverdueDays > 0) {
      rows = rows.filter((r) => r.daysOverdue >= minOverdueDays);
    }

    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      rows = rows.filter(
        (r) =>
          r.admissionNumber.toLowerCase().includes(q) ||
          r.studentName.toLowerCase().includes(q) ||
          r.fatherName.toLowerCase().includes(q) ||
          r.challanNumber.toLowerCase().includes(q)
      );
    }

    return {
      summary: {
        totalRecords: rows.length,
        totalPayable: totalPayableSum,
        totalPaid: totalPaidSum,
        totalOutstanding: totalOutstandingSum,
      },
      rows,
    };
  }

  /**
   * 3. Student Fee Ledger (Debit & Credit Statement)
   */
  static async getStudentLedger(studentId) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new Error('Invalid student ID format');
    }

    const student = await Student.findById(studentId).lean();

    if (!student) {
      throw new Error('Student not found');
    }

    // Lookup student active enrollment for class, section and session
    const enrollment = await Enrollment.findOne({ student: studentId, status: 'active' })
      .populate('class', 'name code')
      .populate('section', 'name')
      .populate('academicSession', 'name year')
      .lean();

    // Fetch all challans (debit records)
    const challans = await Challan.find({
      student: studentId,
      status: { $ne: 'void' },
    })
      .sort({ issueDate: 1 })
      .lean();

    // Fetch all payments (credit records)
    const payments = await Payment.find({
      student: studentId,
      status: 'completed',
    })
      .sort({ paymentDate: 1 })
      .lean();

    // Combine transactions chronologically
    const transactions = [];

    challans.forEach((c) => {
      transactions.push({
        date: c.issueDate || c.createdAt,
        type: 'INVOICE',
        reference: c.challanNumber || 'CHALLAN',
        description: `Fee Challan for ${c.monthName || ''} ${c.billingYear || ''}`,
        debit: Number(c.totalPayable || 0),
        credit: 0,
        rawDoc: c,
      });
    });

    payments.forEach((p) => {
      transactions.push({
        date: p.paymentDate || p.createdAt,
        type: 'PAYMENT',
        reference: p.receiptNumber || 'RECEIPT',
        description: `Fee Payment via ${(p.paymentMethod || 'cash').replace('_', ' ').toUpperCase()}${p.transactionId ? ` (${p.transactionId})` : ''}`,
        debit: 0,
        credit: Number(p.amount || 0),
        rawDoc: p,
      });
    });

    // Sort by timestamp
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Compute running balance
    let runningBalance = 0;
    let totalDebit = 0;
    let totalCredit = 0;

    const ledgerRows = transactions.map((t) => {
      totalDebit += t.debit;
      totalCredit += t.credit;
      runningBalance += t.debit - t.credit;

      return {
        date: t.date ? new Date(t.date).toISOString().split('T')[0] : 'N/A',
        type: t.type,
        reference: t.reference,
        description: t.description,
        debit: t.debit,
        credit: t.credit,
        balance: runningBalance,
      };
    });

    return {
      student: {
        id: student._id,
        admissionNumber: student.admissionNumber,
        fullName: student.name,
        fatherName: student.father?.name || 'N/A',
        className: enrollment?.class?.name || 'N/A',
        sectionName: enrollment?.section?.name || 'N/A',
        sessionName: enrollment?.academicSession?.name || 'N/A',
        status: student.status,
      },
      summary: {
        totalBilled: totalDebit,
        totalPaid: totalCredit,
        currentBalance: runningBalance,
        status: runningBalance <= 0 ? 'CLEARED' : 'PENDING',
      },
      ledger: ledgerRows,
    };
  }

  /**
   * 4. Class & Section Summary Report
   */
  static async getClassSummaryReport({ sessionId } = {}) {
    const filter = { status: { $ne: 'void' } };
    if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
      filter.academicSession = sessionId;
    }

    const classes = await Class.find({ status: 'active' }).sort({ order: 1, name: 1 }).lean();

    const challans = await Challan.find(filter).lean();

    let grandBilled = 0;
    let grandPaid = 0;
    let grandBalance = 0;

    const classStatsMap = {};
    classes.forEach((cls) => {
      classStatsMap[cls._id.toString()] = {
        classId: cls._id,
        className: cls.name,
        code: cls.code,
        challanCount: 0,
        totalBilled: 0,
        totalPaid: 0,
        totalBalance: 0,
      };
    });

    challans.forEach((c) => {
      const clsId = c.class ? c.class.toString() : null;
      if (clsId && classStatsMap[clsId]) {
        const billed = Number(c.totalPayable || 0);
        const paid = Number(c.paidAmount || 0);
        const bal = Number(c.balanceAmount || 0);

        classStatsMap[clsId].challanCount += 1;
        classStatsMap[clsId].totalBilled += billed;
        classStatsMap[clsId].totalPaid += paid;
        classStatsMap[clsId].totalBalance += bal;

        grandBilled += billed;
        grandPaid += paid;
        grandBalance += bal;
      }
    });

    const rows = Object.values(classStatsMap).map((row) => {
      const rate = row.totalBilled > 0 ? ((row.totalPaid / row.totalBilled) * 100).toFixed(1) : '0.0';
      return {
        ...row,
        collectionRate: `${rate}%`,
      };
    });

    const overallRate = grandBilled > 0 ? ((grandPaid / grandBilled) * 100).toFixed(1) : '0.0';

    return {
      summary: {
        totalClasses: classes.length,
        totalBilled: grandBilled,
        totalPaid: grandPaid,
        totalBalance: grandBalance,
        overallCollectionRate: `${overallRate}%`,
      },
      rows,
    };
  }

  /**
   * 5. Payment Methods & Gateway Breakdown
   */
  static async getPaymentMethodBreakdown({ startDate, endDate, sessionId } = {}) {
    const filter = { status: 'completed' };

    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.paymentDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.paymentDate.$lte = end;
      }
    }

    if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
      filter.academicSession = sessionId;
    }

    const aggregation = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    let grandTotal = 0;
    let grandCount = 0;

    const methods = aggregation.map((item) => {
      grandTotal += item.totalAmount;
      grandCount += item.count;
      return {
        method: (item._id || 'cash').replace('_', ' ').toUpperCase(),
        code: item._id || 'cash',
        transactionCount: item.count,
        totalAmount: item.totalAmount,
      };
    });

    const rows = methods.map((m) => ({
      ...m,
      percentage: grandTotal > 0 ? ((m.totalAmount / grandTotal) * 100).toFixed(1) + '%' : '0.0%',
    }));

    return {
      summary: {
        totalTransactions: grandCount,
        grandTotal,
      },
      rows,
    };
  }
}

export default ReportService;
