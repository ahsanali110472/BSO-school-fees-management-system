import FeeConcession from '../models/FeeConcession.js';
import StudentConcession from '../models/StudentConcession.js';
import Student from '../models/Student.js';
import AcademicSession from '../models/AcademicSession.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

export const getFeeConcessions = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const concessions = await FeeConcession.find(filter)
      .populate('applicableFeeHeads', 'name code frequency')
      .sort({ name: 1 });

    return sendSuccess(res, 'Fee concessions retrieved', { concessions, count: concessions.length });
  } catch (error) {
    next(error);
  }
};

export const createFeeConcession = async (req, res, next) => {
  try {
    const { name, code, type, value, applicableFeeHeads, description } = req.body;

    if (!name || !code || !type || value === undefined) {
      return sendError(res, 'Name, Code, Type, and Value are required', 400);
    }

    const existingCode = await FeeConcession.findOne({ code: code.trim().toUpperCase() });
    if (existingCode) {
      return sendError(res, `Concession code '${code.trim().toUpperCase()}' is already in use`, 409);
    }

    const concession = await FeeConcession.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type,
      value: Math.max(0, Number(value)),
      applicableFeeHeads: applicableFeeHeads || [],
      description: description ? description.trim() : undefined,
      status: 'active',
    });

    return sendSuccess(res, 'Fee concession template created', { concession }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateFeeConcession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, value, applicableFeeHeads, description, status } = req.body;

    const concession = await FeeConcession.findById(id);
    if (!concession) {
      return sendError(res, 'Fee concession not found', 404);
    }

    if (name) concession.name = name.trim();
    if (type) concession.type = type;
    if (value !== undefined) concession.value = Math.max(0, Number(value));
    if (applicableFeeHeads) concession.applicableFeeHeads = applicableFeeHeads;
    if (description !== undefined) concession.description = description.trim();
    if (status) concession.status = status;

    await concession.save();

    return sendSuccess(res, 'Fee concession template updated', { concession });
  } catch (error) {
    next(error);
  }
};

export const getStudentConcessions = async (req, res, next) => {
  try {
    const { studentId, sessionId, status } = req.query;
    const filter = {};

    if (studentId) filter.student = studentId;
    if (sessionId) filter.academicSession = sessionId;
    if (status) filter.status = status;

    const studentConcessions = await StudentConcession.find(filter)
      .populate('student', 'name studentId admissionNumber grNumber')
      .populate('concession', 'name code type value applicableFeeHeads')
      .populate('academicSession', 'name isCurrent')
      .populate('approvedBy', 'name email role')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Student concessions retrieved', {
      studentConcessions,
      count: studentConcessions.length,
    });
  } catch (error) {
    next(error);
  }
};

export const assignStudentConcession = async (req, res, next) => {
  try {
    const { studentId, concessionId, sessionId, customValue, reason } = req.body;

    if (!studentId || !concessionId) {
      return sendError(res, 'studentId and concessionId are required', 400);
    }

    let targetSessionId = sessionId;
    if (!targetSessionId) {
      const activeSession = await AcademicSession.findOne({ isCurrent: true });
      if (!activeSession) return sendError(res, 'No active academic session found', 400);
      targetSessionId = activeSession._id;
    }

    const [student, concession] = await Promise.all([
      Student.findById(studentId),
      FeeConcession.findById(concessionId),
    ]);

    if (!student) return sendError(res, 'Student not found', 404);
    if (!concession) return sendError(res, 'Concession template not found', 404);

    // Check if already assigned
    const existing = await StudentConcession.findOne({
      student: studentId,
      concession: concessionId,
      academicSession: targetSessionId,
    });

    if (existing) {
      if (existing.status === 'revoked') {
        existing.status = 'active';
        existing.customValue = customValue !== undefined ? Number(customValue) : null;
        existing.reason = reason ? reason.trim() : existing.reason;
        existing.approvedBy = req.user._id;
        await existing.save();
        return sendSuccess(res, 'Concession reactivated for student', { studentConcession: existing });
      }
      return sendError(res, 'This concession is already active for this student in this academic session', 409);
    }

    const studentConcession = await StudentConcession.create({
      student: studentId,
      concession: concessionId,
      academicSession: targetSessionId,
      customValue: customValue !== undefined && customValue !== '' ? Number(customValue) : null,
      reason: reason ? reason.trim() : undefined,
      approvedBy: req.user._id,
      status: 'active',
    });

    await studentConcession.populate([
      { path: 'student', select: 'name studentId' },
      { path: 'concession', select: 'name code type value' },
      { path: 'academicSession', select: 'name isCurrent' },
    ]);

    return sendSuccess(res, `Assigned '${concession.name}' to ${student.name}`, { studentConcession }, 201);
  } catch (error) {
    next(error);
  }
};

export const revokeStudentConcession = async (req, res, next) => {
  try {
    const { id } = req.params;

    const studentConcession = await StudentConcession.findById(id);
    if (!studentConcession) {
      return sendError(res, 'Student concession record not found', 404);
    }

    studentConcession.status = 'revoked';
    await studentConcession.save();

    return sendSuccess(res, 'Concession revoked for student');
  } catch (error) {
    next(error);
  }
};
