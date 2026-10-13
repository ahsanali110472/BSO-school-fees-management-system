import mongoose from 'mongoose';

const feeHeadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Fee head name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Fee head code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['tuition', 'admission', 'exam', 'lab', 'library', 'sports', 'annual', 'transport', 'other'],
      default: 'other',
    },
    frequency: {
      type: String,
      enum: ['monthly', 'one_time', 'term', 'annual'],
      default: 'monthly',
      required: true,
    },
    isRefundable: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
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

const FeeHead = mongoose.model('FeeHead', feeHeadSchema);

export default FeeHead;
