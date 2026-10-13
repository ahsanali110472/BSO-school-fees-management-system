import Teacher from '../models/Teacher.js';
import TeacherAssignment from '../models/TeacherAssignment.js';
import Timetable from '../models/Timetable.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

export const getTeachers = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { teacherId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { cnic: { $regex: search, $options: 'i' } },
      ];
    }

    const teachers = await Teacher.find(filter)
      .sort({ createdAt: -1 })
      .populate({
        path: 'assignments',
        populate: [
          { path: 'class', select: 'name code' },
          { path: 'section', select: 'name' },
          { path: 'subject', select: 'name code' },
          { path: 'academicSession', select: 'name' },
        ],
      });

    return sendSuccess(res, 'Teachers retrieved successfully', { teachers, count: teachers.length });
  } catch (error) {
    next(error);
  }
};

export const getTeacherById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findById(id).populate({
      path: 'assignments',
      populate: [
        { path: 'class', select: 'name code' },
        { path: 'section', select: 'name' },
        { path: 'subject', select: 'name code' },
        { path: 'academicSession', select: 'name' },
      ],
    });

    if (!teacher) {
      return sendError(res, 'Teacher not found', 404);
    }

    // Also fetch teacher's timetable schedule
    const timetable = await Timetable.find({ teacher: id })
      .populate('class', 'name code')
      .populate('section', 'name')
      .populate('subject', 'name code')
      .sort({ day: 1, startTime: 1 });

    return sendSuccess(res, 'Teacher profile retrieved', { teacher, timetable });
  } catch (error) {
    next(error);
  }
};

export const createTeacher = async (req, res, next) => {
  try {
    const {
      name,
      fatherName,
      cnic,
      phone,
      email,
      address,
      qualification,
      joiningDate,
      status,
      photo,
    } = req.body;

    if (!name || !phone) {
      return sendError(res, 'Teacher name and phone number are required', 400);
    }

    // Check unique CNIC if provided
    if (cnic && cnic.trim()) {
      const existingCnic = await Teacher.findOne({ cnic: cnic.trim() });
      if (existingCnic) {
        return sendError(res, `A teacher with CNIC '${cnic.trim()}' is already registered`, 409);
      }
    }

    const teacher = new Teacher({
      name: name.trim(),
      fatherName: fatherName ? fatherName.trim() : undefined,
      cnic: cnic ? cnic.trim() : undefined,
      phone: phone.trim(),
      email: email ? email.trim().toLowerCase() : undefined,
      address: address ? address.trim() : undefined,
      qualification: qualification ? qualification.trim() : undefined,
      joiningDate: joiningDate || Date.now(),
      status: status || 'active',
      photo,
    });

    await teacher.save();

    return sendSuccess(res, 'Teacher registered successfully', { teacher }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findById(id);

    if (!teacher) {
      return sendError(res, 'Teacher not found', 404);
    }

    const {
      name,
      fatherName,
      cnic,
      phone,
      email,
      address,
      qualification,
      joiningDate,
      status,
      photo,
    } = req.body;

    // If updating CNIC, verify uniqueness
    if (cnic && cnic.trim() !== teacher.cnic) {
      const existingCnic = await Teacher.findOne({ _id: { $ne: id }, cnic: cnic.trim() });
      if (existingCnic) {
        return sendError(res, `A teacher with CNIC '${cnic.trim()}' is already registered`, 409);
      }
      teacher.cnic = cnic.trim();
    }

    if (name) teacher.name = name.trim();
    if (fatherName !== undefined) teacher.fatherName = fatherName ? fatherName.trim() : '';
    if (phone) teacher.phone = phone.trim();
    if (email !== undefined) teacher.email = email ? email.trim().toLowerCase() : '';
    if (address !== undefined) teacher.address = address ? address.trim() : '';
    if (qualification !== undefined) teacher.qualification = qualification ? qualification.trim() : '';
    if (joiningDate) teacher.joiningDate = joiningDate;
    if (status) teacher.status = status;
    if (photo !== undefined) teacher.photo = photo;

    await teacher.save();

    return sendSuccess(res, 'Teacher updated successfully', { teacher });
  } catch (error) {
    next(error);
  }
};

export const deleteTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findById(id);

    if (!teacher) {
      return sendError(res, 'Teacher not found', 404);
    }

    // Soft delete per Section 46
    teacher.status = 'inactive';
    await teacher.save();

    return sendSuccess(res, `Teacher '${teacher.name}' marked as inactive`);
  } catch (error) {
    next(error);
  }
};
