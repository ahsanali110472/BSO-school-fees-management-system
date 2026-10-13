import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema(
  {
    academicSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: [true, 'Academic session reference is required'],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Teacher reference is required'],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class reference is required'],
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: [true, 'Section reference is required'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
    },
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: [true, 'Day of week is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (e.g. 09:00)'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (e.g. 10:00)'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format'],
    },
    room: {
      type: String,
      trim: true,
      default: 'General Classroom',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup by class+section, teacher, or day
timetableSchema.index({ academicSession: 1, class: 1, section: 1, day: 1 });
timetableSchema.index({ academicSession: 1, teacher: 1, day: 1 });

const Timetable = mongoose.model('Timetable', timetableSchema);

export default Timetable;
