import mongoose from 'mongoose';

const studentConcessionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    concession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeConcession',
      required: [true, 'Concession template is required'],
    },
    academicSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: [true, 'Academic session is required'],
    },
    customValue: {
      type: Number,
      default: null, // If set, overrides template value
    },
    reason: {
      type: String,
      trim: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: Prevent duplicate active concession assignment for the same student, concession, and session
studentConcessionSchema.index({ student: 1, concession: 1, academicSession: 1 }, { unique: true });

const StudentConcession = mongoose.model('StudentConcession', studentConcessionSchema);

export default StudentConcession;
