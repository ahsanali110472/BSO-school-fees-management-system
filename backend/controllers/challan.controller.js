import Challan from '../models/Challan.js';
import Enrollment from '../models/Enrollment.js';
import FeeStructure from '../models/FeeStructure.js';
import StudentConcession from '../models/StudentConcession.js';
import AcademicSession from '../models/AcademicSession.js';
import Class from '../models/Class.js';
import Student from '../models/Student.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const generateBatchChallans = async (req, res, next) => {
  try {
    const {
      academicSessionId,
      billingMonth,
      billingYear,
      classId,
      sectionId,
      studentId,
      dueDate,
      validityDate,
      includeAnnualFees = false,
    } = req.body;

    if (!billingMonth || !billingYear) {
      return sendError(res, 'Billing Month (1-12) and Billing Year are required', 400);
    }

    const monthNum = parseInt(billingMonth, 10);
    const yearNum = parseInt(billingYear, 10);
    if (monthNum < 1 || monthNum > 12) {
      return sendError(res, 'Billing Month must be between 1 and 12', 400);
    }

    // Resolve Academic Session
    let targetSessionId = academicSessionId;
    if (!targetSessionId) {
      const activeSession = await AcademicSession.findOne({ isCurrent: true });
      if (!activeSession) return sendError(res, 'No active academic session found', 400);
      targetSessionId = activeSession._id;
    }

    // Default Due Date: 10th of the billing month
    let resolvedDueDate = dueDate;
    if (!resolvedDueDate) {
      const d = new Date(yearNum, monthNum - 1, 10);
      resolvedDueDate = d;
    }

    // Default Validity Date: End of the billing month
    let resolvedValidityDate = validityDate;
    if (!resolvedValidityDate) {
      resolvedValidityDate = new Date(yearNum, monthNum, 0); // Last day of month
    }

    // 1. Fetch Active Enrollments in target session
    const enrollmentFilter = {
      academicSession: targetSessionId,
      status: 'active',
    };
    if (classId) enrollmentFilter.class = classId;
    if (sectionId) enrollmentFilter.section = sectionId;
    if (studentId) enrollmentFilter.student = studentId;

    const enrollments = await Enrollment.find(enrollmentFilter)
      .populate('student')
      .populate('class')
      .populate('section');

    if (enrollments.length === 0) {
      return sendError(res, 'No active students found for fee generation in this session/class', 404);
    }

    // 2. Fetch Fee Structures for classes in this session
    const feeStructures = await FeeStructure.find({
      academicSession: targetSessionId,
      status: 'active',
    }).populate('feeItems.feeHead');

    const structureMap = new Map();
    feeStructures.forEach((fs) => {
      structureMap.set(fs.class.toString(), fs);
    });

    // 3. Fetch Active Student Concessions in this session
    const studentConcessions = await StudentConcession.find({
      academicSession: targetSessionId,
      status: 'active',
    }).populate('concession');

    const concessionMap = new Map();
    studentConcessions.forEach((sc) => {
      const sId = sc.student.toString();
      if (!concessionMap.has(sId)) concessionMap.set(sId, []);
      concessionMap.get(sId).push(sc);
    });

    const monthLabel = `${MONTH_NAMES[monthNum - 1]} ${yearNum}`;
    let generatedCount = 0;
    let skippedCount = 0;
    let totalBilled = 0;
    const generatedChallans = [];

    for (const en of enrollments) {
      const student = en.student;
      if (!student) continue;

      // Check if challan already exists for this billing month
      const existingChallan = await Challan.findOne({
        student: student._id,
        billingMonth: monthNum,
        billingYear: yearNum,
        academicSession: targetSessionId,
        status: { $ne: 'void' },
      });

      if (existingChallan) {
        skippedCount++;
        continue;
      }

      const struct = structureMap.get(en.class._id.toString());
      if (!struct) {
        // Skip students whose class does not have fee structure configured yet
        skippedCount++;
        continue;
      }

      // Collect applicable fee items
      const applicableItems = [];
      let subTotal = 0;

      for (const item of struct.feeItems) {
        const head = item.feeHead;
        if (!head) continue;

        // Monthly fees are always included
        // Annual fees included if requested
        if (head.frequency === 'monthly' || (includeAnnualFees && head.frequency === 'annual')) {
          applicableItems.push({
            feeHead: head._id,
            headName: head.name,
            amount: item.amount,
          });
          subTotal += item.amount;
        }
      }

      // Calculate Concessions
      let totalConcession = 0;
      const concessionsForStudent = concessionMap.get(student._id.toString()) || [];

      for (const grant of concessionsForStudent) {
        const template = grant.concession;
        if (!template) continue;

        // Check if custom value override exists
        if (grant.customValue) {
          totalConcession += grant.customValue;
        } else if (template.type === 'fixed_amount') {
          totalConcession += template.value;
        } else if (template.type === 'percentage') {
          // Calculate percentage deduction on tuition fee (or subtotal if tuition not found)
          const tuitionItem = applicableItems.find((ai) => ai.headName.toLowerCase().includes('tuition'));
          const baseAmount = tuitionItem ? tuitionItem.amount : subTotal;
          totalConcession += Math.round((baseAmount * template.value) / 100);
        }
      }

      // Prevent concession from exceeding subTotal
      totalConcession = Math.min(subTotal, totalConcession);

      // Calculate previous unpaid arrears
      const previousUnpaidChallans = await Challan.find({
        student: student._id,
        status: { $in: ['unpaid', 'partially_paid', 'overdue'] },
        $or: [
          { billingYear: { $lt: yearNum } },
          { billingYear: yearNum, billingMonth: { $lt: monthNum } },
        ],
      });

      let arrears = 0;
      previousUnpaidChallans.forEach((pc) => {
        arrears += pc.balanceAmount;
      });

      const lateFine = struct.lateFineAmount || 200;
      const totalPayable = Math.max(0, subTotal - totalConcession + arrears);
      const totalPayableAfterDue = totalPayable + lateFine;

      // Create Challan
      const newChallan = await Challan.create({
        student: student._id,
        academicSession: targetSessionId,
        class: en.class._id,
        section: en.section?._id,
        rollNumber: en.rollNumber,
        billingMonth: monthNum,
        billingYear: yearNum,
        monthName: monthLabel,
        issueDate: new Date(),
        dueDate: resolvedDueDate,
        validityDate: resolvedValidityDate,
        feeItems: applicableItems,
        subTotal,
        concessionAmount: totalConcession,
        arrears,
        lateFineAmount: lateFine,
        totalPayable,
        totalPayableAfterDue,
        paidAmount: 0,
        balanceAmount: totalPayable,
        status: 'unpaid',
        generatedBy: req.user._id,
      });

      generatedCount++;
      totalBilled += totalPayable;
      if (generatedChallans.length < 5) generatedChallans.push(newChallan);
    }

    return sendSuccess(res, `Generated ${generatedCount} challan(s) for ${monthLabel}`, {
      generatedCount,
      skippedCount,
      totalBilled,
      monthLabel,
      sampleChallans: generatedChallans,
    }, 201);
  } catch (error) {
    next(error);
  }
};

