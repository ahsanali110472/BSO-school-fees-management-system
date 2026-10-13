import Promotion from '../models/Promotion.js';
import Enrollment from '../models/Enrollment.js';
import Student from '../models/Student.js';
import AcademicSession from '../models/AcademicSession.js';
import Class from '../models/Class.js';
import Section from '../models/Section.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

export const getPromotionCandidates = async (req, res, next) => {
  try {
    const { sessionId, classId, sectionId } = req.query;

    if (!sessionId || !classId) {
      return sendError(res, 'Both sessionId and classId are required to fetch promotion candidates', 400);
    }

    const filter = {
      academicSession: sessionId,
      class: classId,
      status: 'active',
    };

    if (sectionId) {
      filter.section = sectionId;
    }

    const enrollments = await Enrollment.find(filter)
      .populate('student', 'name studentId grNumber admissionNumber gender father status')
      .populate('class', 'name code order')
      .populate('section', 'name')
      .populate('academicSession', 'name isCurrent')
      .sort({ rollNumber: 1, 'student.name': 1 });

    return sendSuccess(res, 'Promotion candidates fetched successfully', {
      candidates: enrollments,
      totalCount: enrollments.length,
    });
  } catch (error) {
    next(error);
  }
};

export const executePromotionBatch = async (req, res, next) => {
  try {
    const {
      fromSessionId,
      toSessionId,
      fromClassId,
      toClassId,
      studentDecisions,
      notes,
    } = req.body;

    if (!fromSessionId || !toSessionId || !fromClassId || !toClassId) {
      return sendError(res, 'Source session, target session, source class, and target class are required', 400);
    }

    if (fromSessionId === toSessionId) {
      return sendError(res, 'Source session and target session cannot be identical', 400);
    }

    if (!studentDecisions || !Array.isArray(studentDecisions) || studentDecisions.length === 0) {
      return sendError(res, 'At least one student promotion decision is required', 400);
    }

    const [fromSession, toSession, fromClass, toClass] = await Promise.all([
      AcademicSession.findById(fromSessionId),
      AcademicSession.findById(toSessionId),
      Class.findById(fromClassId),
      Class.findById(toClassId),
    ]);

    if (!fromSession || !toSession || !fromClass || !toClass) {
      return sendError(res, 'One or more specified sessions or classes do not exist', 404);
    }

    const promotionRecords = [];
    let promotedCount = 0;
    let retainedCount = 0;
    let passedOutCount = 0;

    for (const item of studentDecisions) {
      const { studentId, action, targetSectionId, rollNumber } = item;

      // Find active enrollment in fromSession
      const currentEnrollment = await Enrollment.findOne({
        student: studentId,
        academicSession: fromSessionId,
        status: 'active',
      });

      if (!currentEnrollment) {
        continue;
      }

      if (action === 'promoted') {
        // Check if student is already enrolled in target session
        const existingInTarget = await Enrollment.findOne({
          student: studentId,
          academicSession: toSessionId,
        });

        if (existingInTarget) {
          continue; // Skip if already enrolled
        }

        // 1. Mark previous enrollment as promoted
        currentEnrollment.status = 'promoted';
        await currentEnrollment.save();

        // 2. Create new enrollment in toSession
        const newEnrollment = await Enrollment.create({
          student: studentId,
          academicSession: toSessionId,
          class: toClassId,
          section: targetSectionId || currentEnrollment.section,
          rollNumber: rollNumber ? rollNumber.trim() : currentEnrollment.rollNumber,
          status: 'active',
        });

        promotionRecords.push({
          student: studentId,
          previousEnrollment: currentEnrollment._id,
          newEnrollment: newEnrollment._id,
          action: 'promoted',
          targetClass: toClassId,
          targetSection: targetSectionId || currentEnrollment.section,
          newRollNumber: rollNumber || currentEnrollment.rollNumber,
        });
        promotedCount++;
      } else if (action === 'retained') {
        // Repeated in the same class
        const existingInTarget = await Enrollment.findOne({
          student: studentId,
          academicSession: toSessionId,
        });

        if (existingInTarget) {
          continue;
        }

        currentEnrollment.status = 'repeated';
        await currentEnrollment.save();

        const newEnrollment = await Enrollment.create({
          student: studentId,
          academicSession: toSessionId,
          class: fromClassId,
          section: targetSectionId || currentEnrollment.section,
          rollNumber: rollNumber ? rollNumber.trim() : currentEnrollment.rollNumber,
          status: 'active',
        });

        promotionRecords.push({
          student: studentId,
          previousEnrollment: currentEnrollment._id,
          newEnrollment: newEnrollment._id,
          action: 'retained',
          targetClass: fromClassId,
          targetSection: targetSectionId || currentEnrollment.section,
          newRollNumber: rollNumber || currentEnrollment.rollNumber,
        });
        retainedCount++;
      } else if (action === 'passed_out') {
        currentEnrollment.status = 'passed_out';
        await currentEnrollment.save();

        await Student.findByIdAndUpdate(studentId, { status: 'passed_out' });

        promotionRecords.push({
          student: studentId,
          previousEnrollment: currentEnrollment._id,
          newEnrollment: null,
          action: 'passed_out',
        });
        passedOutCount++;
      }
    }

    // Save master promotion audit log
    const promotionLog = await Promotion.create({
      fromSession: fromSessionId,
      toSession: toSessionId,
      fromClass: fromClassId,
      toClass: toClassId,
      promotedBy: req.user._id,
      records: promotionRecords,
      totalEvaluated: studentDecisions.length,
      totalPromoted: promotedCount,
      totalRetained: retainedCount,
      totalPassedOut: passedOutCount,
      notes,
    });

    return sendSuccess(res, 'Batch promotion executed successfully', {
      promotionLog,
      summary: {
        totalEvaluated: studentDecisions.length,
        promotedCount,
        retainedCount,
        passedOutCount,
      },
    }, 201);
  } catch (error) {
    next(error);
  }
};

export const getPromotionHistory = async (req, res, next) => {
  try {
    const history = await Promotion.find()
      .populate('fromSession', 'name isCurrent')
      .populate('toSession', 'name isCurrent')
      .populate('fromClass', 'name code')
      .populate('toClass', 'name code')
      .populate('promotedBy', 'name email role')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Promotion history retrieved', { history });
  } catch (error) {
    next(error);
  }
};
