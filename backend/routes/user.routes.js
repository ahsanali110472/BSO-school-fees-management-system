import { Router } from 'express';
import { createUser, getUsers, toggleUserStatus, updateUser } from '../controllers/user.controller.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

// Protect all user routes for Super Admin only
router.use(protect);
router.use(authorize('super_admin'));

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .put(updateUser);

router.route('/:id/status')
  .patch(toggleUserStatus);

export default router;
