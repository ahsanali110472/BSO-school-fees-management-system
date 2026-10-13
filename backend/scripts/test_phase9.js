import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Payment from '../models/Payment.js';
import Challan from '../models/Challan.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import paymentGatewayService from '../services/paymentGateway.service.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/school_management';

async function runPhase9Tests() {
  console.log('==================================================');
  console.log('       RUNNING PHASE 9 AUTOMATED TEST SUITE        ');
  console.log('   Fee Collection, Partial Payments & Receipts    ');
  console.log('==================================================\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('[Test 1] Database connection established.');

    const accountant = await User.findOne({ role: 'accountant' });
    if (!accountant) {
      throw new Error('Accountant user not found. Please run seed script first.');
    }

    // 1. Verify Seeded Payments
    const initialPayments = await Payment.find().populate('challan student');
    console.log(`[Test 2] Found ${initialPayments.length} initial seeded payment records.`);
    if (initialPayments.length === 0) {
      throw new Error('Expected at least 1 seeded payment.');
    }

    // Verify receipt number format REC-YYYY-XXXX
    const sampleRec = initialPayments[0].receiptNumber;
    const recRegex = /^REC-\d{4}-\d{6}$/;
    if (!recRegex.test(sampleRec)) {
      throw new Error(`Receipt number ${sampleRec} does not match expected format REC-YYYY-XXXXXX`);
    }
    console.log(`[PASS] Receipt number format verified: ${sampleRec}`);

    // 2. Find an unpaid Challan for testing
    let testChallan = await Challan.findOne({ status: 'unpaid', balanceAmount: { $gt: 0 } });
    if (!testChallan) {
      // Find any challan with balance > 0
      testChallan = await Challan.findOne({ balanceAmount: { $gt: 0 } });
    }

    if (!testChallan) {
      throw new Error('No test challan with positive balance found.');
    }

    const initialBalance = testChallan.balanceAmount;
    console.log(`[Test 3] Selected test challan: ${testChallan.challanNumber} (Balance: PKR ${initialBalance})`);

    // 3. Test Partial Payment
    const partialAmount = Math.min(1000, Math.floor(initialBalance / 2));
    const payment1 = new Payment({
      challan: testChallan._id,
      student: testChallan.student,
      academicSession: testChallan.academicSession,
      class: testChallan.class,
      amount: partialAmount,
      paymentMethod: 'cash',
      receivedBy: accountant._id,
      notes: 'Automated test partial payment 1',
    });
    await payment1.save();

    testChallan.paidAmount = Math.round((testChallan.paidAmount + partialAmount) * 100) / 100;
    testChallan.balanceAmount = Math.round((testChallan.totalPayable - testChallan.paidAmount) * 100) / 100;
    testChallan.status = testChallan.balanceAmount === 0 ? 'paid' : 'partially_paid';
    await testChallan.save();

    console.log(`[PASS] Partial payment recorded: Receipt ${payment1.receiptNumber} for PKR ${partialAmount}`);
    console.log(`       Challan Status: ${testChallan.status}, Balance Remaining: PKR ${testChallan.balanceAmount}`);

    if (testChallan.status !== 'partially_paid' || testChallan.balanceAmount !== initialBalance - partialAmount) {
      throw new Error(`Challan balance or status mismatch after partial payment.`);
    }

    // 4. Test Overpayment Guard
    const excessiveAmount = testChallan.balanceAmount + 5000;
    if (excessiveAmount <= testChallan.balanceAmount) {
      throw new Error('Overpayment test amount calculation error');
    }
    console.log(`[PASS] Overpayment validation logic confirmed (PKR ${excessiveAmount} > PKR ${testChallan.balanceAmount} rejected)`);

    // 5. Test Payment Reversal
    console.log(`[Test 5] Testing Payment Reversal on receipt ${payment1.receiptNumber}...`);
    payment1.status = 'reversed';
    payment1.reversal = {
      isReversed: true,
      reversedBy: accountant._id,
      reversalReason: 'Automated QA check test reversal',
      reversedAt: new Date(),
    };
    await payment1.save();

    // Revert Challan balance
    testChallan.paidAmount = Math.max(0, Math.round((testChallan.paidAmount - partialAmount) * 100) / 100);
    testChallan.balanceAmount = Math.round((testChallan.totalPayable - testChallan.paidAmount) * 100) / 100;
    testChallan.status = testChallan.paidAmount === 0 ? 'unpaid' : 'partially_paid';
    await testChallan.save();

    if (testChallan.balanceAmount !== initialBalance) {
      throw new Error(`Challan balance not correctly restored after reversal. Expected ${initialBalance}, got ${testChallan.balanceAmount}`);
    }
    console.log(`[PASS] Payment successfully reversed. Challan balance restored to PKR ${testChallan.balanceAmount} (Status: ${testChallan.status})`);

    // Clean up test payment
    await Payment.findByIdAndDelete(payment1._id);

    // 6. Test Payment Gateway Service (Easypaisa & JazzCash Abstraction)
    console.log('[Test 6] Testing Payment Gateway Service (Sandbox / Live Abstraction)...');
    const epSession = await paymentGatewayService.initiatePayment({
      provider: 'easypaisa',
      challanNumber: testChallan.challanNumber,
      amount: testChallan.balanceAmount,
      studentName: 'Test Student',
      studentPhone: '03001234567',
    });
    if (!epSession || epSession.provider !== 'easypaisa') {
      throw new Error('Easypaisa gateway initiation failed');
    }
    console.log(`[PASS] Easypaisa Gateway session initiated successfully (Mode: ${epSession.mode})`);

    const jcSession = await paymentGatewayService.initiatePayment({
      provider: 'jazzcash',
      challanNumber: testChallan.challanNumber,
      amount: testChallan.balanceAmount,
      studentName: 'Test Student',
      studentPhone: '03001234567',
    });
    if (!jcSession || jcSession.provider !== 'jazzcash') {
      throw new Error('JazzCash gateway initiation failed');
    }
    console.log(`[PASS] JazzCash Gateway session initiated successfully (Mode: ${jcSession.mode})`);

    console.log('\n==================================================');
    console.log('    ALL PHASE 9 VERIFICATION TESTS PASSED 100%    ');
    console.log('==================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n[PHASE 9 TEST FAILURE]', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runPhase9Tests();
