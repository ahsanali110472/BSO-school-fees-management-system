import mongoose from 'mongoose';

const challanFeeItemSchema = new mongoose.Schema({
  feeHead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeHead',
  },
  headName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
});

const challanSchema = new mongoose.Schema(
  {
    challanNumber: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
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
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
    },
    rollNumber: {
      type: String,
      trim: true,
    },
    billingMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    billingYear: {
      type: Number,
      required: true,
    },
    monthName: {
      type: String,
      required: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Challan due date is required'],
    },
    validityDate: {
      type: Date,
    },
    feeItems: [challanFeeItemSchema],
    subTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    concessionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    arrears: {
      type: Number,
      default: 0,
      min: 0,
    },
    lateFineAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPayable: {
      type: Number,
      required: true,
      default: 0,
    },
    totalPayableAfterDue: {
      type: Number,
      required: true,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['unpaid', 'partially_paid', 'paid', 'overdue', 'void'],
      default: 'unpaid',
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    voidReason: {
      type: String,
      trim: true,
    },
    bankAccounts: [
      {
        bankName: { type: String, default: 'Meezan Bank Ltd' },
        accountTitle: { type: String, default: 'BSO Model High School' },
        accountNumber: { type: String, default: '0101-0102030405' },
        branchCode: { type: String, default: '0101 - North Karachi Branch' },
      },
      {
        bankName: { type: String, default: 'Habib Bank Ltd (HBL)' },
        accountTitle: { type: String, default: 'BSO Model High School' },
        accountNumber: { type: String, default: '2201-9988776655' },
        branchCode: { type: String, default: '2201 - Main University Road' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound unique index: Only 1 challan per student per billing month per session (Section 45)
challanSchema.index(
  { student: 1, billingMonth: 1, billingYear: 1, academicSession: 1 },
  { unique: true }
);

// Pre-save hook: auto-generate Challan Number CH-YYYY-MM-XXXX
challanSchema.pre('save', async function (next) {
  if (!this.challanNumber) {
    const year = this.billingYear || new Date().getFullYear();
    const month = String(this.billingMonth || new Date().getMonth() + 1).padStart(2, '0');
    const prefix = `CH-${year}-${month}-`;
    const lastChallan = await this.constructor
      .findOne({ challanNumber: new RegExp(`^${prefix}`) })
      .sort({ challanNumber: -1 });

    let seq = 1;
    if (lastChallan && lastChallan.challanNumber) {
      const parts = lastChallan.challanNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }
    this.challanNumber = `${prefix}${String(seq).padStart(4, '0')}`;
  }
  next();
});

const Challan = mongoose.model('Challan', challanSchema);

export default Challan;
