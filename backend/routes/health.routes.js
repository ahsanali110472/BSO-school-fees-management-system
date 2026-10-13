import { Router } from 'express';
import { isDbConnected } from '../config/db.js';
import { sendSuccess } from '../utils/apiResponse.js';

const router = Router();

router.get('/health', (_req, res) => {
  const healthData = {
    status: 'online',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: isDbConnected() ? 'connected' : 'offline',
    },
    service: 'BSO School Management API',
    version: '1.0.0',
  };

  return sendSuccess(res, 'School Management System API is healthy', healthData);
});

export default router;
