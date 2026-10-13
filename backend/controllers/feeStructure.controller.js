import FeeStructure from '../models/FeeStructure.js';
import FeeHead from '../models/FeeHead.js';
import Class from '../models/Class.js';
import AcademicSession from '../models/AcademicSession.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

export const getFeeStructures = async (req, res, next) => {
  try {
    const { sessionId, classId } = req.query;
    const filter = {};

    if (sessionId) filter.academicSession = sessionId;
    if (classId) filter.class = classId;

    const feeStructures = await FeeStructure.find(filter)
      .populate('class', 'name code order')
      .populate('academicSession', 'name isCurrent')
      .populate('feeItems.feeHead', 'name code type frequency isRefundable')
      .sort({ 'class.order': 1 });

    return sendSuccess(res, 'Fee structures retrieved', {
      feeStructures,
      count: feeStructures.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getFeeStructureByClass = async (req, res, next) => {
  try {
    const { classId, sessionId } = req.params;

    let targetSessionId = sessionId;
    if (!targetSessionId) {
      const currentSession = await AcademicSession.findOne({ isCurrent: true });
      if (!currentSession) return sendError(res, 'No active academic session found', 400);
      targetSessionId = currentSession._id;
    }

    const feeStructure = await FeeStructure.findOne({
      class: classId,
      academicSession: targetSessionId,
    })
      .populate('class', 'name code')
      .populate('academicSession', 'name isCurrent')
      .populate('feeItems.feeHead', 'name code type frequency isRefundable');

    if (!feeStructure) {
      return sendSuccess(res, 'Fee structure not yet configured for this class and session', { feeStructure: null });
    }

    return sendSuccess(res, 'Class fee structure retrieved', { feeStructure });
  } catch (error) {
    next(error);
  }
};

export const upsertFeeStructure = async (req, res, next) => {
  try {
    const {
      academicSession: sessionId,
      class: classId,
      feeItems,
      dueDayOfMonth = 10,
      gracePeriodDays = 5,
      lateFineType = 'fixed',
      lateFineAmount = 200,
    } = req.body;

    if (!sessionId || !classId || !feeItems || !Array.isArray(feeItems)) {
      return sendError(res, 'Academic Session, Class, and feeItems array are required', 400);
    }

    const [classDoc, sessionDoc] = await Promise.all([
      Class.findById(classId),
      AcademicSession.findById(sessionId),
    ]);

    if (!classDoc || !sessionDoc) {
      return sendError(res, 'Specified class or academic session does not exist', 404);
    }

    // Fetch fee head definitions to calculate totals
    const feeHeadIds = feeItems.map((item) => item.feeHead);
    const feeHeads = await FeeHead.find({ _id: { $in: feeHeadIds } });
    const headMap = new Map(feeHeads.map((h) => [h._id.toString(), h]));

    let totalMonthly = 0;
    let totalAnnual = 0;
    let totalOneTime = 0;

    const validatedItems = [];
    for (const item of feeItems) {
      const head = headMap.get(item.feeHead.toString());
      if (head) {
        const amt = Math.max(0, Number(item.amount) || 0);
        validatedItems.push({
          feeHead: head._id,
          amount: amt,
        });

        if (head.frequency === 'monthly') totalMonthly += amt;
        else if (head.frequency === 'annual') totalAnnual += amt;
        else if (head.frequency === 'one_time') totalOneTime += amt;
      }
    }

    // Upsert using compound key { academicSession, class }
    let structure = await FeeStructure.findOne({
      academicSession: sessionId,
      class: classId,
    });

    if (structure) {
      structure.feeItems = validatedItems;
      structure.totalMonthlyAmount = totalMonthly;
      structure.totalAnnualAmount = totalAnnual;
      structure.totalOneTimeAmount = totalOneTime;
      structure.dueDayOfMonth = dueDayOfMonth;
      structure.gracePeriodDays = gracePeriodDays;
      structure.lateFineType = lateFineType;
      structure.lateFineAmount = lateFineAmount;
      await structure.save();
    } else {
      structure = await FeeStructure.create({
        academicSession: sessionId,
        class: classId,
        feeItems: validatedItems,
        totalMonthlyAmount: totalMonthly,
        totalAnnualAmount: totalAnnual,
        totalOneTimeAmount: totalOneTime,
        dueDayOfMonth,
        gracePeriodDays,
        lateFineType,
        lateFineAmount,
        status: 'active',
      });
    }

    await structure.populate([
      { path: 'class', select: 'name code' },
      { path: 'academicSession', select: 'name isCurrent' },
      { path: 'feeItems.feeHead', select: 'name code type frequency' },
    ]);

    return sendSuccess(res, `Fee structure configured for ${classDoc.name}`, { feeStructure: structure }, 200);
  } catch (error) {
    next(error);
  }
};

export const deleteFeeStructure = async (req, res, next) => {
  try {
    const { id } = req.params;
    const structure = await FeeStructure.findByIdAndDelete(id);

    if (!structure) {
      return sendError(res, 'Fee structure not found', 404);
    }

    return sendSuccess(res, 'Fee structure deleted successfully');
  } catch (error) {
    next(error);
  }
};
