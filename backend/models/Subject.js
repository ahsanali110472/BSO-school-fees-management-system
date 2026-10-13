import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide subject name (e.g. Mathematics)'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Please provide subject code (e.g. MATH-101)'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['theory', 'practical', 'both'],
      default: 'theory',
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

const Subject = mongoose.model('Subject', subjectSchema);

export default Subject;
