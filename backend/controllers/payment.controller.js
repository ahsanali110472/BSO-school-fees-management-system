import Payment from '../models/Payment.js';
import Challan from '../models/Challan.js';
import Student from '../models/Student.js';
import paymentGatewayService from '../services/paymentGateway.service.js';
import AuditService from '../services/audit.service.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

/**
 * Record a fee payment against a Challan
 * POST /api/payments
 */
export const recordPayment = async (req, res, next) => {
  try {
    const {
      challanId,
      challanNumber,
      amount,
      paymentMethod = 'cash',
      transactionId = '',
      bankName = '',
      notes = '',
      paymentDate = new Date(),
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return sendError(res, 'Payment amount must be a positive number', 400);
    }

    // Locate Challan either by ID or by Challan Number
    let challan;
    if (challanId) {
      challan = await Challan.findById(challanId);
    } else if (challanNumber) {
      challan = await Challan.findOne({ challanNumber: challanNumber.trim().toUpperCase() });
    }

    if (!challan) {
      return sendError(res, 'Challan not found', 404);
    }

    if (challan.status === 'void') {
      return sendError(res, 'Cannot record payment for a void challan', 400);
    }

    if (challan.status === 'paid' && challan.balanceAmount <= 0) {
      return sendError(res, 'This challan has already been fully paid', 400);
    }

    const payAmount = Math.round(Number(amount) * 100) / 100;

    // Enforce overpayment guard
    if (payAmount > challan.balanceAmount) {
      return sendError(
        res,
        `Payment amount (PKR ${payAmount.toLocaleString()}) exceeds the outstanding balance (PKR ${challan.balanceAmount.toLocaleString()})`,
        400
      );
    }

    // Create Payment Record
    const payment = new Payment({
      challan: challan._id,
      student: challan.student,
      academicSession: challan.academicSession,
      class: challan.class,
      amount: payAmount,
      paymentMethod,
      transactionId: transactionId ? transactionId.trim() : '',
      bankName: bankName ? bankName.trim() : '',
      paymentDate: paymentDate || new Date(),
      receivedBy: req.user._id,
      notes: notes ? notes.trim() : '',
      status: 'completed',
    });

    await payment.save();

    // Update Challan balances atomically
    challan.paidAmount = Math.round((challan.paidAmount + payAmount) * 100) / 100;
    challan.balanceAmount = Math.max(0, Math.round((challan.totalPayable - challan.paidAmount) * 100) / 100);

    if (challan.balanceAmount === 0) {
      challan.status = 'paid';
    } else {
      challan.status = 'partially_paid';
    }

    await challan.save();

    const populatedPayment = await Payment.findById(payment._id)
      .populate('student', 'name studentId admissionNumber father contact')
      .populate('class', 'name code')
      .populate('academicSession', 'name')
      .populate('challan', 'challanNumber monthName billingYear totalPayable paidAmount balanceAmount dueDate')
      .populate('receivedBy', 'name email role');

    AuditService.log({
      req,
      action: 'RECORD_PAYMENT',
      module: 'PAYMENTS',
      recordId: payment._id,
      description: `Payment of PKR ${payAmount.toLocaleString()} recorded for Challan ${challan.challanNumber} (${payment.paymentMethod.toUpperCase()})`,
      newData: {
        receiptNumber: payment.receiptNumber,
        challanNumber: challan.challanNumber,
        amount: payAmount,
        paymentMethod: payment.paymentMethod,
        remainingBalance: challan.balanceAmount,
      },
    });

    return sendSuccess(
      res,
      'Payment recorded successfully',
      {
        payment: populatedPayment,
        challan: {
          challanNumber: challan.challanNumber,
          totalPayable: challan.totalPayable,
          paidAmount: challan.paidAmount,
          balanceAmount: challan.balanceAmount,
          status: challan.status,
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * List fee payments with filters and pagination
 * GET /api/payments
 */
export const getPayments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      paymentMethod,
      status,
      academicSession,
      class: classId,
      startDate,
      endDate,
    } = req.query;

    const query = {};

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    if (status) {
      query.status = status;
    }

    if (academicSession) {
      query.academicSession = academicSession;
    }

    if (classId) {
      query.class = classId;
    }

    // Date range filtering
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) {
        query.paymentDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.paymentDate.$lte = end;
      }
    }

    // Search by receiptNumber, transactionId, student name/ID, or challan number
    if (search && search.trim()) {
      const term = search.trim();
      const matchingStudents = await Student.find({
        $or: [
          { name: { $regex: term, $options: 'i' } },
          { studentId: { $regex: term, $options: 'i' } },
          { admissionNumber: { $regex: term, $options: 'i' } },
        ],
      }).select('_id');

      const studentIds = matchingStudents.map((s) => s._id);

      const matchingChallans = await Challan.find({
        challanNumber: { $regex: term, $options: 'i' },
      }).select('_id');

      const challanIds = matchingChallans.map((c) => c._id);

      query.$or = [
        { receiptNumber: { $regex: term, $options: 'i' } },
        { transactionId: { $regex: term, $options: 'i' } },
        { student: { $in: studentIds } },
        { challan: { $in: challanIds } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('student', 'name studentId admissionNumber father contact')
        .populate('class', 'name code')
        .populate('academicSession', 'name')
        .populate('challan', 'challanNumber monthName billingYear totalPayable paidAmount balanceAmount dueDate status')
        .populate('receivedBy', 'name email role')
        .populate('reversal.reversedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Payment.countDocuments(query),
    ]);

    return sendSuccess(
      res,
      'Payments retrieved successfully',
      {
        payments,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)) || 1,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment receipt details by ID
 * GET /api/payments/:id
 */
export const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('student')
      .populate('class', 'name code')
      .populate('academicSession', 'name isCurrent')
      .populate('challan')
      .populate('receivedBy', 'name email role')
      .populate('reversal.reversedBy', 'name email role');

    if (!payment) {
      return sendError(res, 'Payment receipt not found', 404);
    }

    return sendSuccess(res, 'Payment receipt retrieved', payment, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Reverse a payment
 * POST /api/payments/:id/reverse
 */
export const reversePayment = async (req, res, next) => {
  try {
    const { reversalReason } = req.body;

    if (!reversalReason || !reversalReason.trim()) {
      return sendError(res, 'A valid reversal reason is required for audit logs', 400);
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return sendError(res, 'Payment record not found', 404);
    }

    if (payment.status === 'reversed' || payment.reversal?.isReversed) {
      return sendError(res, 'This payment has already been reversed', 400);
    }

    const challan = await Challan.findById(payment.challan);
    if (!challan) {
      return sendError(res, 'Associated challan not found', 404);
    }

    // Revert Challan balances
    challan.paidAmount = Math.max(0, Math.round((challan.paidAmount - payment.amount) * 100) / 100);
    challan.balanceAmount = Math.round((challan.totalPayable - challan.paidAmount) * 100) / 100;

    if (challan.paidAmount === 0) {
      challan.status = 'unpaid';
    } else {
      challan.status = 'partially_paid';
    }

    await challan.save();

    // Mark payment as reversed
    payment.status = 'reversed';
    payment.reversal = {
      isReversed: true,
      reversedBy: req.user._id,
      reversalReason: reversalReason.trim(),
      reversedAt: new Date(),
    };

    await payment.save();

    const updatedPayment = await Payment.findById(payment._id)
      .populate('student', 'name studentId admissionNumber')
      .populate('class', 'name code')
      .populate('challan', 'challanNumber totalPayable paidAmount balanceAmount status')
      .populate('receivedBy', 'name email')
      .populate('reversal.reversedBy', 'name email');

    AuditService.log({
      req,
      action: 'REVERSE_PAYMENT',
      module: 'PAYMENTS',
      recordId: payment._id,
      description: `Payment ${payment.receiptNumber} reversed: "${reversalReason.trim()}". Restored balance to PKR ${challan.balanceAmount.toLocaleString()}`,
      status: 'WARNING',
      oldData: { status: 'completed', amount: payment.amount },
      newData: { status: 'reversed', reason: reversalReason.trim(), restoredBalance: challan.balanceAmount },
    });

    return sendSuccess(
      res,
      'Payment reversed successfully',
      {
        payment: updatedPayment,
        challan: {
          challanNumber: challan.challanNumber,
          paidAmount: challan.paidAmount,
          balanceAmount: challan.balanceAmount,
          status: challan.status,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Payment collection summary metrics
 * GET /api/payments/summary
 */
export const getPaymentSummary = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

    // Active (non-reversed) payments
    const activeFilter = { status: 'completed' };

    const [todayPayments, monthPayments, methodBreakdown, totalReversals] = await Promise.all([
      Payment.aggregate([
        { $match: { ...activeFilter, paymentDate: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { ...activeFilter, paymentDate: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: activeFilter },
        { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Payment.countDocuments({ status: 'reversed' }),
    ]);

    const todayTotal = todayPayments[0]?.total || 0;
    const todayCount = todayPayments[0]?.count || 0;
    const monthTotal = monthPayments[0]?.total || 0;
    const monthCount = monthPayments[0]?.count || 0;

    const breakdown = {
      cash: 0,
      bank_transfer: 0,
      easypaisa: 0,
      jazzcash: 0,
      cheque: 0,
      other: 0,
    };

    methodBreakdown.forEach((item) => {
      if (breakdown[item._id] !== undefined) {
        breakdown[item._id] = item.total;
      }
    });

    return sendSuccess(
      res,
      'Payment summary calculated',
      {
        today: { total: todayTotal, count: todayCount },
        month: { total: monthTotal, count: monthCount },
        breakdown,
        reversalsCount: totalReversals,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Initiate Digital Payment (Easypaisa / JazzCash)
 * POST /api/payments/digital/initiate
 */
export const initiateDigitalPayment = async (req, res, next) => {
  try {
    const { provider, challanId } = req.body;

    const challan = await Challan.findById(challanId).populate('student', 'name contact');
    if (!challan) {
      return sendError(res, 'Challan not found', 404);
    }

    if (challan.balanceAmount <= 0) {
      return sendError(res, 'Challan is already fully paid', 400);
    }

    const session = await paymentGatewayService.initiatePayment({
      provider,
      challanNumber: challan.challanNumber,
      amount: challan.balanceAmount,
      studentName: challan.student?.name || 'Student',
      studentPhone: challan.student?.contact?.phone || '',
    });

    return sendSuccess(res, 'Digital payment session initiated', session, 200);
  } catch (error) {
    next(error);
  }
};
