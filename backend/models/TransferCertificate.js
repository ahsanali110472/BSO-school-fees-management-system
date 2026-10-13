import mongoose from 'mongoose';

const transferCertificateSchema = new mongoose.Schema(
  {
    certificateNumber: {
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
    lastSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
    },
    lastClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    lastSection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    reasonForLeaving: {
      type: String,
      required: [true, 'Reason for leaving is required'],
      trim: true,
    },
    conduct: {
      type: String,
      default: 'Good',
      enum: ['Excellent', 'Very Good', 'Good', 'Satisfactory', 'Poor'],
    },
    remarks: {
      type: String,
      trim: true,
    },
    duesCleared: {
      type: Boolean,
      default: true,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['issued', 'cancelled'],
      default: 'issued',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate certificate number: TC-YYYY-XXXX
transferCertificateSchema.pre('save', async function (next) {
  if (!this.certificateNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    const seq = String(count + 1).padStart(4, '0');
    this.certificateNumber = `TC-${year}-${seq}`;
  }
  next();
});

const TransferCertificate = mongoose.model('TransferCertificate', transferCertificateSchema);

export default TransferCertificate;
