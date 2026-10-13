import Enrollment from '../models/Enrollment.js';
import Student from '../models/Student.js';
import AcademicSession from '../models/AcademicSession.js';
import Class from '../models/Class.js';
import Section from '../models/Section.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

export const getEnrollments = async (req, res, next) => {
  try {
    const { studentId, sessionId, classId, sectionId, status } = req.query;
    const filter = {};

    if (studentId) filter.student = studentId;
    if (sessionId) filter.academicSession = sessionId;
    if (classId) filter.class = classId;
    if (sectionId) filter.section = sectionId;
    if (status) filter.status = status;

    const enrollments = await Enrollment.find(filter)
      .populate('student', 'name studentId admissionNumber father contact')
      .populate('academicSession', 'name isCurrent')
      .populate('class', 'name code order')
      .populate('section', 'name capacity')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Enrollments retrieved', { enrollments, count: enrollments.length });
  } catch (error) {
    next(error);
  }
};

export const createEnrollment = async (req, res, next) => {
  try {
    const {
      student: studentId,
      academicSession: sessionId,
      class: classId,
      section: sectionId,
      rollNumber,
      status,
    } = req.body;

    if (!studentId || !classId || !sectionId) {
      return sendError(res, 'Student, Class, and Section are required', 400);
    }

    // Resolve academic session
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const currentSession = await AcademicSession.findOne({ isCurrent: true });
      if (!currentSession) {
        return sendError(res, 'No active academic session found', 400);
      }
      activeSessionId = currentSession._id;
    }

    // Single active enrollment per session constraint (Section 45)
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      academicSession: activeSessionId,
    });

    if (existingEnrollment) {
      return sendError(
        res,
        'This student already has an active enrollment in this academic session. Use the promotion or transfer module to change class.',
        409
      );
    }

    const enrollment = await Enrollment.create({
      student: studentId,
      academicSession: activeSessionId,
      class: classId,
      section: sectionId,
      rollNumber: rollNumber ? rollNumber.trim() : undefined,
      status: status || 'active',
    });

    await enrollment.populate([
      { path: 'student', select: 'name studentId admissionNumber' },
      { path: 'academicSession', select: 'name isCurrent' },
      { path: 'class', select: 'name code' },
      { path: 'section', select: 'name' },
    ]);

    return sendSuccess(res, 'Student enrolled successfully', { enrollment }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateEnrollment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { section: sectionId, rollNumber, status } = req.body;

    const enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      return sendError(res, 'Enrollment record not found', 404);
    }

    if (sectionId) {
      const sec = await Section.findById(sectionId);
      if (!sec) return sendError(res, 'Section not found', 404);
      enrollment.section = sectionId;
    }

    if (rollNumber !== undefined) {
      enrollment.rollNumber = rollNumber.trim();
    }

    if (status) {
      enrollment.status = status;
    }

    await enrollment.save();

    await enrollment.populate([
      { path: 'student', select: 'name studentId admissionNumber' },
      { path: 'academicSession', select: 'name isCurrent' },
      { path: 'class', select: 'name code' },
      { path: 'section', select: 'name' },
    ]);

    return sendSuccess(res, 'Enrollment updated successfully', { enrollment });
  } catch (error) {
    next(error);
  }
};

export const bulkAssignSection = async (req, res, next) => {
  try {
    const { enrollmentIds, sectionId } = req.body;
    if (!enrollmentIds || !Array.isArray(enrollmentIds) || !sectionId) {
      return sendError(res, 'enrollmentIds array and sectionId are required', 400);
    }

    const sectionDoc = await Section.findById(sectionId);
    if (!sectionDoc) {
      return sendError(res, 'Target section does not exist', 404);
    }

    const result = await Enrollment.updateMany(
      { _id: { $in: enrollmentIds } },
      { $set: { section: sectionId } }
    );

    return sendSuccess(res, `Successfully reassigned ${result.modifiedCount} student(s) to Section ${sectionDoc.name}`, {
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};
