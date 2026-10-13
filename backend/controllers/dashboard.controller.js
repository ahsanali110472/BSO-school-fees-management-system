import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import Section from '../models/Section.js';
import Challan from '../models/Challan.js';
import Payment from '../models/Payment.js';
import Enrollment from '../models/Enrollment.js';
import AcademicSession from '../models/AcademicSession.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const userRole = req.user?.role || 'super_admin';

    // 1. Core entity counts
    const [totalStudents, totalTeachers, totalClasses, totalSections, activeSession] =
      await Promise.all([
        Student.countDocuments({ status: 'active' }),
        Teacher.countDocuments({ status: 'active' }),
        Class.countDocuments({ status: 'active' }),
        Section.countDocuments({ status: 'active' }),
        AcademicSession.findOne({ isCurrent: true }).lean(),
      ]);

    // 2. Financial Metrics (for Super Admin & Accountant)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Today's Collection
    const todayPaymentsAgg = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          paymentDate: { $gte: startOfToday, $lte: endOfToday },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);
    const todayCollection = todayPaymentsAgg[0]?.total || 0;
    const todayCount = todayPaymentsAgg[0]?.count || 0;

    // This Month's Collection
    const monthPaymentsAgg = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);
    const monthCollection = monthPaymentsAgg[0]?.total || 0;
    const monthCount = monthPaymentsAgg[0]?.count || 0;

    // Total Outstanding & Pending Challans
    const outstandingAgg = await Challan.aggregate([
      {
        $match: {
          status: { $in: ['unpaid', 'partially_paid', 'overdue'] },
          balanceAmount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          totalOutstanding: { $sum: '$balanceAmount' },
          totalInvoiced: { $sum: '$totalPayable' },
          totalPaid: { $sum: '$paidAmount' },
          pendingCount: { $sum: 1 },
        },
      },
    ]);
    const totalOutstanding = outstandingAgg[0]?.totalOutstanding || 0;
    const pendingInvoicesCount = outstandingAgg[0]?.pendingCount || 0;
    const totalInvoiced = outstandingAgg[0]?.totalInvoiced || 0;

    // 3. Payment Method Distribution
    const methodAgg = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);
    const paymentMethods = methodAgg.map((m) => ({
      method: (m._id || 'cash').replace('_', ' ').toUpperCase(),
      code: m._id || 'cash',
      totalAmount: m.totalAmount,
      count: m.count,
    }));

    // 4. Recent Completed Payments
    const rawRecentPayments = await Payment.find({ status: 'completed' })
      .populate('student', 'name admissionNumber studentId')
      .populate('class', 'name')
      .populate('challan', 'monthName billingYear')
      .sort({ paymentDate: -1, createdAt: -1 })
      .limit(6)
      .lean();

    const recentPayments = rawRecentPayments.map((p) => ({
      id: p._id,
      receiptNumber: p.receiptNumber,
      studentName: p.student?.name || 'Student',
      admissionNumber: p.student?.admissionNumber || '-',
      className: p.class?.name || 'Class',
      feeMonth: p.challan ? `${p.challan.monthName} ${p.challan.billingYear}` : 'Fee',
      amount: p.amount,
      paymentMethod: (p.paymentMethod || 'cash').replace('_', ' ').toUpperCase(),
      date: p.paymentDate ? new Date(p.paymentDate).toISOString().split('T')[0] : 'Today',
    }));

    // 5. Recent Admissions (for Super Admin & School Admin)
    const rawRecentStudents = await Student.find({ status: 'active' })
      .sort({ admissionDate: -1, createdAt: -1 })
      .limit(6)
      .lean();

    const studentIds = rawRecentStudents.map((s) => s._id);
    const enrollments = await Enrollment.find({
      student: { $in: studentIds },
      status: 'active',
    })
      .populate('class', 'name')
      .populate('section', 'name')
      .lean();

    const enrollmentMap = {};
    enrollments.forEach((e) => {
      enrollmentMap[e.student.toString()] = e;
    });

    const recentAdmissions = rawRecentStudents.map((s) => {
      const enr = enrollmentMap[s._id.toString()];
      return {
        id: s._id,
        name: s.name,
        admissionNumber: s.admissionNumber,
        fatherName: s.father?.name || '-',
        className: enr?.class?.name || 'N/A',
        sectionName: enr?.section?.name || 'A',
        admissionDate: s.admissionDate ? new Date(s.admissionDate).toISOString().split('T')[0] : '-',
      };
    });

    // 6. Class Enrollment Breakdown (for School Admin & Super Admin)
    const classEnrollmentAgg = await Enrollment.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$class', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'classes',
          localField: '_id',
          foreignField: '_id',
          as: 'classDoc',
        },
      },
      { $unwind: '$classDoc' },
      { $sort: { 'classDoc.order': 1, 'classDoc.name': 1 } },
      { $limit: 8 },
    ]);

    const classDistribution = classEnrollmentAgg.map((c) => ({
      className: c.classDoc.name,
      students: c.count,
    }));

    // 7. Last 6 Months Revenue Trend
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyPaymentsAgg = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          paymentDate: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' },
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const found = monthlyPaymentsAgg.find((item) => item._id.year === y && item._id.month === m);
      monthlyTrends.push({
        month: `${monthNames[m - 1]} ${y.toString().slice(-2)}`,
        collected: found ? found.total : 0,
      });
    }

    res.json({
      success: true,
      data: {
        role: userRole,
        activeSession: activeSession?.name || '2026-27',
        counts: {
          totalStudents,
          totalTeachers,
          totalClasses,
          totalSections,
        },
        financials: {
          todayCollection,
          todayCount,
          monthCollection,
          monthCount,
          totalOutstanding,
          pendingInvoicesCount,
          totalInvoiced,
        },
        paymentMethods,
        recentPayments,
        recentAdmissions,
        classDistribution,
        monthlyTrends,
      },
    });
  } catch (error) {
    next(error);
  }
};
