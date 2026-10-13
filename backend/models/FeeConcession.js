import mongoose from 'mongoose';

const feeConcessionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Concession name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Concession code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed_amount'],
      required: true,
      default: 'percentage',
    },
    value: {
      type: Number,
      required: [true, 'Concession value is required'],
      min: [0, 'Value cannot be negative'],
    },
    applicableFeeHeads: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeeHead',
      },
    ],
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

const FeeConcession = mongoose.model('FeeConcession', feeConcessionSchema);

export default FeeConcession;
