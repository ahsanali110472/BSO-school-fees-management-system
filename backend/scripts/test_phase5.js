import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from '../models/Student.js';
import Enrollment from '../models/Enrollment.js';
import AcademicSession from '../models/AcademicSession.js';
import Class from '../models/Class.js';
import Section from '../models/Section.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/school_management';

async function testPhase5() {
  console.log('--- STARTING PHASE 5 AUTOMATED VERIFICATION ---');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  // Clean any remnants from prior test runs
  await Student.deleteMany({ name: 'Duplicate GR Test' });

  // Ensure indexes are built in MongoDB
  await Student.syncIndexes();
  await Enrollment.syncIndexes();
  console.log('Indexes synchronized in MongoDB.');

  try {
    // 1. Verify Seeded Students & Enrollments
    const students = await Student.find({}).populate({
      path: 'enrollments',
      populate: ['class', 'section', 'academicSession'],
    });
    console.log(`[PASS] Total students in DB: ${students.length}`);
    if (students.length < 5) throw new Error('Expected at least 5 seeded students.');

    const sample = students[0];
    console.log(`[PASS] Sample Student: ${sample.name} (${sample.studentId}), GR: ${sample.grNumber || 'None'}`);

    // 2. Verify Unique Auto-Generated IDs
    const studentIds = students.map((s) => s.studentId);
    const uniqueIds = new Set(studentIds);
    if (uniqueIds.size !== studentIds.length) {
      throw new Error('Duplicate studentId generated!');
    }
    console.log(`[PASS] Auto-generated studentId uniqueness verified: ${uniqueIds.size} unique IDs.`);

    // 3. Verify Compound Uniqueness: Student + AcademicSession Enrollment Rule (Section 45)
    const activeSession = await AcademicSession.findOne({ isCurrent: true });
    const grade8 = await Class.findOne({ name: 'Grade 8' });
    const secA8 = await Section.findOne({ class: grade8._id, name: 'A' });

    console.log(`Testing Single Enrollment per Session constraint on student ${sample._id}...`);
    let caughtDuplicateEnrollment = false;
    try {
      await Enrollment.create({
        student: sample._id,
        academicSession: activeSession._id,
        class: grade8._id,
        section: secA8._id,
        rollNumber: '99',
        status: 'active',
      });
    } catch (err) {
      caughtDuplicateEnrollment = true;
      console.log(`[PASS] Enforced Single Enrollment rule: ${err.message}`);
    }

    if (!caughtDuplicateEnrollment) {
      throw new Error('FAILED: Allowed duplicate enrollment in same session for the same student!');
    }

    // 4. Verify Unique GR Number Constraint (Sparse index)
    const duplicateGrStudent = new Student({
      name: 'Duplicate GR Test',
      dateOfBirth: new Date('2013-01-01'),
      gender: 'male',
      grNumber: sample.grNumber, // Same GR as sample
      father: { name: 'Test Father', phone: '0300-0000000' },
      contact: { phone: '0300-0000000' },
      address: { present: 'Test Address', city: 'Karachi' },
    });

    let caughtDuplicateGr = false;
    try {
      await duplicateGrStudent.save();
    } catch (err) {
      caughtDuplicateGr = true;
      console.log(`[PASS] Enforced GR Number uniqueness: ${err.message}`);
    }

    if (!caughtDuplicateGr && sample.grNumber) {
      throw new Error('FAILED: Allowed duplicate GR Number!');
    }

    // 5. Verify Student Search Query
    const searchRegex = { $regex: 'Ali', $options: 'i' };
    const searchResults = await Student.find({
      $or: [{ name: searchRegex }, { studentId: searchRegex }],
    });
    console.log(`[PASS] Multi-field search for 'Ali' returned: ${searchResults.length} student(s)`);

    // 6. Verify Enrollment History / Multi-session readiness
    const enrollments = await Enrollment.find({ student: sample._id });
    console.log(`[PASS] Found ${enrollments.length} enrollment record(s) for sample student`);

    console.log('\n--- ALL PHASE 5 AUTOMATED VERIFICATIONS PASSED SUCCESSFULLY ---');
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected cleanly.');
  }
}

testPhase5().catch((err) => {
  console.error('[TEST FAILED]', err);
  process.exit(1);
});
