import { Router } from 'express';
import { getMe, login, logout } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';

const router = Router();

router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

export default router;
