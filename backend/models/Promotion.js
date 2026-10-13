import mongoose from 'mongoose';

const promotionRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  previousEnrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true,
  },
  newEnrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    default: null, // Null if passed_out or not enrolled
  },
  action: {
    type: String,
    enum: ['promoted', 'retained', 'passed_out', 'left'],
    required: true,
  },
  targetClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
  },
  targetSection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
  },
  newRollNumber: {
    type: String,
    trim: true,
  },
});

const promotionSchema = new mongoose.Schema(
  {
    fromSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: [true, 'Source academic session is required'],
    },
    toSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: [true, 'Target academic session is required'],
    },
    fromClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Source class is required'],
    },
    toClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Target class is required'],
    },
    promotedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    records: [promotionRecordSchema],
    totalEvaluated: {
      type: Number,
      default: 0,
    },
    totalPromoted: {
      type: Number,
      default: 0,
    },
    totalRetained: {
      type: Number,
      default: 0,
    },
    totalPassedOut: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Promotion = mongoose.model('Promotion', promotionSchema);

export default Promotion;
