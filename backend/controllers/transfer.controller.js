import TransferCertificate from '../models/TransferCertificate.js';
import Student from '../models/Student.js';
import Enrollment from '../models/Enrollment.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

export const getTransferCertificates = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const filter = {};

    if (status) filter.status = status;

    const certificates = await TransferCertificate.find(filter)
      .populate('student', 'name studentId admissionNumber grNumber dateOfBirth gender father')
      .populate('lastClass', 'name code')
      .populate('lastSection', 'name')
      .populate('lastSession', 'name')
      .populate('issuedBy', 'name email role')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Transfer certificates retrieved', {
      certificates,
      count: certificates.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getTransferCertificateById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const certificate = await TransferCertificate.findById(id)
      .populate('student', 'name studentId admissionNumber grNumber dateOfBirth gender father address contact admissionDate')
      .populate('lastClass', 'name code')
      .populate('lastSection', 'name')
      .populate('lastSession', 'name')
      .populate('issuedBy', 'name email role');

    if (!certificate) {
      return sendError(res, 'Transfer Certificate not found', 404);
    }

    return sendSuccess(res, 'Transfer certificate details', { certificate });
  } catch (error) {
    next(error);
  }
};

export const issueTransferCertificate = async (req, res, next) => {
  try {
    const {
      studentId,
      reasonForLeaving,
      conduct = 'Good',
      remarks,
      duesCleared = true,
    } = req.body;

    if (!studentId || !reasonForLeaving) {
      return sendError(res, 'Student ID and reason for leaving are required', 400);
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    // Find active enrollment
    const activeEnrollment = await Enrollment.findOne({
      student: studentId,
      status: 'active',
    }).populate('class section academicSession');

    if (!activeEnrollment) {
      return sendError(res, 'Student has no active enrollment to issue a School Leaving Certificate from', 400);
    }

    // Check if TC already exists for this student
    const existingTc = await TransferCertificate.findOne({
      student: studentId,
      status: 'issued',
    });

    if (existingTc) {
      return sendError(res, `A Transfer Certificate (${existingTc.certificateNumber}) has already been issued for this student.`, 409);
    }

    // 1. Create Transfer Certificate
    const certificate = await TransferCertificate.create({
      student: student._id,
      lastSession: activeEnrollment.academicSession._id,
      lastClass: activeEnrollment.class._id,
      lastSection: activeEnrollment.section?._id,
      reasonForLeaving: reasonForLeaving.trim(),
      conduct,
      remarks: remarks ? remarks.trim() : undefined,
      duesCleared: Boolean(duesCleared),
      issuedBy: req.user._id,
      status: 'issued',
    });

    // 2. Transition active enrollment to 'transferred'
    activeEnrollment.status = 'transferred';
    await activeEnrollment.save();

    // 3. Mark student profile status as 'transferred'
    student.status = 'transferred';
    await student.save();

    await certificate.populate([
      { path: 'student', select: 'name studentId admissionNumber grNumber dateOfBirth gender father' },
      { path: 'lastClass', select: 'name code' },
      { path: 'lastSection', select: 'name' },
      { path: 'lastSession', select: 'name' },
      { path: 'issuedBy', select: 'name email' },
    ]);

    return sendSuccess(res, 'Transfer Certificate issued successfully', { certificate }, 201);
  } catch (error) {
    next(error);
  }
};
