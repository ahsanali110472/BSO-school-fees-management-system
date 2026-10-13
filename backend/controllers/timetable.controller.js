import Timetable from '../models/Timetable.js';
import AcademicSession from '../models/AcademicSession.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import Section from '../models/Section.js';
import Subject from '../models/Subject.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

// Helper to check if two time ranges [s1, e1] and [s2, e2] overlap (HH:MM format)
const timesOverlap = (start1, end1, start2, end2) => {
  return start1 < end2 && end1 > start2;
};

export const getTimetable = async (req, res, next) => {
  try {
    const { sessionId, teacherId, classId, sectionId, day } = req.query;
    const filter = {};

    if (sessionId) filter.academicSession = sessionId;
    if (teacherId) filter.teacher = teacherId;
    if (classId) filter.class = classId;
    if (sectionId) filter.section = sectionId;
    if (day) filter.day = day;

    const timetable = await Timetable.find(filter)
      .populate('teacher', 'name teacherId phone')
      .populate('class', 'name code')
      .populate('section', 'name')
      .populate('subject', 'name code type')
      .populate('academicSession', 'name')
      .sort({ day: 1, startTime: 1 });

    return sendSuccess(res, 'Timetable entries retrieved', { timetable, count: timetable.length });
  } catch (error) {
    next(error);
  }
};

export const createTimetableEntry = async (req, res, next) => {
  try {
    const {
      academicSession: sessionId,
      teacher: teacherId,
      class: classId,
      section: sectionId,
      subject: subjectId,
      day,
      startTime,
      endTime,
      room,
    } = req.body;

    if (!teacherId || !classId || !sectionId || !subjectId || !day || !startTime || !endTime) {
      return sendError(res, 'Teacher, Class, Section, Subject, Day, Start Time, and End Time are required', 400);
    }

    if (startTime >= endTime) {
      return sendError(res, 'Start time must be before end time', 400);
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

    // 1. Conflict Check: Teacher overlap
    const teacherEntries = await Timetable.find({
      academicSession: activeSessionId,
      teacher: teacherId,
      day,
    }).populate('class section');

    for (const entry of teacherEntries) {
      if (timesOverlap(startTime, endTime, entry.startTime, entry.endTime)) {
        return sendError(
          res,
          `Teacher conflict: This teacher is already scheduled for ${entry.class?.name}-${entry.section?.name} on ${day} between ${entry.startTime} and ${entry.endTime}`,
          409
        );
      }
    }

    // 2. Conflict Check: Class Section overlap
    const sectionEntries = await Timetable.find({
      academicSession: activeSessionId,
      class: classId,
      section: sectionId,
      day,
    }).populate('subject');

    for (const entry of sectionEntries) {
      if (timesOverlap(startTime, endTime, entry.startTime, entry.endTime)) {
        return sendError(
          res,
          `Section conflict: ${entry.subject?.name || 'Another class'} is already scheduled for this section on ${day} between ${entry.startTime} and ${entry.endTime}`,
          409
        );
      }
    }

    // 3. Conflict Check: Room overlap (if room is specified and not default)
    if (room && room.trim() && room.toLowerCase() !== 'general classroom') {
      const roomEntries = await Timetable.find({
        academicSession: activeSessionId,
        room: room.trim(),
        day,
      });

      for (const entry of roomEntries) {
        if (timesOverlap(startTime, endTime, entry.startTime, entry.endTime)) {
          return sendError(
            res,
            `Room conflict: '${room}' is already booked on ${day} between ${entry.startTime} and ${entry.endTime}`,
            409
          );
        }
      }
    }

    const entry = await Timetable.create({
      academicSession: activeSessionId,
      teacher: teacherId,
      class: classId,
      section: sectionId,
      subject: subjectId,
      day,
      startTime,
      endTime,
      room: room ? room.trim() : 'General Classroom',
    });

    await entry.populate([
      { path: 'teacher', select: 'name teacherId' },
      { path: 'class', select: 'name code' },
      { path: 'section', select: 'name' },
      { path: 'subject', select: 'name code' },
      { path: 'academicSession', select: 'name' },
    ]);

    return sendSuccess(res, 'Timetable period scheduled successfully', { entry }, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteTimetableEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const entry = await Timetable.findById(id);

    if (!entry) {
      return sendError(res, 'Timetable entry not found', 404);
    }

    await entry.deleteOne();

    return sendSuccess(res, 'Timetable entry deleted successfully');
  } catch (error) {
    next(error);
  }
};
