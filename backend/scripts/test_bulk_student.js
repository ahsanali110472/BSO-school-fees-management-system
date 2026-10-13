import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from '../models/Student.js';
import Enrollment from '../models/Enrollment.js';
import Class from '../models/Class.js';
import Section from '../models/Section.js';
import AcademicSession from '../models/AcademicSession.js';
import { bulkImportStudents } from '../controllers/student.controller.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/school_management';

async function testBulkImport() {
  console.log('Testing Bulk Student CSV Import logic...');
  try {
    await mongoose.connect(MONGO_URI);

    const testClass = await Class.findOne({ status: 'active' });
    if (!testClass) throw new Error('No active class found');

    const sampleCsv = `Name,DateOfBirth,Gender,FatherName,FatherCNIC,FatherOccupation,FatherPhone,ContactPhone,EmergencyPhone,Email,PresentAddress,PermanentAddress,City,Class,Section,RollNumber,GRNumber,PreviousSchool,AdmissionDate
"Test Bulk Student 1","2016-01-15","male","Test Father 1","42101-1111111-1","Business","03001111111","03001111111","03001111112","test1@school.com","Address 1","Address 1","Karachi","${testClass.name}","A","91","","ABC School","2026-04-01"
"Test Bulk Student 2","2016-02-20","female","Test Father 2","42101-2222222-2","Doctor","03002222222","03002222222","03002222223","test2@school.com","Address 2","Address 2","Karachi","${testClass.name}","A","92","","XYZ School","2026-04-01"`;

    let resResult = null;
    let resStatus = null;

    const req = {
      body: { csvData: sampleCsv },
      user: { _id: new mongoose.Types.ObjectId(), name: 'Test Admin', role: 'super_admin' },
      ip: '127.0.0.1',
      headers: {},
    };

    const res = {
      status: (code) => {
        resStatus = code;
        return res;
      },
      json: (data) => {
        resResult = data;
        return res;
      },
    };

    await bulkImportStudents(req, res, (err) => {
      if (err) throw err;
    });

    console.log('Result:', JSON.stringify(resResult, null, 2));

    if (!resResult?.success || resResult?.data?.importedCount !== 2) {
      throw new Error('Expected 2 students to be imported');
    }

    console.log('Bulk student import test PASSED!');
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

testBulkImport();
