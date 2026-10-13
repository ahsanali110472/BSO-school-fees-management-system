import mongoose from 'mongoose';

const feeItemSchema = new mongoose.Schema({
  feeHead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeHead',
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
});

const feeStructureSchema = new mongoose.Schema(
  {
    academicSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: [true, 'Academic session is required'],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
    },
    feeItems: [feeItemSchema],
    totalMonthlyAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAnnualAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalOneTimeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueDayOfMonth: {
      type: Number,
      default: 10,
      min: 1,
      max: 28,
    },
    gracePeriodDays: {
      type: Number,
      default: 5,
      min: 0,
    },
    lateFineType: {
      type: String,
      enum: ['fixed', 'daily'],
      default: 'fixed',
    },
    lateFineAmount: {
      type: Number,
      default: 200,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: Unique fee structure per Class + Session (Section 45)
feeStructureSchema.index({ academicSession: 1, class: 1 }, { unique: true });

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);

export default FeeStructure;
