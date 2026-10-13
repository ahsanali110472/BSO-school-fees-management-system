import User from '../models/User.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

export const getUsers = async (req, res, next) => {
  try {
    const { role, status, search } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });

    return sendSuccess(res, 'Users retrieved successfully', {
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 'Name, email, and password are required', 400);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return sendError(res, 'A user with this email already exists', 409);
    }

    const newUser = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: role || 'school_admin',
      status: 'active',
    });

    return sendSuccess(res, 'User created successfully', { user: newUser }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (name) user.name = name;
    if (role) user.role = role;

    await user.save();

    return sendSuccess(res, 'User updated successfully', { user });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent a user from deactivating their own account
    if (req.user._id.toString() === id) {
      return sendError(res, 'You cannot deactivate your own account', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    user.status = user.status === 'active' ? 'inactive' : 'active';
    await user.save();

    return sendSuccess(res, `User ${user.status === 'active' ? 'activated' : 'deactivated'} successfully`, { user });
  } catch (error) {
    next(error);
  }
};
