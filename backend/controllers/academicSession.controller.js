import AcademicSession from '../models/AcademicSession.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

export const getSessions = async (req, res, next) => {
  try {
    const sessions = await AcademicSession.find().sort({ startDate: -1 });
    return sendSuccess(res, 'Academic sessions retrieved', { sessions, count: sessions.length });
  } catch (error) {
    next(error);
  }
};

export const getCurrentSession = async (req, res, next) => {
  try {
    let session = await AcademicSession.findOne({ isCurrent: true });
    if (!session) {
      session = await AcademicSession.findOne({ status: 'active' }).sort({ startDate: -1 });
    }
    return sendSuccess(res, 'Current academic session retrieved', { session });
  } catch (error) {
    next(error);
  }
};

export const createSession = async (req, res, next) => {
  try {
    const { name, startDate, endDate, isCurrent, status, description } = req.body;

    if (!name || !startDate || !endDate) {
      return sendError(res, 'Name, start date, and end date are required', 400);
    }

    const existing = await AcademicSession.findOne({ name: name.trim() });
    if (existing) {
      return sendError(res, `Academic session '${name}' already exists`, 409);
    }

    const session = new AcademicSession({
      name: name.trim(),
      startDate,
      endDate,
      isCurrent: !!isCurrent,
      status: status || 'active',
      description,
    });

    await session.save();

    return sendSuccess(res, 'Academic session created successfully', { session }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await AcademicSession.findById(id);

    if (!session) {
      return sendError(res, 'Academic session not found', 404);
    }

    const { name, startDate, endDate, isCurrent, status, description } = req.body;

    if (name) session.name = name.trim();
    if (startDate) session.startDate = startDate;
    if (endDate) session.endDate = endDate;
    if (typeof isCurrent === 'boolean') session.isCurrent = isCurrent;
    if (status) session.status = status;
    if (description !== undefined) session.description = description;

    await session.save();

    return sendSuccess(res, 'Academic session updated successfully', { session });
  } catch (error) {
    next(error);
  }
};

export const setCurrentSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await AcademicSession.findById(id);

    if (!session) {
      return sendError(res, 'Academic session not found', 404);
    }

    session.isCurrent = true;
    session.status = 'active';
    await session.save();

    return sendSuccess(res, `Session '${session.name}' is now marked as the current academic session`, { session });
  } catch (error) {
    next(error);
  }
};
