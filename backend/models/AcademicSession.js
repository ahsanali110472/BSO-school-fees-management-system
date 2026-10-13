import mongoose from 'mongoose';

const academicSessionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide session name (e.g. 2026-27)'],
      unique: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide start date'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide end date'],
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'upcoming'],
      default: 'active',
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: If this session is marked current, ensure others are demoted
academicSessionSchema.pre('save', async function (next) {
  if (this.isCurrent) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isCurrent: false } }
    );
  }
  next();
});

const AcademicSession = mongoose.model('AcademicSession', academicSessionSchema);

export default AcademicSession;
