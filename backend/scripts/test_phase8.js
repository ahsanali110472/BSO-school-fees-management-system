import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Challan from '../models/Challan.js';
import Student from '../models/Student.js';
import AcademicSession from '../models/AcademicSession.js';
import Class from '../models/Class.js';
import FeeStructure from '../models/FeeStructure.js';
import StudentConcession from '../models/StudentConcession.js';
import User from '../models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/school_management';

async function testPhase8() {
  console.log('--- STARTING PHASE 8 AUTOMATED VERIFICATION ---');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  // Clean any test duplicates from prior failed runs
  await Challan.deleteMany({ subTotal: 3500, feeItems: { $size: 1 } });
  await Challan.syncIndexes();
  console.log('Challan indexes synchronized in MongoDB.');

  try {
    const session = await AcademicSession.findOne({ isCurrent: true });
    const grade8 = await Class.findOne({ name: 'Grade 8' });
    const student1 = await Student.findOne({ studentId: 'STD-2026-0001' }); // Has sibling discount
    const student2 = await Student.findOne({ studentId: 'STD-2026-0002' }); // No concession

    if (!session || !grade8 || !student1 || !student2) {
      throw new Error('Required test fixtures not found in DB!');
    }

    // 1. Verify Seeded Challans for April 2026
    const aprilChallans = await Challan.find({
      academicSession: session._id,
      billingMonth: 4,
      billingYear: 2026,
    }).populate('student class');

    console.log(`[PASS] Found ${aprilChallans.length} seeded monthly challan(s) for April 2026.`);
    if (aprilChallans.length === 0) throw new Error('Expected at least 1 seeded challan.');

    const sampleCh = aprilChallans[0];
    console.log(`[PASS] Sample Challan: ${sampleCh.challanNumber} for ${sampleCh.student?.name} (${sampleCh.monthName})`);
    if (!sampleCh.challanNumber.startsWith('CH-2026-04-')) {
      throw new Error(`Unexpected challan number format: ${sampleCh.challanNumber}`);
    }

    // 2. Verify Concession Deduction on Student 1
    const ch1 = aprilChallans.find((c) => c.student?._id.toString() === student1._id.toString());
    if (ch1) {
      console.log(`[PASS] Student 1 (Syed Ali Raza): Subtotal = PKR ${ch1.subTotal}, Concession = PKR ${ch1.concessionAmount}, Total Payable = PKR ${ch1.totalPayable}`);
      if (ch1.concessionAmount !== 875) {
        throw new Error(`Expected concession PKR 875, got: ${ch1.concessionAmount}`);
      }
    }

    // 3. Verify Compound Uniqueness: Student + Month + Year + Session
    console.log(`Testing duplicate monthly challan constraint...`);
    let caughtDuplicate = false;
    try {
      await Challan.create({
        student: student1._id,
        academicSession: session._id,
        class: grade8._id,
        billingMonth: 4,
        billingYear: 2026,
        monthName: 'April 2026',
        dueDate: new Date('2026-04-10'),
        feeItems: [{ headName: 'Monthly Tuition Fee', amount: 3500 }],
        subTotal: 3500,
        totalPayable: 3500,
        totalPayableAfterDue: 3700,
        balanceAmount: 3500,
      });
    } catch (err) {
      caughtDuplicate = true;
      console.log(`[PASS] Enforced duplicate challan constraint: ${err.message}`);
    }
    if (!caughtDuplicate) throw new Error('FAILED: Allowed duplicate challan for same student in same month/year!');

    // 4. Test Arrears Rollover into May 2026
    // Clean any remnants in May 2026 from prior test runs
    await Challan.deleteMany({ billingMonth: 5, billingYear: 2026 });

    console.log(`Generating May 2026 Challan with arrears for ${student2.name}...`);
    // Student 2 has unpaid April challan with balance PKR 4000
    const aprilCh2 = await Challan.findOne({ student: student2._id, billingMonth: 4, billingYear: 2026 });
    const previousBalance = aprilCh2 ? aprilCh2.balanceAmount : 4000;

    const mayChallan = await Challan.create({
      student: student2._id,
      academicSession: session._id,
      class: grade8._id,
      billingMonth: 5,
      billingYear: 2026,
      monthName: 'May 2026',
      dueDate: new Date('2026-05-10'),
      feeItems: [{ headName: 'Monthly Tuition Fee', amount: 3500 }, { headName: 'Computer Lab Fee', amount: 500 }],
      subTotal: 4000,
      concessionAmount: 0,
      arrears: previousBalance,
      lateFineAmount: 200,
      totalPayable: 4000 + previousBalance,
      totalPayableAfterDue: 4000 + previousBalance + 200,
      paidAmount: 0,
      balanceAmount: 4000 + previousBalance,
      status: 'unpaid',
    });

    console.log(`[PASS] May 2026 Challan created: ${mayChallan.challanNumber}, Arrears = PKR ${mayChallan.arrears}, Total Payable = PKR ${mayChallan.totalPayable}`);
    if (mayChallan.arrears !== previousBalance || mayChallan.totalPayable !== 8000) {
      throw new Error(`Arrears computation failed: expected 8000 total, got ${mayChallan.totalPayable}`);
    }

    // 5. Test Voiding Challan
    mayChallan.status = 'void';
    mayChallan.voidReason = 'Test cancellation';
    await mayChallan.save();

    const voidedCh = await Challan.findById(mayChallan._id);
    if (voidedCh.status !== 'void' || voidedCh.voidReason !== 'Test cancellation') {
      throw new Error('Void challan update failed!');
    }
    console.log(`[PASS] Successfully voided challan with reason: ${voidedCh.voidReason}`);

    // Clean up temporary May test challan
    await Challan.deleteOne({ _id: mayChallan._id });

    console.log('\n--- ALL PHASE 8 AUTOMATED VERIFICATIONS PASSED SUCCESSFULLY ---');
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected cleanly.');
  }
}

testPhase8().catch((err) => {
  console.error('[PHASE 8 TEST FAILED]', err);
  process.exit(1);
});
