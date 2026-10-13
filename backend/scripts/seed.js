import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import AcademicSession from '../models/AcademicSession.js';
import Class from '../models/Class.js';
import Section from '../models/Section.js';
import Subject from '../models/Subject.js';
import Teacher from '../models/Teacher.js';
import TeacherAssignment from '../models/TeacherAssignment.js';
import Timetable from '../models/Timetable.js';
import Student from '../models/Student.js';
import Enrollment from '../models/Enrollment.js';
import FeeHead from '../models/FeeHead.js';
import FeeStructure from '../models/FeeStructure.js';
import FeeConcession from '../models/FeeConcession.js';
import StudentConcession from '../models/StudentConcession.js';
import Challan from '../models/Challan.js';
import Payment from '../models/Payment.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/school_management';

const seedData = async () => {
  try {
    console.log(`[Seed] Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('[Seed] Database connected successfully.');

    // 1. Initial users (Phase 2)
    const usersToSeed = [
      {
        name: 'Super Administrator',
        email: 'superadmin@school.com',
        password: 'SuperAdmin123!',
        role: 'super_admin',
        status: 'active',
      },
      {
        name: 'School Administrator',
        email: 'admin@school.com',
        password: 'Admin123!',
        role: 'school_admin',
        status: 'active',
      },
      {
        name: 'Chief Accountant',
        email: 'accountant@school.com',
        password: 'Accountant123!',
        role: 'accountant',
        status: 'active',
      },
    ];

    for (const userData of usersToSeed) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        await User.create(userData);
        console.log(`[Seed] Created ${userData.role} user: ${userData.email}`);
      }
    }

    // 2. Academic Sessions (Phase 3 & Phase 6 Promotions)
    let session = await AcademicSession.findOne({ name: '2026-27' });
    if (!session) {
      session = await AcademicSession.create({
        name: '2026-27',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        isCurrent: true,
        status: 'active',
        description: 'Standard Academic Session 2026-2027',
      });
      console.log('[Seed] Created active Academic Session: 2026-27');
    }

    let nextSession = await AcademicSession.findOne({ name: '2027-28' });
    if (!nextSession) {
      nextSession = await AcademicSession.create({
        name: '2027-28',
        startDate: new Date('2027-04-01'),
        endDate: new Date('2028-03-31'),
        isCurrent: false,
        status: 'active',
        description: 'Upcoming Academic Session 2027-2028',
      });
      console.log('[Seed] Created target Academic Session for promotions: 2027-28');
    }

    // 3. Classes & Sections (Phase 3)
    const classesData = [
      { name: 'Play Group', code: 'PG', order: 1 },
      { name: 'Nursery', code: 'NUR', order: 2 },
      { name: 'KG', code: 'KG', order: 3 },
      { name: 'Grade 1', code: 'G1', order: 4 },
      { name: 'Grade 2', code: 'G2', order: 5 },
      { name: 'Grade 3', code: 'G3', order: 6 },
      { name: 'Grade 4', code: 'G4', order: 7 },
      { name: 'Grade 5', code: 'G5', order: 8 },
      { name: 'Grade 6', code: 'G6', order: 9 },
      { name: 'Grade 7', code: 'G7', order: 10 },
      { name: 'Grade 8', code: 'G8', order: 11 },
      { name: 'Grade 9', code: 'G9', order: 12 },
      { name: 'Grade 10', code: 'G10', order: 13 },
    ];

    for (const c of classesData) {
      let classDoc = await Class.findOne({ name: c.name });
      if (!classDoc) {
        classDoc = await Class.create({
          name: c.name,
          code: c.code,
          order: c.order,
          status: 'active',
        });
      }

      const defaultSections = ['A', 'B'];
      for (const secName of defaultSections) {
        const existingSection = await Section.findOne({
          class: classDoc._id,
          name: secName,
        });

        if (!existingSection) {
          await Section.create({
            name: secName,
            class: classDoc._id,
            capacity: 35,
            status: 'active',
          });
        }
      }
    }

    // 4. Curriculum Subjects (Phase 3)
    const subjectsData = [
      { name: 'Mathematics', code: 'MATH-101', type: 'theory' },
      { name: 'English Literature & Grammar', code: 'ENG-101', type: 'theory' },
      { name: 'Urdu Language & Literature', code: 'URD-101', type: 'theory' },
      { name: 'General Science', code: 'SCI-101', type: 'theory' },
      { name: 'Computer Studies', code: 'COMP-101', type: 'both' },
      { name: 'Islamiyat', code: 'ISL-101', type: 'theory' },
      { name: 'Pakistan Studies', code: 'PST-101', type: 'theory' },
      { name: 'Physics', code: 'PHY-101', type: 'both' },
      { name: 'Chemistry', code: 'CHEM-101', type: 'both' },
      { name: 'Biology', code: 'BIO-101', type: 'both' },
    ];

    for (const sub of subjectsData) {
      const existingSub = await Subject.findOne({ code: sub.code });
      if (!existingSub) {
        await Subject.create(sub);
      }
    }

    // 5. Teachers & Assignments (Phase 4)
    const teachersData = [
      {
        teacherId: 'TCH-0001',
        name: 'Mr. Muhammad Tariq',
        fatherName: 'Abdul Rehman',
        cnic: '42101-1234567-1',
        phone: '0300-1234567',
        email: 'tariq.math@school.com',
        address: 'House 14, Block 5, Gulshan, Karachi',
        qualification: 'M.Sc. Mathematics, B.Ed',
        status: 'active',
      },
      {
        teacherId: 'TCH-0002',
        name: 'Ms. Ayesha Siddiqui',
        fatherName: 'Rashid Siddiqui',
        cnic: '42101-7654321-2',
        phone: '0321-9876543',
        email: 'ayesha.sci@school.com',
        address: 'Flat 202, Al-Razi Heights, PECHS, Karachi',
        qualification: 'M.Sc. Physics, M.Ed',
        status: 'active',
      },
      {
        teacherId: 'TCH-0003',
        name: 'Mr. Farhan Ahmed',
        fatherName: 'Munir Ahmed',
        cnic: '42101-5554321-3',
        phone: '0333-5551234',
        email: 'farhan.eng@school.com',
        address: 'B-12, Sector 11-A, North Karachi',
        qualification: 'M.A. English Literature',
        status: 'active',
      },
    ];

    const seededTeachers = [];
    for (const t of teachersData) {
      let teacherDoc = await Teacher.findOne({ teacherId: t.teacherId });
      if (!teacherDoc) {
        teacherDoc = await Teacher.create(t);
        console.log(`[Seed] Created teacher: ${t.name} (${t.teacherId})`);
      }
      seededTeachers.push(teacherDoc);
    }

    // Link references for sample teaching assignments
    const grade8 = await Class.findOne({ name: 'Grade 8' });
    const grade9 = await Class.findOne({ name: 'Grade 9' });
    const grade10 = await Class.findOne({ name: 'Grade 10' });
    const secA8 = await Section.findOne({ class: grade8?._id, name: 'A' });
    const secB8 = await Section.findOne({ class: grade8?._id, name: 'B' });
    const secA9 = await Section.findOne({ class: grade9?._id, name: 'A' });
    const secA10 = await Section.findOne({ class: grade10?._id, name: 'A' });

    const mathSub = await Subject.findOne({ code: 'MATH-101' });
    const phySub = await Subject.findOne({ code: 'PHY-101' });
    const engSub = await Subject.findOne({ code: 'ENG-101' });

    if (grade8 && secA8 && mathSub && seededTeachers[0]) {
      // Teacher 1: Mathematics assignments
      const t1Assignments = [
        { teacher: seededTeachers[0]._id, class: grade8._id, section: secA8._id, subject: mathSub._id, isClassTeacher: true },
        { teacher: seededTeachers[0]._id, class: grade8._id, section: secB8._id, subject: mathSub._id, isClassTeacher: false },
        { teacher: seededTeachers[0]._id, class: grade9._id, section: secA9._id, subject: mathSub._id, isClassTeacher: false },
      ];

      for (const a of t1Assignments) {
        const existingA = await TeacherAssignment.findOne({
          teacher: a.teacher,
          academicSession: session._id,
          class: a.class,
          section: a.section,
          subject: a.subject,
        });
        if (!existingA) {
          await TeacherAssignment.create({
            ...a,
            academicSession: session._id,
          });
        }
      }

      // Teacher 2: Physics assignments
      if (phySub && seededTeachers[1]) {
        const t2Assignments = [
          { teacher: seededTeachers[1]._id, class: grade9._id, section: secA9._id, subject: phySub._id, isClassTeacher: true },
          { teacher: seededTeachers[1]._id, class: grade10._id, section: secA10._id, subject: phySub._id, isClassTeacher: false },
        ];
        for (const a of t2Assignments) {
          const existingA = await TeacherAssignment.findOne({
            teacher: a.teacher,
            academicSession: session._id,
            class: a.class,
            section: a.section,
            subject: a.subject,
          });
          if (!existingA) {
            await TeacherAssignment.create({
              ...a,
              academicSession: session._id,
            });
          }
        }
      }

      // 6. Sample Timetable Slots
      const timetableSlots = [
        {
          teacher: seededTeachers[0]._id,
          class: grade8._id,
          section: secA8._id,
          subject: mathSub._id,
          day: 'Monday',
          startTime: '09:00',
          endTime: '10:00',
          room: 'Room 4',
        },
        {
          teacher: seededTeachers[0]._id,
          class: grade8._id,
          section: secB8._id,
          subject: mathSub._id,
          day: 'Monday',
          startTime: '10:00',
          endTime: '11:00',
          room: 'Room 5',
        },
        {
          teacher: seededTeachers[1]._id,
          class: grade9._id,
          section: secA9._id,
          subject: phySub._id,
          day: 'Monday',
          startTime: '11:00',
          endTime: '12:00',
          room: 'Physics Lab',
        },
        {
          teacher: seededTeachers[2]._id,
          class: grade8._id,
          section: secA8._id,
          subject: engSub._id,
          day: 'Monday',
          startTime: '08:00',
          endTime: '09:00',
          room: 'Room 4',
        },
      ];

      for (const t of timetableSlots) {
        const existingT = await Timetable.findOne({
          academicSession: session._id,
          class: t.class,
          section: t.section,
          day: t.day,
          startTime: t.startTime,
        });
        if (!existingT) {
          await Timetable.create({
            ...t,
            academicSession: session._id,
          });
        }
      }
    }

    // 7. Students & Enrollments (Phase 5)
    const studentsData = [
      {
        studentId: 'STD-2026-0001',
        admissionNumber: 'ADM-2026-0001',
        grNumber: 'GR-801',
        name: 'Syed Ali Raza',
        dateOfBirth: new Date('2012-05-14'),
        gender: 'male',
        father: { name: 'Syed Hussain Raza', cnic: '42101-1112233-1', phone: '0301-1122334', occupation: 'Civil Engineer' },
        contact: { phone: '0301-1122334', emergencyPhone: '0321-4455667', email: 'ali.raza@gmail.com' },
        address: { present: 'House 45, Sector 5-E, North Karachi', city: 'Karachi' },
        targetClass: grade8,
        targetSection: secA8,
        rollNumber: '01',
      },
      {
        studentId: 'STD-2026-0002',
        admissionNumber: 'ADM-2026-0002',
        grNumber: 'GR-802',
        name: 'Zainab Fatima',
        dateOfBirth: new Date('2012-08-22'),
        gender: 'female',
        father: { name: 'Muhammad Aslam', cnic: '42101-2223344-2', phone: '0302-2233445', occupation: 'Banker' },
        contact: { phone: '0302-2233445', emergencyPhone: '0333-7788990' },
        address: { present: 'Flat B-4, Al-Karam Square, Liaquatabad', city: 'Karachi' },
        targetClass: grade8,
        targetSection: secA8,
        rollNumber: '02',
      },
      {
        studentId: 'STD-2026-0003',
        admissionNumber: 'ADM-2026-0003',
        name: 'Bilal Khan', // Note: Optional GR number omitted per Section 7 & 45
        dateOfBirth: new Date('2012-02-10'),
        gender: 'male',
        father: { name: 'Javed Khan', cnic: '42101-3334455-3', phone: '0303-3344556', occupation: 'Businessman' },
        contact: { phone: '0303-3344556', emergencyPhone: '0312-9988776' },
        address: { present: 'B-102, Gulshan-e-Iqbal Block 13-D', city: 'Karachi' },
        targetClass: grade8,
        targetSection: secB8,
        rollNumber: '01',
      },
      {
        studentId: 'STD-2026-0004',
        admissionNumber: 'ADM-2026-0004',
        grNumber: 'GR-901',
        name: 'Hamza Tariq',
        dateOfBirth: new Date('2011-11-05'),
        gender: 'male',
        father: { name: 'Tariq Mehmood', cnic: '42101-4445566-4', phone: '0304-4455667', occupation: 'Software Architect' },
        contact: { phone: '0304-4455667', emergencyPhone: '0322-1122334' },
        address: { present: 'House 12, Street 4, Federal B Area Block 14', city: 'Karachi' },
        targetClass: grade9,
        targetSection: secA9,
        rollNumber: '01',
      },
      {
        studentId: 'STD-2026-0005',
        admissionNumber: 'ADM-2026-0005',
        grNumber: 'GR-1001',
        name: 'Mariam Siddiqui',
        dateOfBirth: new Date('2010-09-18'),
        gender: 'female',
        father: { name: 'Kamran Siddiqui', cnic: '42101-5556677-5', phone: '0305-5566778', occupation: 'Professor' },
        contact: { phone: '0305-5566778', emergencyPhone: '0345-3344556' },
        address: { present: 'Plot 88, KDA Scheme 1, Stadium Road', city: 'Karachi' },
        targetClass: grade10,
        targetSection: secA10,
        rollNumber: '01',
      },
    ];

    for (const s of studentsData) {
      let studentDoc = await Student.findOne({ studentId: s.studentId });
      if (!studentDoc) {
        studentDoc = await Student.create({
          studentId: s.studentId,
          admissionNumber: s.admissionNumber,
          grNumber: s.grNumber,
          name: s.name,
          dateOfBirth: s.dateOfBirth,
          gender: s.gender,
          father: s.father,
          contact: s.contact,
          address: s.address,
          status: 'active',
        });
        console.log(`[Seed] Registered student: ${s.name} (${s.studentId})`);
      }

      if (s.targetClass && s.targetSection) {
        const existingEnroll = await Enrollment.findOne({
          student: studentDoc._id,
          academicSession: session._id,
        });

        if (!existingEnroll) {
          await Enrollment.create({
            student: studentDoc._id,
            academicSession: session._id,
            class: s.targetClass._id,
            section: s.targetSection._id,
            rollNumber: s.rollNumber,
            status: 'active',
          });
        } else {
          existingEnroll.status = 'active';
          await existingEnroll.save();
        }
      }
    }

    // 8. Fee Heads (Phase 7)
    const feeHeadsData = [
      { name: 'Monthly Tuition Fee', code: 'TUI', type: 'tuition', frequency: 'monthly', isRefundable: false },
      { name: 'Admission & Registration Fee', code: 'ADM', type: 'admission', frequency: 'one_time', isRefundable: false },
      { name: 'Annual Development Charges', code: 'ANN', type: 'annual', frequency: 'annual', isRefundable: false },
      { name: 'Computer & Science Lab Fee', code: 'LAB', type: 'lab', frequency: 'monthly', isRefundable: false },
      { name: 'Term Examination Fee', code: 'EXM', type: 'exam', frequency: 'term', isRefundable: false },
      { name: 'Library Resource Fund', code: 'LIB', type: 'library', frequency: 'annual', isRefundable: false },
      { name: 'Sports & Extra-Curricular Fund', code: 'SPT', type: 'sports', frequency: 'annual', isRefundable: false },
      { name: 'Security Deposit (Refundable)', code: 'SEC', type: 'other', frequency: 'one_time', isRefundable: true },
    ];

    const seededFeeHeads = {};
    for (const h of feeHeadsData) {
      let headDoc = await FeeHead.findOne({ code: h.code });
      if (!headDoc) {
        headDoc = await FeeHead.create(h);
      }
      seededFeeHeads[h.code] = headDoc;
    }

    // 9. Class Fee Structures (Phase 7)
    const allClasses = await Class.find();
    for (const c of allClasses) {
      if (!seededFeeHeads['TUI']) continue;

      let tuitionAmt = 2500;
      let annualAmt = 1500;
      let examAmt = 1000;
      let labAmt = 0;

      if (['Play Group', 'Nursery', 'KG'].includes(c.name)) {
        tuitionAmt = 2000;
        annualAmt = 1500;
        examAmt = 800;
      } else if (['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'].includes(c.name)) {
        tuitionAmt = 2500;
        annualAmt = 1500;
        examAmt = 1000;
      } else if (['Grade 6', 'Grade 7'].includes(c.name)) {
        tuitionAmt = 3000;
        annualAmt = 1800;
        examAmt = 1000;
      } else if (c.name === 'Grade 8') {
        tuitionAmt = 3500;
        labAmt = 500;
        annualAmt = 2000;
        examAmt = 1000;
      } else if (c.name === 'Grade 9') {
        tuitionAmt = 4000;
        labAmt = 800;
        annualAmt = 2500;
        examAmt = 1200;
      } else if (c.name === 'Grade 10') {
        tuitionAmt = 4500;
        labAmt = 1000;
        annualAmt = 2500;
        examAmt = 1500;
      }

      const items = [
        { feeHead: seededFeeHeads['TUI']._id, amount: tuitionAmt },
        { feeHead: seededFeeHeads['ANN']._id, amount: annualAmt },
        { feeHead: seededFeeHeads['EXM']._id, amount: examAmt },
      ];
      if (labAmt > 0 && seededFeeHeads['LAB']) {
        items.push({ feeHead: seededFeeHeads['LAB']._id, amount: labAmt });
      }

      const totalMonthly = tuitionAmt + labAmt;
      const totalAnnual = annualAmt;

      await FeeStructure.findOneAndUpdate(
        { academicSession: session._id, class: c._id },
        {
          academicSession: session._id,
          class: c._id,
          feeItems: items,
          totalMonthlyAmount: totalMonthly,
          totalAnnualAmount: totalAnnual,
          totalOneTimeAmount: 0,
          dueDayOfMonth: 10,
          gracePeriodDays: 5,
          lateFineType: 'fixed',
          lateFineAmount: 200,
          status: 'active',
        },
        { upsert: true, new: true }
      );
    }

    // 10. Fee Concessions & Scholarships (Phase 7)
    const concessionsData = [
      {
        name: 'Sibling Discount (25%)',
        code: 'SIB-25',
        type: 'percentage',
        value: 25,
        applicableFeeHeads: [seededFeeHeads['TUI']._id],
        description: '25% concession on tuition fee for younger siblings enrolled in the school',
      },
      {
        name: 'Staff Child Concession (50%)',
        code: 'STAFF-50',
        type: 'percentage',
        value: 50,
        applicableFeeHeads: [seededFeeHeads['TUI']._id],
        description: '50% tuition waiver for biological children of permanent teaching staff',
      },
      {
        name: 'Need-Based Financial Aid',
        code: 'AID-1500',
        type: 'fixed_amount',
        value: 1500,
        applicableFeeHeads: [seededFeeHeads['TUI']._id],
        description: 'Fixed monthly financial assistance of PKR 1,500',
      },
      {
        name: 'Orphan Full Tuition Waiver (100%)',
        code: 'ORPHAN-100',
        type: 'percentage',
        value: 100,
        applicableFeeHeads: [seededFeeHeads['TUI']._id],
        description: '100% full fee waiver under the school welfare fund',
      },
    ];

    for (const c of concessionsData) {
      const existing = await FeeConcession.findOne({ code: c.code });
      if (!existing) {
        await FeeConcession.create(c);
      }
    }

    // Assign sample concession to first student
    const sampleStudent = await Student.findOne({ studentId: 'STD-2026-0001' });
    const siblingConcession = await FeeConcession.findOne({ code: 'SIB-25' });
    const superAdminUser = await User.findOne({ role: 'super_admin' });

    if (sampleStudent && siblingConcession && superAdminUser) {
      const existingAssignment = await StudentConcession.findOne({
        student: sampleStudent._id,
        concession: siblingConcession._id,
        academicSession: session._id,
      });

      if (!existingAssignment) {
        await StudentConcession.create({
          student: sampleStudent._id,
          concession: siblingConcession._id,
          academicSession: session._id,
          reason: 'Younger sibling studying in Grade 8',
          approvedBy: superAdminUser._id,
          status: 'active',
        });
      }
    }

    // 11. Initial Monthly Challans for April 2026 (Phase 8)
    const activeEnrollments = await Enrollment.find({
      academicSession: session._id,
      status: 'active',
    }).populate('student class section');

    let seededChallansCount = 0;
    for (const en of activeEnrollments) {
      const studentDoc = en.student;
      if (!studentDoc) continue;

      const existingCh = await Challan.findOne({
        student: studentDoc._id,
        billingMonth: 4,
        billingYear: 2026,
        academicSession: session._id,
      });

      if (!existingCh) {
        const struct = await FeeStructure.findOne({
          academicSession: session._id,
          class: en.class._id,
        }).populate('feeItems.feeHead');

        if (struct) {
          const monthlyItems = struct.feeItems
            .filter((item) => item.feeHead?.frequency === 'monthly')
            .map((item) => ({
              feeHead: item.feeHead._id,
              headName: item.feeHead.name,
              amount: item.amount,
            }));

          const subTotal = monthlyItems.reduce((acc, curr) => acc + curr.amount, 0);

          // Check if student has concession
          let concessionAmount = 0;
          if (studentDoc.studentId === 'STD-2026-0001') {
            // Sibling discount 25% of tuition (3500) = 875
            concessionAmount = 875;
          }

          const lateFine = struct.lateFineAmount || 200;
          const totalPayable = Math.max(0, subTotal - concessionAmount);

          await Challan.create({
            student: studentDoc._id,
            academicSession: session._id,
            class: en.class._id,
            section: en.section?._id,
            rollNumber: en.rollNumber,
            billingMonth: 4,
            billingYear: 2026,
            monthName: 'April 2026',
            issueDate: new Date('2026-04-01'),
            dueDate: new Date('2026-04-10'),
            validityDate: new Date('2026-04-30'),
            feeItems: monthlyItems,
            subTotal,
            concessionAmount,
            arrears: 0,
            lateFineAmount: lateFine,
            totalPayable,
            totalPayableAfterDue: totalPayable + lateFine,
            paidAmount: 0,
            balanceAmount: totalPayable,
            status: 'unpaid',
            generatedBy: superAdminUser._id,
          });
          seededChallansCount++;
        }
      }
    }

    // 12. Initial Payments & Receipts (Phase 9)
    const accountantUser = (await User.findOne({ role: 'accountant' })) || superAdminUser;
    let seededPaymentsCount = 0;
    const aprilChallans = await Challan.find({ billingMonth: 4, billingYear: 2026 }).populate('student');

    if (aprilChallans.length > 0) {
      // Payment 1: Full payment for Student 1 (Syed Ali Raza) via bank transfer
      const ch1 = aprilChallans[0];
      const existingPay1 = await Payment.findOne({ challan: ch1._id });
      if (!existingPay1) {
        const fullAmount = ch1.totalPayable;
        await Payment.create({
          challan: ch1._id,
          student: ch1.student._id,
          academicSession: ch1.academicSession,
          class: ch1.class,
          amount: fullAmount,
          paymentMethod: 'bank_transfer',
          bankName: 'Habib Bank Ltd (HBL)',
          transactionId: 'HBL-FT-991823',
          paymentDate: new Date('2026-04-05'),
          receivedBy: accountantUser._id,
          notes: 'Full payment cleared via online bank transfer',
          status: 'completed',
        });
        ch1.paidAmount = fullAmount;
        ch1.balanceAmount = 0;
        ch1.status = 'paid';
        await ch1.save();
        seededPaymentsCount++;
      }

      // Payment 2: Partial payment for Student 2 (Fatima Noor) via cash
      if (aprilChallans.length > 1) {
        const ch2 = aprilChallans[1];
        const existingPay2 = await Payment.findOne({ challan: ch2._id });
        if (!existingPay2) {
          const partialAmount = 2000;
          await Payment.create({
            challan: ch2._id,
            student: ch2.student._id,
            academicSession: ch2.academicSession,
            class: ch2.class,
            amount: partialAmount,
            paymentMethod: 'cash',
            transactionId: '',
            paymentDate: new Date('2026-04-06'),
            receivedBy: accountantUser._id,
            notes: 'First installment paid in cash at counter',
            status: 'completed',
          });
          ch2.paidAmount = partialAmount;
          ch2.balanceAmount = ch2.totalPayable - partialAmount;
          ch2.status = 'partially_paid';
          await ch2.save();
          seededPaymentsCount++;
        }
      }
    }

    console.log('\n[Seed] ============================================');
    console.log('[Seed] Phase 5 Student Management Seeded:');
    console.log(`[Seed] Enrolled Students: ${studentsData.length}`);
    console.log('[Seed] Phase 7 Fee Structure & Heads Seeded:');
    console.log(`[Seed] Fee Heads: ${feeHeadsData.length}`);
    console.log(`[Seed] Fee Structures configured for Grade 8, 9, 10`);
    console.log(`[Seed] Concession Templates: ${concessionsData.length}`);
    console.log('[Seed] Phase 8 Fee Generation Seeded:');
    console.log(`[Seed] April 2026 Monthly Challans: ${seededChallansCount}`);
    console.log('[Seed] Phase 9 Payments & Receipts Seeded:');
    console.log(`[Seed] Completed Payments / Receipts: ${seededPaymentsCount}`);
    console.log('[Seed] ============================================\n');

    await mongoose.disconnect();
    console.log('[Seed] Database disconnected cleanly.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedData();
