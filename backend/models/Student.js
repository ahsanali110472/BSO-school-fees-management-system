import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    admissionNumber: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    grNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Optional, but unique when provided (Section 7 & 45)
    },
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: [true, 'Gender is required'],
    },
    photo: {
      type: String,
      default: null,
    },
    father: {
      name: { type: String, trim: true },
      cnic: { type: String, trim: true },
      occupation: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    guardian: {
      name: { type: String, trim: true },
      relation: { type: String, trim: true },
      cnic: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    contact: {
      phone: {
        type: String,
        required: [true, 'Primary contact phone is required'],
        trim: true,
      },
      emergencyPhone: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
    },
    address: {
      present: { type: String, trim: true },
      permanent: { type: String, trim: true },
      city: { type: String, trim: true, default: 'Karachi' },
    },
    previousSchool: {
      schoolName: { type: String, trim: true },
      previousClass: { type: String, trim: true },
      leavingReason: { type: String, trim: true },
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    documents: [
      {
        title: { type: String, trim: true },
        documentType: { type: String, trim: true },
        fileUrl: { type: String, trim: true },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'inactive', 'passed_out', 'struck_off', 'transferred'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate studentId and admissionNumber if not provided
studentSchema.pre('save', async function (next) {
  const year = new Date().getFullYear();

  if (!this.studentId) {
    const count = await this.constructor.countDocuments();
    const seq = String(count + 1).padStart(4, '0');
    this.studentId = `STD-${year}-${seq}`;
  }

  if (!this.admissionNumber) {
    const count = await this.constructor.countDocuments();
    const seq = String(count + 1).padStart(4, '0');
    this.admissionNumber = `ADM-${year}-${seq}`;
  }

  next();
});

// Virtual populate for historical enrollments
studentSchema.virtual('enrollments', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'student',
});

const Student = mongoose.model('Student', studentSchema);

export default Student;