export const getChallans = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      sessionId,
      classId,
      sectionId,
      studentId,
      month,
      year,
      status,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (sessionId) filter.academicSession = sessionId;
    if (classId) filter.class = classId;
    if (sectionId) filter.section = sectionId;
    if (studentId) filter.student = studentId;
    if (month) filter.billingMonth = parseInt(month, 10);
    if (year) filter.billingYear = parseInt(year, 10);
    if (status) {
      if (status === 'pending') {
        filter.status = { $in: ['unpaid', 'partially_paid'] };
      } else if (status.includes(',')) {
        filter.status = { $in: status.split(',').map((s) => s.trim()) };
      } else {
        filter.status = status;
      }
    }

    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      const matchingStudents = await Student.find({
        $or: [
          { name: searchRegex },
          { admissionNumber: searchRegex },
          { studentId: searchRegex },
          { 'father.name': searchRegex },
          { grNumber: searchRegex },
        ],
      }).select('_id');
      const studentIds = matchingStudents.map((s) => s._id);

      filter.$or = [
        { challanNumber: searchRegex },
        { rollNumber: searchRegex },
        { student: { $in: studentIds } },
      ];
    }

    const [total, challans] = await Promise.all([
      Challan.countDocuments(filter),
      Challan.find(filter)
        .populate('student', 'name studentId admissionNumber grNumber contact father')
        .populate('class', 'name code')
        .populate('section', 'name')
        .populate('academicSession', 'name isCurrent')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    return sendSuccess(res, 'Challans retrieved successfully', {
      challans,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getChallanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const challan = await Challan.findById(id)
      .populate('student', 'name studentId admissionNumber grNumber contact father address dateOfBirth gender')
      .populate('class', 'name code')
      .populate('section', 'name')
      .populate('academicSession', 'name isCurrent')
      .populate('generatedBy', 'name role email');

    if (!challan) {
      return sendError(res, 'Fee Challan not found', 404);
    }

    return sendSuccess(res, 'Challan details retrieved', { challan });
  } catch (error) {
    next(error);
  }
};

export const voidChallan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const challan = await Challan.findById(id);
    if (!challan) {
      return sendError(res, 'Challan not found', 404);
    }

    if (challan.paidAmount > 0) {
      return sendError(res, 'Cannot void a challan that has payments recorded against it. Reverse the payment first.', 400);
    }

    challan.status = 'void';
    challan.voidReason = reason ? reason.trim() : 'Cancelled by administration';
    await challan.save();

    return sendSuccess(res, `Challan ${challan.challanNumber} has been marked as void.`);
  } catch (error) {
    next(error);
  }
};
