import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FeeHead from '../models/FeeHead.js';
import FeeStructure from '../models/FeeStructure.js';
import FeeConcession from '../models/FeeConcession.js';
import StudentConcession from '../models/StudentConcession.js';
import AcademicSession from '../models/AcademicSession.js';
import Class from '../models/Class.js';
import Student from '../models/Student.js';
import User from '../models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/school_management';

async function testPhase7() {
  console.log('--- STARTING PHASE 7 AUTOMATED VERIFICATION ---');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  try {
    // 1. Verify Seeded Fee Heads
    const feeHeads = await FeeHead.find();
    console.log(`[PASS] Found ${feeHeads.length} seeded fee head(s).`);
    if (feeHeads.length < 5) throw new Error('Expected at least 5 fee heads.');

    const tuitionHead = feeHeads.find((h) => h.code === 'TUI');
    const labHead = feeHeads.find((h) => h.code === 'LAB');
    if (!tuitionHead || !labHead) throw new Error('Essential fee heads (TUI, LAB) missing.');
    console.log(`[PASS] Verified Tuition Head: ${tuitionHead.name} (${tuitionHead.frequency})`);

    // Verify FeeHead unique code constraint
    let caughtDuplicateCode = false;
    try {
      await FeeHead.create({
        name: 'Duplicate Tuition',
        code: 'TUI',
        frequency: 'monthly',
      });
    } catch (err) {
      caughtDuplicateCode = true;
      console.log(`[PASS] Enforced unique FeeHead code: ${err.message}`);
    }
    if (!caughtDuplicateCode) throw new Error('Failed to enforce FeeHead code uniqueness');

    // 2. Verify Fee Structure Configuration
    const session = await AcademicSession.findOne({ isCurrent: true });
    const grade8 = await Class.findOne({ name: 'Grade 8' });
    if (!session || !grade8) throw new Error('Active session or Grade 8 class missing.');

    const g8Structure = await FeeStructure.findOne({
      academicSession: session._id,
      class: grade8._id,
    }).populate('feeItems.feeHead');

    if (!g8Structure) throw new Error('Grade 8 fee structure not found.');
    console.log(`[PASS] Grade 8 Fee Structure retrieved: Monthly = PKR ${g8Structure.totalMonthlyAmount}, Annual = PKR ${g8Structure.totalAnnualAmount}`);
    console.log(`[PASS] Late fine policy verified: Due Day ${g8Structure.dueDayOfMonth}, Grace Days ${g8Structure.gracePeriodDays}, Late Fine PKR ${g8Structure.lateFineAmount} (${g8Structure.lateFineType})`);

    // Verify FeeStructure compound uniqueness: { academicSession: 1, class: 1 }
    let caughtDuplicateStructure = false;
    try {
      await FeeStructure.create({
        academicSession: session._id,
        class: grade8._id,
        feeItems: [{ feeHead: tuitionHead._id, amount: 5000 }],
      });
    } catch (err) {
      caughtDuplicateStructure = true;
      console.log(`[PASS] Enforced FeeStructure compound uniqueness: ${err.message}`);
    }
    if (!caughtDuplicateStructure) throw new Error('Failed to enforce FeeStructure compound uniqueness');

    // 3. Verify Fee Concessions
    const concessions = await FeeConcession.find();
    console.log(`[PASS] Found ${concessions.length} fee concession template(s).`);
    const siblingDiscount = concessions.find((c) => c.code === 'SIB-25');
    if (!siblingDiscount) throw new Error('Sibling discount concession missing.');
    console.log(`[PASS] Sibling discount verified: ${siblingDiscount.name} (${siblingDiscount.value}%)`);

    // 4. Verify Student Concession Assignment
    const student = await Student.findOne({ studentId: 'STD-2026-0001' });
    const studentConcessions = await StudentConcession.find({
      student: student._id,
      academicSession: session._id,
      status: 'active',
    }).populate('concession');

    console.log(`[PASS] Found ${studentConcessions.length} active concession(s) for sample student ${student.name}`);
    if (studentConcessions.length > 0) {
      console.log(`[PASS] Active grant: ${studentConcessions[0].concession.name} (${studentConcessions[0].reason})`);
    }

    console.log('\n--- ALL PHASE 7 AUTOMATED VERIFICATIONS PASSED SUCCESSFULLY ---');
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected cleanly.');
  }
}

testPhase7().catch((err) => {
  console.error('[PHASE 7 TEST FAILED]', err);
  process.exit(1);
});
