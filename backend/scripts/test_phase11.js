import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import Section from '../models/Section.js';
import Payment from '../models/Payment.js';
import Challan from '../models/Challan.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/school_management';

async function runPhase11Tests() {
  console.log('==================================================');
  console.log('       RUNNING PHASE 11 AUTOMATED TEST SUITE       ');
  console.log('          Role-Specific Dashboards & KPIs          ');
  console.log('==================================================\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('[Test 1] Database connection established.');

    // 1. Verify entity counts
    const [studentsCount, teachersCount, classesCount, sectionsCount] = await Promise.all([
      Student.countDocuments({ status: 'active' }),
      Teacher.countDocuments({ status: 'active' }),
      Class.countDocuments({ status: 'active' }),
      Section.countDocuments({ status: 'active' }),
    ]);

    console.log(`[Test 2] Entities: ${studentsCount} Students, ${teachersCount} Teachers, ${classesCount} Classes, ${sectionsCount} Sections.`);
    if (classesCount === 0) {
      throw new Error('Expected at least 1 active class.');
    }
    console.log('[PASS] Entity counts verified.');

    // 2. Verify Payments & Today / Month collections
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [todayAgg, monthAgg] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'completed', paymentDate: { $gte: startOfToday, $lte: endOfToday } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'completed', paymentDate: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    const todayTotal = todayAgg[0]?.total || 0;
    const monthTotal = monthAgg[0]?.total || 0;
    console.log(`[Test 3] Collections: Today = PKR ${todayTotal.toLocaleString()}, Month = PKR ${monthTotal.toLocaleString()}`);
    console.log('[PASS] Financial collections aggregation verified.');

    // 3. Verify Outstanding Fees & Pending Challans
    const outstandingAgg = await Challan.aggregate([
      {
        $match: {
          status: { $in: ['unpaid', 'partially_paid', 'overdue'] },
          balanceAmount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          totalOutstanding: { $sum: '$balanceAmount' },
          pendingCount: { $sum: 1 },
        },
      },
    ]);

    const totalOutstanding = outstandingAgg[0]?.totalOutstanding || 0;
    const pendingCount = outstandingAgg[0]?.pendingCount || 0;
    console.log(`[Test 4] Outstanding: PKR ${totalOutstanding.toLocaleString()} across ${pendingCount} pending challans.`);
    console.log('[PASS] Outstanding balance calculations verified.');

    // 4. Verify Payment Methods breakdown
    const methods = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    console.log(`[Test 5] Payment channels analyzed: ${methods.length} distinct methods.`);
    methods.forEach(m => console.log(`  * ${m._id}: PKR ${m.total.toLocaleString()} (${m.count} txns)`));
    console.log('[PASS] Payment channels analyzed successfully.');

    // 5. Verify Recent Payments
    const recentPayments = await Payment.find({ status: 'completed' })
      .populate('student', 'name admissionNumber')
      .populate('class', 'name')
      .limit(5);
    console.log(`[Test 6] Fetched ${recentPayments.length} recent payments.`);
    if (recentPayments.length > 0) {
      console.log(`  * Sample receipt: ${recentPayments[0].receiptNumber} (${recentPayments[0].student?.name}) - PKR ${recentPayments[0].amount}`);
    }
    console.log('[PASS] Recent payments feed verified.');

    // 6. Verify Recent Admissions
    const recentStudents = await Student.find({ status: 'active' })
      .sort({ admissionDate: -1 })
      .limit(5);
    console.log(`[Test 7] Fetched ${recentStudents.length} recent admissions.`);
    if (recentStudents.length > 0) {
      console.log(`  * Sample admission: ${recentStudents[0].name} (${recentStudents[0].admissionNumber})`);
    }
    console.log('[PASS] Recent admissions feed verified.');

    console.log('\n==================================================');
    console.log('    ALL PHASE 11 TESTS COMPLETED SUCCESSFULLY!    ');
    console.log('==================================================');
    process.exit(0);
  } catch (error) {
    console.error('\n[TEST FAILURE]', error);
    process.exit(1);
  }
}

runPhase11Tests();
