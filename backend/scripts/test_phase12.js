import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AuditLog from '../models/AuditLog.js';
import AuditService from '../services/audit.service.js';
import User from '../models/User.js';
import { sanitizeQueryInputs } from '../middleware/security.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/school_management';

async function runPhase12Tests() {
  console.log('==================================================');
  console.log('       RUNNING PHASE 12 AUTOMATED TEST SUITE       ');
  console.log('          Security Hardening & Audit Logs          ');
  console.log('==================================================\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('[Test 1] Database connection established.');

    const admin = await User.findOne({ role: 'super_admin' });
    if (!admin) {
      throw new Error('Super admin user not found.');
    }

    // 1. Test Audit Logging
    console.log('\n[Test 2] Testing AuditService event logging...');
    await AuditService.log({
      user: admin,
      action: 'SECURITY_AUDIT_TEST',
      module: 'SETTINGS',
      recordId: 'SEC-001',
      description: 'Automated verification test of audit logging infrastructure',
      oldData: { status: 'unverified', password: 'SuperSecretPassword123' },
      newData: { status: 'verified', password: 'AnotherSecretPassword456' },
      status: 'SUCCESS',
    });

    const loggedEntry = await AuditLog.findOne({ action: 'SECURITY_AUDIT_TEST' }).sort({ timestamp: -1 });
    if (!loggedEntry) {
      throw new Error('Failed to retrieve newly created audit log entry.');
    }
    console.log(`- Created log: [${loggedEntry.module}] ${loggedEntry.action} by ${loggedEntry.userName}`);
    console.log(`- Status: ${loggedEntry.status}`);
    console.log('[PASS] Audit log created and verified in database.');

    // 2. Test Data Sanitization (Scrubbing sensitive passwords / secrets)
    console.log('\n[Test 3] Testing Sensitive Data Sanitization (Section 36: Never store plaintext passwords)...');
    if (loggedEntry.oldData?.password !== '********' || loggedEntry.newData?.password !== '********') {
      throw new Error(`Sanitization failed: password field was not scrubbed! Received: ${loggedEntry.oldData?.password}`);
    }
    console.log(`- Old password scrubbed to: ${loggedEntry.oldData.password}`);
    console.log(`- New password scrubbed to: ${loggedEntry.newData.password}`);
    console.log('[PASS] Sensitive fields scrubbed automatically.');

    // 3. Test NoSQL Injection Protection
    console.log('\n[Test 4] Testing NoSQL Injection Protection (Query Sanitizer)...');
    const maliciousReq = {
      body: {
        username: 'admin',
        $gt: '',
        nested: { safe: 123, $where: 'sleep(1000)' },
      },
      query: {
        id: { $ne: null },
      },
      params: {},
    };

    sanitizeQueryInputs(maliciousReq, {}, () => {});
    if ('$gt' in maliciousReq.body || '$where' in maliciousReq.body.nested || '$ne' in maliciousReq.query.id) {
      throw new Error('NoSQL injection protection failed: MongoDB operator keys were not removed!');
    }
    console.log('- Malicious keys ($gt, $where, $ne) successfully stripped from request.');
    console.log('[PASS] NoSQL query injection protection active.');

    // 4. Test Audit Log Query & Module Distribution
    console.log('\n[Test 5] Testing Audit Log Querying & Distribution...');
    const totalCount = await AuditLog.countDocuments();
    const modules = await AuditLog.distinct('module');
    console.log(`- Total audit log entries in system: ${totalCount}`);
    console.log(`- Modules tracked: ${modules.join(', ')}`);
    if (totalCount === 0) {
      throw new Error('Expected at least 1 audit log entry.');
    }
    console.log('[PASS] Audit log querying verified.');

    console.log('\n==================================================');
    console.log('    ALL PHASE 12 TESTS COMPLETED SUCCESSFULLY!    ');
    console.log('==================================================');
    process.exit(0);
  } catch (error) {
    console.error('\n[TEST FAILURE]', error);
    process.exit(1);
  }
}

runPhase12Tests();
