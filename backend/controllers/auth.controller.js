import User from '../models/User.js';
import AuditService from '../services/audit.service.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';
import { generateToken } from '../utils/jwt.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Please provide both email and password', 400);
    }

    // Explicitly select password field since it is marked select: false in schema
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      AuditService.log({
        req,
        action: 'LOGIN_FAILED',
        module: 'AUTH',
        description: `Failed login attempt with non-existent email '${email}'`,
        status: 'FAILURE',
      });
      return sendError(res, 'Invalid email or password credentials', 401);
    }

    if (user.status !== 'active') {
      AuditService.log({
        req,
        user,
        action: 'LOGIN_BLOCKED',
        module: 'AUTH',
        description: `Deactivated user '${user.email}' attempted to sign in`,
        status: 'WARNING',
      });
      return sendError(res, 'Your account is deactivated. Please contact an administrator.', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      AuditService.log({
        req,
        user,
        action: 'LOGIN_FAILED',
        module: 'AUTH',
        description: `Invalid password attempt for account '${user.email}'`,
        status: 'FAILURE',
      });
      return sendError(res, 'Invalid email or password credentials', 401);
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    AuditService.log({
      req,
      user,
      action: 'LOGIN_SUCCESS',
      module: 'AUTH',
      description: `User '${user.name}' (${user.role}) logged in successfully`,
      status: 'SUCCESS',
    });

    const token = generateToken(user);

    return sendSuccess(res, 'Logged in successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLogin: user.lastLogin,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, 'Current user profile retrieved', {
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (_req, res) => {
  return sendSuccess(res, 'Logged out successfully');
};
