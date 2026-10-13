import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import sessionRoutes from './routes/academicSession.routes.js';
import classRoutes from './routes/class.routes.js';
import sectionRoutes from './routes/section.routes.js';
import subjectRoutes from './routes/subject.routes.js';
import teacherRoutes from './routes/teacher.routes.js';
import teacherAssignmentRoutes from './routes/teacherAssignment.routes.js';
import timetableRoutes from './routes/timetable.routes.js';
import studentRoutes from './routes/student.routes.js';
import enrollmentRoutes from './routes/enrollment.routes.js';
import promotionRoutes from './routes/promotion.routes.js';
import transferRoutes from './routes/transfer.routes.js';
import feeHeadRoutes from './routes/feeHead.routes.js';
import feeStructureRoutes from './routes/feeStructure.routes.js';
import feeConcessionRoutes from './routes/feeConcession.routes.js';
import challanRoutes from './routes/challan.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import reportRoutes from './routes/report.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import auditLogRoutes from './routes/auditLog.routes.js';
import { apiLimiter, sanitizeQueryInputs } from './middleware/security.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Connect to Database
connectDB();

// Security & Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

const allowedOrigins = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'null',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Electron file://)
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('file://')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeQueryInputs);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global API Rate Limiting (Phase 12)
app.use('/api', apiLimiter);

// Base Route
app.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to School Management & Fee Management System API',
    docs: '/api/health',
  });
});

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/teacher-assignments', teacherAssignmentRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/fee-heads', feeHeadRoutes);
app.use('/api/fee-structures', feeStructureRoutes);
app.use('/api/fee-concessions', feeConcessionRoutes);
app.use('/api/challans', challanRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Start HTTP Server
const server = app.listen(PORT, () => {
  console.log(`[Backend Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[Backend Server] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Backend Server] Process terminated.');
  });
});

export default app;
