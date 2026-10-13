import TeacherAssignment from '../models/TeacherAssignment.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import Section from '../models/Section.js';
import Subject from '../models/Subject.js';
import AcademicSession from '../models/AcademicSession.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

export const getAssignments = async (req, res, next) => {
  try {
    const { teacherId, classId, sectionId, sessionId } = req.query;
    const filter = {};

    if (teacherId) filter.teacher = teacherId;
    if (classId) filter.class = classId;
    if (sectionId) filter.section = sectionId;
    if (sessionId) filter.academicSession = sessionId;

    const assignments = await TeacherAssignment.find(filter)
      .populate('teacher', 'name teacherId phone')
      .populate('academicSession', 'name isCurrent')
      .populate('class', 'name code')
      .populate('section', 'name')
      .populate('subject', 'name code type')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Teacher assignments retrieved', { assignments, count: assignments.length });
  } catch (error) {
    next(error);
  }
};

export const createAssignment = async (req, res, next) => {
  try {
    const {
      teacher: teacherId,
      academicSession: sessionId,
      class: classId,
      section: sectionId,
      subject: subjectId,
      isClassTeacher,
    } = req.body;

    if (!teacherId || !classId || !sectionId || !subjectId) {
      return sendError(res, 'Teacher, Class, Section, and Subject are all required', 400);
    }

    // Resolve academic session (use provided or fallback to current active session)
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const currentSession = await AcademicSession.findOne({ isCurrent: true });
      if (!currentSession) {
        return sendError(res, 'No active academic session found. Please specify academicSession.', 400);
      }
      activeSessionId = currentSession._id;
    }

    // Validate existence of references
    const [teacherExists, classExists, sectionExists, subjectExists] = await Promise.all([
      Teacher.findById(teacherId),
      Class.findById(classId),
      Section.findById(sectionId),
      Subject.findById(subjectId),
    ]);

    if (!teacherExists) return sendError(res, 'Specified teacher not found', 404);
    if (!classExists) return sendError(res, 'Specified class not found', 404);
    if (!sectionExists) return sendError(res, 'Specified section not found', 404);
    if (!subjectExists) return sendError(res, 'Specified subject not found', 404);

    // Check duplicate
    const existing = await TeacherAssignment.findOne({
      teacher: teacherId,
      academicSession: activeSessionId,
      class: classId,
      section: sectionId,
      subject: subjectId,
    });

    if (existing) {
      return sendError(
        res,
        `Teacher '${teacherExists.name}' is already assigned to ${subjectExists.name} in ${classExists.name}-${sectionExists.name}`,
        409
      );
    }

    const assignment = await TeacherAssignment.create({
      teacher: teacherId,
      academicSession: activeSessionId,
      class: classId,
      section: sectionId,
      subject: subjectId,
      isClassTeacher: !!isClassTeacher,
    });

    // If marked as class teacher, update Section.classTeacher reference
    if (isClassTeacher) {
      await Section.findByIdAndUpdate(sectionId, { classTeacher: teacherId });
    }

    await assignment.populate([
      { path: 'teacher', select: 'name teacherId' },
      { path: 'class', select: 'name code' },
      { path: 'section', select: 'name' },
      { path: 'subject', select: 'name code' },
      { path: 'academicSession', select: 'name' },
    ]);

    return sendSuccess(res, 'Teaching assignment created successfully', { assignment }, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assignment = await TeacherAssignment.findById(id);

    if (!assignment) {
      return sendError(res, 'Assignment not found', 404);
    }

    await assignment.deleteOne();

    return sendSuccess(res, 'Teaching assignment removed successfully');
  } catch (error) {
    next(error);
  }
};
