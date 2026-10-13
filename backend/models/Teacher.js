import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema(
  {
    teacherId: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Teacher name is required'],
      trim: true,
    },
    fatherName: {
      type: String,
      trim: true,
    },
    cnic: {
      type: String,
      trim: true,
      sparse: true, // Unique only when provided
    },
    phone: {
      type: String,
      required: [true, 'Contact phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    qualification: {
      type: String,
      trim: true,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    photo: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'on_leave', 'resigned'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate sequential teacher ID before saving if not provided
teacherSchema.pre('save', async function (next) {
  if (!this.teacherId) {
    const count = await this.constructor.countDocuments();
    const nextSeq = String(count + 1).padStart(4, '0');
    this.teacherId = `TCH-${nextSeq}`;
  }
  next();
});

// Virtual populate for teaching assignments
teacherSchema.virtual('assignments', {
  ref: 'TeacherAssignment',
  localField: '_id',
  foreignField: 'teacher',
});

const Teacher = mongoose.model('Teacher', teacherSchema);

export default Teacher;
