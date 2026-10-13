import Subject from '../models/Subject.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

export const getSubjects = async (req, res, next) => {
  try {
    const { type, status } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;

    const subjects = await Subject.find(filter).sort({ name: 1 });

    return sendSuccess(res, 'Subjects retrieved successfully', { subjects, count: subjects.length });
  } catch (error) {
    next(error);
  }
};

export const createSubject = async (req, res, next) => {
  try {
    const { name, code, type, description, status } = req.body;

    if (!name || !code) {
      return sendError(res, 'Subject name and subject code are required', 400);
    }

    const existing = await Subject.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
      return sendError(res, `Subject with code '${code.trim().toUpperCase()}' already exists`, 409);
    }

    const subject = await Subject.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type: type || 'theory',
      description,
      status: status || 'active',
    });

    return sendSuccess(res, 'Subject created successfully', { subject }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findById(id);

    if (!subject) {
      return sendError(res, 'Subject not found', 404);
    }

    const { name, code, type, description, status } = req.body;

    if (code && code.trim().toUpperCase() !== subject.code) {
      const duplicate = await Subject.findOne({
        _id: { $ne: id },
        code: code.trim().toUpperCase(),
      });
      if (duplicate) {
        return sendError(res, `Subject code '${code.trim().toUpperCase()}' is already in use`, 409);
      }
      subject.code = code.trim().toUpperCase();
    }

    if (name) subject.name = name.trim();
    if (type) subject.type = type;
    if (description !== undefined) subject.description = description;
    if (status) subject.status = status;

    await subject.save();

    return sendSuccess(res, 'Subject updated successfully', { subject });
  } catch (error) {
    next(error);
  }
};

export const deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findById(id);

    if (!subject) {
      return sendError(res, 'Subject not found', 404);
    }

    await subject.deleteOne();

    return sendSuccess(res, `Subject '${subject.name}' deleted successfully`);
  } catch (error) {
    next(error);
  }
};
