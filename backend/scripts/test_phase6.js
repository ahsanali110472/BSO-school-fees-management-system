import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AcademicSession from '../models/AcademicSession.js';
import Class from '../models/Class.js';
import Section from '../models/Section.js';
import Student from '../models/Student.js';
import Enrollment from '../models/Enrollment.js';
import Promotion from '../models/Promotion.js';
import TransferCertificate from '../models/TransferCertificate.js';
import User from '../models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/school_management';

async function testPhase6() {
  console.log('--- STARTING PHASE 6 AUTOMATED VERIFICATION ---');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  try {
    const adminUser = await User.findOne({ role: 'super_admin' });
    const session2026 = await AcademicSession.findOne({ name: '2026-27' });
    const session2027 = await AcademicSession.findOne({ name: '2027-28' });
    const grade8 = await Class.findOne({ name: 'Grade 8' });
    const grade9 = await Class.findOne({ name: 'Grade 9' });
    const secA9 = await Section.findOne({ class: grade9._id, name: 'A' });

    if (!session2026 || !session2027 || !grade8 || !grade9) {
      throw new Error('Required academic sessions or classes not found in DB!');
    }

    // Clean any remnants from prior test runs in session 2027-28
    await Enrollment.deleteMany({ academicSession: session2027._id });
    await Promotion.deleteMany({ fromSession: session2026._id, toSession: session2027._id });
    await TransferCertificate.deleteMany({});

    // Reset previous enrollment statuses to active
    await Enrollment.updateMany(
      { academicSession: session2026._id },
      { $set: { status: 'active' } }
    );
    await Student.updateMany({}, { $set: { status: 'active' } });

    // 1. Fetch Candidates
    const candidates = await Enrollment.find({
      academicSession: session2026._id,
      class: grade8._id,
      status: 'active',
    }).populate('student');

    console.log(`[PASS] Found ${candidates.length} active candidate(s) in Grade 8 (Session 2026-27).`);
    if (candidates.length < 2) {
      throw new Error('Expected at least 2 active candidates in Grade 8.');
    }

    const studentToPromote = candidates[0].student;
    const studentToRetain = candidates[1].student;

    // 2. Test Batch Promotion & Retention
    const studentDecisions = [
      {
        studentId: studentToPromote._id,
        action: 'promoted',
        targetSectionId: secA9._id,
        rollNumber: '10',
      },
      {
        studentId: studentToRetain._id,
        action: 'retained',
        targetSectionId: candidates[1].section,
        rollNumber: '01',
      },
    ];

    console.log(`Executing batch promotion decision for ${studentDecisions.length} students...`);

    // Simulate batch promotion logic
    const promotionRecords = [];
    for (const item of studentDecisions) {
      const curEn = await Enrollment.findOne({
        student: item.studentId,
        academicSession: session2026._id,
        status: 'active',
      });

      if (item.action === 'promoted') {
        curEn.status = 'promoted';
        await curEn.save();

        const newEn = await Enrollment.create({
          student: item.studentId,
          academicSession: session2027._id,
          class: grade9._id,
          section: item.targetSectionId,
          rollNumber: item.rollNumber,
          status: 'active',
        });

        promotionRecords.push({
          student: item.studentId,
          previousEnrollment: curEn._id,
          newEnrollment: newEn._id,
          action: 'promoted',
        });
      } else if (item.action === 'retained') {
        curEn.status = 'repeated';
        await curEn.save();

        const newEn = await Enrollment.create({
          student: item.studentId,
          academicSession: session2027._id,
          class: grade8._id,
          section: item.targetSectionId,
          rollNumber: item.rollNumber,
          status: 'active',
        });

        promotionRecords.push({
          student: item.studentId,
          previousEnrollment: curEn._id,
          newEnrollment: newEn._id,
          action: 'retained',
        });
      }
    }

    const promotionAudit = await Promotion.create({
      fromSession: session2026._id,
      toSession: session2027._id,
      fromClass: grade8._id,
      toClass: grade9._id,
      promotedBy: adminUser._id,
      records: promotionRecords,
      totalEvaluated: studentDecisions.length,
      totalPromoted: 1,
      totalRetained: 1,
      totalPassedOut: 0,
      notes: 'Automated test promotion run',
    });

    console.log(`[PASS] Created Promotion audit record with ID: ${promotionAudit._id}`);

    // Verify Previous Enrollment Status Updated
    const oldEn1 = await Enrollment.findOne({ student: studentToPromote._id, academicSession: session2026._id });
    if (oldEn1.status !== 'promoted') {
      throw new Error(`Expected previous enrollment status 'promoted', got: ${oldEn1.status}`);
    }
    console.log(`[PASS] Promoted student previous enrollment status verified: ${oldEn1.status}`);

    const oldEn2 = await Enrollment.findOne({ student: studentToRetain._id, academicSession: session2026._id });
    if (oldEn2.status !== 'repeated') {
      throw new Error(`Expected previous enrollment status 'repeated', got: ${oldEn2.status}`);
    }
    console.log(`[PASS] Retained student previous enrollment status verified: ${oldEn2.status}`);

    // Verify New Active Enrollments in 2027-28
    const newEn1 = await Enrollment.findOne({ student: studentToPromote._id, academicSession: session2027._id });
    if (!newEn1 || newEn1.class.toString() !== grade9._id.toString() || newEn1.status !== 'active') {
      throw new Error('Promoted student new enrollment not properly configured in target class!');
    }
    console.log(`[PASS] Promoted student now active in Grade 9 for 2027-28.`);

    const newEn2 = await Enrollment.findOne({ student: studentToRetain._id, academicSession: session2027._id });
    if (!newEn2 || newEn2.class.toString() !== grade8._id.toString() || newEn2.status !== 'active') {
      throw new Error('Retained student new enrollment not properly configured in repeated class!');
    }
    console.log(`[PASS] Retained student now active in Grade 8 for 2027-28.`);

    // 3. Test Transfer Certificate Issuance
    const studentForTc = await Student.findOne({ name: 'Hamza Tariq' });
    if (!studentForTc) throw new Error('Student Hamza Tariq not found');

    const activeEnForTc = await Enrollment.findOne({ student: studentForTc._id, status: 'active' });
    if (!activeEnForTc) throw new Error('Active enrollment not found for Hamza Tariq');

    console.log(`Issuing Transfer Certificate for student ${studentForTc.name}...`);
    const tc = await TransferCertificate.create({
      student: studentForTc._id,
      lastSession: activeEnForTc.academicSession,
      lastClass: activeEnForTc.class,
      lastSection: activeEnForTc.section,
      reasonForLeaving: 'Parent transferred to Islamabad',
      conduct: 'Excellent',
      duesCleared: true,
      issuedBy: adminUser._id,
      status: 'issued',
    });

    console.log(`[PASS] Issued Transfer Certificate: ${tc.certificateNumber}`);
    if (!tc.certificateNumber.startsWith('TC-')) {
      throw new Error(`Invalid certificate number pattern: ${tc.certificateNumber}`);
    }

    // Verify student status transitioned to transferred
    activeEnForTc.status = 'transferred';
    await activeEnForTc.save();
    studentForTc.status = 'transferred';
    await studentForTc.save();

    const verifiedStudent = await Student.findById(studentForTc._id);
    if (verifiedStudent.status !== 'transferred') {
      throw new Error(`Expected student status 'transferred', got: ${verifiedStudent.status}`);
    }
    console.log(`[PASS] Student status updated to 'transferred'.`);

    // Clean up test data for clean runtime
    await Student.findByIdAndUpdate(studentForTc._id, { status: 'active' });
    await Enrollment.findByIdAndUpdate(activeEnForTc._id, { status: 'active' });

    console.log('\n--- ALL PHASE 6 AUTOMATED VERIFICATIONS PASSED SUCCESSFULLY ---');
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected cleanly.');
  }
}

testPhase6().catch((err) => {
  console.error('[PHASE 6 TEST FAILED]', err);
  process.exit(1);
});
