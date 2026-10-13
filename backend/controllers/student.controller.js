import Student from '../models/Student.js';
import Enrollment from '../models/Enrollment.js';
import AcademicSession from '../models/AcademicSession.js';
import Class from '../models/Class.js';
import Section from '../models/Section.js';
import AuditService from '../services/audit.service.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

export const getStudents = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      classId,
      sectionId,
      sessionId,
      status,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Filter students by enrollment if class/section/session specified
    let studentIdsFromEnrollment = null;
    if (classId || sectionId || sessionId) {
      const enrollFilter = { status: 'active' };
      if (classId) enrollFilter.class = classId;
      if (sectionId) enrollFilter.section = sectionId;
      if (sessionId) enrollFilter.academicSession = sessionId;

      const enrollments = await Enrollment.find(enrollFilter).select('student');
      studentIdsFromEnrollment = enrollments.map((e) => e.student);
    }

    const studentFilter = {};

    if (status) {
      studentFilter.status = status;
    }

    if (studentIdsFromEnrollment !== null) {
      studentFilter._id = { $in: studentIdsFromEnrollment };
    }

    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      const searchOr = [
        { name: searchRegex },
        { studentId: searchRegex },
        { admissionNumber: searchRegex },
        { grNumber: searchRegex },
        { 'father.name': searchRegex },
        { 'contact.phone': searchRegex },
      ];

      if (studentFilter._id) {
        studentFilter.$and = [{ _id: studentFilter._id }, { $or: searchOr }];
        delete studentFilter._id;
      } else {
        studentFilter.$or = searchOr;
      }
    }

    const [total, students] = await Promise.all([
      Student.countDocuments(studentFilter),
      Student.find(studentFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate({
          path: 'enrollments',
          match: { status: 'active' },
          populate: [
            { path: 'class', select: 'name code' },
            { path: 'section', select: 'name' },
            { path: 'academicSession', select: 'name isCurrent' },
          ],
        }),
    ]);

    // Format output with current active enrollment
    const formattedStudents = students.map((s) => {
      const activeEnrollment = s.enrollments?.[0] || null;
      return {
        ...s.toObject(),
        currentClass: activeEnrollment?.class || null,
        currentSection: activeEnrollment?.section || null,
        currentSession: activeEnrollment?.academicSession || null,
        rollNumber: activeEnrollment?.rollNumber || 'N/A',
      };
    });

    return sendSuccess(res, 'Students retrieved successfully', {
      students: formattedStudents,
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

export const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id).populate({
      path: 'enrollments',
      options: { sort: { createdAt: -1 } },
      populate: [
        { path: 'class', select: 'name code' },
        { path: 'section', select: 'name' },
        { path: 'academicSession', select: 'name isCurrent' },
      ],
    });

    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    const activeEnrollment = student.enrollments?.find((e) => e.status === 'active') || null;

    return sendSuccess(res, 'Student profile retrieved', {
      student,
      currentEnrollment: activeEnrollment,
      // Financial summary previews ready for Fee module (Phase 7-9)
      financialSummary: {
        outstandingBalance: 0,
        lastPaymentDate: null,
        lastPaymentAmount: 0,
        invoiceCount: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const registerStudent = async (req, res, next) => {
  try {
    const {
      name,
      dateOfBirth,
      gender,
      grNumber,
      father,
      guardian,
      contact,
      address,
      previousSchool,
      admissionDate,
      // Initial Enrollment Information
      academicSession: sessionId,
      class: classId,
      section: sectionId,
      rollNumber,
    } = req.body;

    if (!name || !dateOfBirth || !gender || !contact?.phone || !classId || !sectionId) {
      return sendError(res, 'Name, Date of Birth, Gender, Contact Phone, Class, and Section are required', 400);
    }

    // Check GR number uniqueness if supplied
    if (grNumber && grNumber.trim()) {
      const existingGr = await Student.findOne({ grNumber: grNumber.trim() });
      if (existingGr) {
        return sendError(res, `GR Number '${grNumber.trim()}' is already in use by student: ${existingGr.name}`, 409);
      }
    }

    // Resolve target academic session
    let targetSessionId = sessionId;
    if (!targetSessionId) {
      const currentSession = await AcademicSession.findOne({ isCurrent: true });
      if (!currentSession) {
        return sendError(res, 'No active academic session found. Please specify academicSession.', 400);
      }
      targetSessionId = currentSession._id;
    }

    // Verify class and section exist
    const [classDoc, sectionDoc] = await Promise.all([
      Class.findById(classId),
      Section.findById(sectionId),
    ]);

    if (!classDoc) return sendError(res, 'Specified class does not exist', 404);
    if (!sectionDoc) return sendError(res, 'Specified section does not exist', 404);

    // 1. Create Student
    const student = new Student({
      name: name.trim(),
      dateOfBirth,
      gender,
      grNumber: grNumber ? grNumber.trim() : undefined,
      father,
      guardian,
      contact,
      address,
      previousSchool,
      admissionDate: admissionDate || Date.now(),
      status: 'active',
    });

    await student.save();

    // 2. Create Initial Enrollment
    const enrollment = await Enrollment.create({
      student: student._id,
      academicSession: targetSessionId,
      class: classId,
      section: sectionId,
      rollNumber: rollNumber ? rollNumber.trim() : undefined,
      status: 'active',
    });

    await enrollment.populate([
      { path: 'class', select: 'name code' },
      { path: 'section', select: 'name' },
      { path: 'academicSession', select: 'name isCurrent' },
    ]);

    return sendSuccess(res, 'Student registered and enrolled successfully', {
      student,
      enrollment,
    }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id);

    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    const {
      name,
      dateOfBirth,
      gender,
      grNumber,
      father,
      guardian,
      contact,
      address,
      previousSchool,
      status,
    } = req.body;

    // Check GR uniqueness if updated
    if (grNumber && grNumber.trim() !== student.grNumber) {
      const existingGr = await Student.findOne({ _id: { $ne: id }, grNumber: grNumber.trim() });
      if (existingGr) {
        return sendError(res, `GR Number '${grNumber.trim()}' is already in use`, 409);
      }
      student.grNumber = grNumber.trim();
    }

    if (name) student.name = name.trim();
    if (dateOfBirth) student.dateOfBirth = dateOfBirth;
    if (gender) student.gender = gender;
    if (father) student.father = { ...student.father, ...father };
    if (guardian) student.guardian = { ...student.guardian, ...guardian };
    if (contact) student.contact = { ...student.contact, ...contact };
    if (address) student.address = { ...student.address, ...address };
    if (previousSchool) student.previousSchool = { ...student.previousSchool, ...previousSchool };
    if (status) student.status = status;

    await student.save();

    return sendSuccess(res, 'Student profile updated successfully', { student });
  } catch (error) {
    next(error);
  }
};

export const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id);

    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    // Soft delete per Section 46
    student.status = 'inactive';
    await student.save();

    return sendSuccess(res, `Student '${student.name}' marked as inactive`);
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateStatus = async (req, res, next) => {
  try {
    const { studentIds, status } = req.body;
    if (!studentIds || !Array.isArray(studentIds) || !status) {
      return sendError(res, 'studentIds array and status are required', 400);
    }

    const validStatuses = ['active', 'inactive', 'struck_off', 'transferred', 'passout'];
    if (!validStatuses.includes(status)) {
      return sendError(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const result = await Student.updateMany(
      { _id: { $in: studentIds } },
      { $set: { status } }
    );

    return sendSuccess(res, `Updated status to '${status}' for ${result.modifiedCount} student(s)`, {
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download CSV Template for bulk student admission
 * GET /api/students/bulk-template
 */
export const getBulkImportTemplate = (_req, res) => {
  const headers = [
    'Name',
    'DateOfBirth',
    'Gender',
    'FatherName',
    'FatherCNIC',
    'FatherOccupation',
    'FatherPhone',
    'ContactPhone',
    'EmergencyPhone',
    'Email',
    'PresentAddress',
    'PermanentAddress',
    'City',
    'Class',
    'Section',
    'RollNumber',
    'GRNumber',
    'PreviousSchool',
    'AdmissionDate',
  ];

  const sampleRow1 = [
    'Muhammad Ahmed',
    '2015-05-14',
    'male',
    'Tariq Mahmood',
    '42101-1234567-1',
    'Businessman',
    '03001234567',
    '03001234567',
    '03219876543',
    'ahmed.tariq@gmail.com',
    'House 123 Sector 5-C North Karachi',
    'House 123 Sector 5-C North Karachi',
    'Karachi',
    'Grade 1',
    'A',
    '01',
    'GR-1042',
    'Beaconhouse School',
    '2026-04-01',
  ];

  const sampleRow2 = [
    'Fatima Zahra',
    '2016-08-22',
    'female',
    'Kamran Khan',
    '42201-7654321-3',
    'Engineer',
    '03331122334',
    '03331122334',
    '03459988776',
    'fatima.k@gmail.com',
    'Apartment 4B Gulshan-e-Iqbal',
    'Apartment 4B Gulshan-e-Iqbal',
    'Karachi',
    'Grade 2',
    'B',
    '05',
    '',
    'City Grammar School',
    '2026-04-01',
  ];

  const csvRows = [
    headers.join(','),
    sampleRow1.map((val) => `"${val.replace(/"/g, '""')}"`).join(','),
    sampleRow2.map((val) => `"${val.replace(/"/g, '""')}"`).join(','),
  ];

  const csvContent = csvRows.join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="Student_Bulk_Import_Template.csv"');
  return res.status(200).send(csvContent);
};

/**
 * Helper to parse CSV string into array of objects
 */
function parseCsvString(csvText) {
  if (!csvText || typeof csvText !== 'string') return [];
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header
  const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(obj);
  }

  return rows;
}

/**
 * Bulk Import Students via CSV or JSON array
 * POST /api/students/bulk-import
 */
export const bulkImportStudents = async (req, res, next) => {
  try {
    let studentRows = req.body.students;

    if (!studentRows && req.body.csvData) {
      studentRows = parseCsvString(req.body.csvData);
    }

    if (!studentRows || !Array.isArray(studentRows) || studentRows.length === 0) {
      return sendError(res, 'No student data provided. Provide a "students" array or "csvData" text.', 400);
    }

    if (studentRows.length > 500) {
      return sendError(res, 'Bulk import limit exceeded. Maximum 500 students per batch.', 400);
    }

    // Fetch classes, sections, and active session
    const [allClasses, allSections, activeSession] = await Promise.all([
      Class.find({ status: 'active' }).lean(),
      Section.find({ status: 'active' }).lean(),
      AcademicSession.findOne({ $or: [{ isCurrent: true }, { status: 'active' }] }).lean(),
    ]);

    if (!activeSession) {
      return sendError(res, 'No active academic session found. Please activate an academic session first.', 400);
    }

    // Map classes by name, code, and ID
    const classMap = new Map();
    allClasses.forEach((c) => {
      classMap.set(c.name.toLowerCase().trim(), c);
      if (c.code) classMap.set(c.code.toLowerCase().trim(), c);
      classMap.set(c._id.toString(), c);
    });

    // Map sections by classId and section name
    const sectionMap = new Map();
    allSections.forEach((s) => {
      const key = `${s.class.toString()}_${s.name.toLowerCase().trim()}`;
      sectionMap.set(key, s);
      sectionMap.set(s._id.toString(), s);
    });

    const currentYear = new Date().getFullYear();
    let currentStudentCount = await Student.countDocuments();

    const importedStudents = [];
    const errors = [];

    for (let i = 0; i < studentRows.length; i++) {
      const row = studentRows[i];
      const rowNum = i + 1;

      const name = (row.name || row.Name || '').trim();
      const dobRaw = (row.dateOfBirth || row.DateOfBirth || '').trim();
      const gender = (row.gender || row.Gender || '').toLowerCase().trim();
      const fatherName = (row.fatherName || row.FatherName || row.father?.name || '').trim();
      const fatherCnic = (row.fatherCnic || row.FatherCNIC || row.father?.cnic || '').trim();
      const fatherOccupation = (row.fatherOccupation || row.FatherOccupation || row.father?.occupation || '').trim();
      const fatherPhone = (row.fatherPhone || row.FatherPhone || row.father?.phone || '').trim();
      const contactPhone = (row.contactPhone || row.ContactPhone || row.contact?.phone || row.phone || '').trim();
      const emergencyPhone = (row.emergencyPhone || row.EmergencyPhone || row.contact?.emergencyPhone || '').trim();
      const email = (row.email || row.Email || row.contact?.email || '').trim().toLowerCase();
      const presentAddress = (row.presentAddress || row.PresentAddress || row.address?.present || '').trim();
      const permanentAddress = (row.permanentAddress || row.PermanentAddress || row.address?.permanent || '').trim();
      const city = (row.city || row.City || row.address?.city || 'Karachi').trim();
      const classNameRaw = (row.class || row.Class || row.className || '').trim();
      const sectionNameRaw = (row.section || row.Section || row.sectionName || '').trim();
      const rollNumber = (row.rollNumber || row.RollNumber || '').trim();
      const grNumber = (row.grNumber || row.GRNumber || '').trim();
      const previousSchoolName = (row.previousSchool || row.PreviousSchool || row.previousSchool?.schoolName || '').trim();
      const admissionDateRaw = (row.admissionDate || row.AdmissionDate || '').trim();

      // Required field validation
      if (!name) {
        errors.push({ row: rowNum, name: 'Unknown', reason: 'Student Name is required' });
        continue;
      }
      if (!dobRaw || isNaN(new Date(dobRaw).getTime())) {
        errors.push({ row: rowNum, name, reason: 'Valid Date of Birth is required (YYYY-MM-DD)' });
        continue;
      }
      if (!gender || !['male', 'female', 'other'].includes(gender)) {
        errors.push({ row: rowNum, name, reason: 'Gender must be male, female, or other' });
        continue;
      }
      if (!contactPhone) {
        errors.push({ row: rowNum, name, reason: 'Primary contact phone number is required' });
        continue;
      }
      if (!classNameRaw) {
        errors.push({ row: rowNum, name, reason: 'Class name is required' });
        continue;
      }

      // Resolve Class
      const matchedClass = classMap.get(classNameRaw.toLowerCase());
      if (!matchedClass) {
        errors.push({ row: rowNum, name, reason: `Class '${classNameRaw}' does not exist in active classes` });
        continue;
      }

      // Resolve Section
      let matchedSection = null;
      if (sectionNameRaw) {
        const secKey = `${matchedClass._id.toString()}_${sectionNameRaw.toLowerCase()}`;
        matchedSection = sectionMap.get(secKey);
      }
      if (!matchedSection) {
        matchedSection = allSections.find((s) => s.class.toString() === matchedClass._id.toString());
      }
      if (!matchedSection) {
        errors.push({ row: rowNum, name, reason: `No active section found for class '${matchedClass.name}'` });
        continue;
      }

      // Check GR Number uniqueness if supplied
      if (grNumber) {
        const existingGr = await Student.findOne({ grNumber });
        if (existingGr) {
          errors.push({ row: rowNum, name, reason: `GR Number '${grNumber}' is already in use by ${existingGr.name}` });
          continue;
        }
      }

      // Generate sequence IDs
      currentStudentCount++;
      const seq = String(currentStudentCount).padStart(4, '0');
      const studentId = `STD-${currentYear}-${seq}`;
      const admissionNumber = `ADM-${currentYear}-${seq}`;

      const admissionDate = admissionDateRaw && !isNaN(new Date(admissionDateRaw).getTime())
        ? new Date(admissionDateRaw)
        : new Date();

      // Create Student
      const newStudent = new Student({
        studentId,
        admissionNumber,
        grNumber: grNumber || undefined,
        name,
        dateOfBirth: new Date(dobRaw),
        gender,
        father: {
          name: fatherName || 'Father',
          cnic: fatherCnic,
          occupation: fatherOccupation,
          phone: fatherPhone || contactPhone,
        },
        contact: {
          phone: contactPhone,
          emergencyPhone,
          email,
        },
        address: {
          present: presentAddress,
          permanent: permanentAddress,
          city,
        },
        previousSchool: {
          schoolName: previousSchoolName,
        },
        admissionDate,
        status: 'active',
      });

      await newStudent.save();

      // Create Active Enrollment
      const newEnrollment = new Enrollment({
        student: newStudent._id,
        academicSession: activeSession._id,
        class: matchedClass._id,
        section: matchedSection._id,
        rollNumber: rollNumber || String((currentStudentCount % 50) + 1).padStart(2, '0'),
        status: 'active',
      });

      await newEnrollment.save();

      importedStudents.push({
        id: newStudent._id,
        studentId: newStudent.studentId,
        admissionNumber: newStudent.admissionNumber,
        name: newStudent.name,
        className: matchedClass.name,
        sectionName: matchedSection.name,
      });
    }

    if (importedStudents.length > 0) {
      AuditService.log({
        req,
        action: 'BULK_STUDENT_IMPORT',
        module: 'STUDENTS',
        description: `Bulk imported ${importedStudents.length} students successfully (${errors.length} skipped with errors)`,
        newData: {
          importedCount: importedStudents.length,
          failedCount: errors.length,
        },
      });
    }

    return sendSuccess(
      res,
      `Processed ${studentRows.length} rows: ${importedStudents.length} imported successfully, ${errors.length} failed.`,
      {
        totalProcessed: studentRows.length,
        importedCount: importedStudents.length,
        failedCount: errors.length,
        errors,
        importedStudents,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};


