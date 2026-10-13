import User from '../models/User.js';
import { sendError } from '../utils/apiResponse.js';
import { verifyToken } from '../utils/jwt.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendError(res, 'Not authorized to access this route. No token provided.', 401);
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      return sendError(res, 'The user belonging to this token no longer exists.', 401);
    }

    if (user.status !== 'active') {
      return sendError(res, 'This user account has been deactivated. Please contact an administrator.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Token has expired. Please log in again.', 401);
    }
    return sendError(res, 'Not authorized. Invalid token.', 401);
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(
        res,
        `User role '${req.user?.role || 'unknown'}' is not authorized to access this route`,
        403
      );
    }
    next();
  };
};
