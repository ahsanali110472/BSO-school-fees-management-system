import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    challan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challan',
      required: [true, 'Challan reference is required'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    academicSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: [true, 'Academic session reference is required'],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class reference is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [1, 'Payment amount must be greater than zero'],
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'easypaisa', 'jazzcash', 'cheque', 'other'],
      required: [true, 'Payment method is required'],
      default: 'cash',
    },
    transactionId: {
      type: String,
      trim: true,
      default: '',
    },
    bankName: {
      type: String,
      trim: true,
      default: '',
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Received by cashier/user reference is required'],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['completed', 'reversed'],
      default: 'completed',
    },
    reversal: {
      isReversed: {
        type: Boolean,
        default: false,
      },
      reversedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      reversalReason: {
        type: String,
        trim: true,
      },
      reversedAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: auto-generate sequential collision-proof Receipt Number REC-YYYY-XXXX
paymentSchema.pre('save', async function (next) {
  if (!this.receiptNumber) {
    const year = new Date().getFullYear();
    const prefix = `REC-${year}-`;
    const lastPayment = await this.constructor
      .findOne({ receiptNumber: new RegExp(`^${prefix}`) })
      .sort({ receiptNumber: -1 });

    let seq = 1;
    if (lastPayment && lastPayment.receiptNumber) {
      const parts = lastPayment.receiptNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }
    this.receiptNumber = `${prefix}${String(seq).padStart(6, '0')}`;
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
