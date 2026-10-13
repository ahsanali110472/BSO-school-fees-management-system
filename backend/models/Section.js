import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide section name (e.g. A, B, Green)'],
      trim: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Section must belong to a class'],
    },
    capacity: {
      type: Number,
      default: 40,
      min: [1, 'Capacity must be at least 1'],
    },
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
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

// Compound index: Section name must be unique within a given class
sectionSchema.index({ class: 1, name: 1 }, { unique: true });

const Section = mongoose.model('Section', sectionSchema);

export default Section;
