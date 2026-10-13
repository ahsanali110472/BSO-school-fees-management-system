import Section from '../models/Section.js';
import Class from '../models/Class.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

export const getSections = async (req, res, next) => {
  try {
    const { classId, status } = req.query;
    const filter = {};

    if (classId) filter.class = classId;
    if (status) filter.status = status;

    const sections = await Section.find(filter)
      .populate('class', 'name code order')
      .sort({ name: 1 });

    return sendSuccess(res, 'Sections retrieved successfully', { sections, count: sections.length });
  } catch (error) {
    next(error);
  }
};

export const createSection = async (req, res, next) => {
  try {
    const { name, class: classId, capacity, status } = req.body;

    if (!name || !classId) {
      return sendError(res, 'Section name and class ID are required', 400);
    }

    // Verify parent class exists
    const targetClass = await Class.findById(classId);
    if (!targetClass) {
      return sendError(res, 'Specified class does not exist', 404);
    }

    // Check duplicate section within same class
    const existingSection = await Section.findOne({
      class: classId,
      name: name.trim().toUpperCase(),
    });

    if (existingSection) {
      return sendError(
        res,
        `Section '${name.trim().toUpperCase()}' already exists under class '${targetClass.name}'`,
        409
      );
    }

    const newSection = await Section.create({
      name: name.trim().toUpperCase(),
      class: classId,
      capacity: capacity ? Number(capacity) : 40,
      status: status || 'active',
    });

    await newSection.populate('class', 'name code');

    return sendSuccess(res, 'Section created successfully', { section: newSection }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const section = await Section.findById(id);

    if (!section) {
      return sendError(res, 'Section not found', 404);
    }

    const { name, class: classId, capacity, status } = req.body;

    const newClassId = classId || section.class;
    const newName = name ? name.trim().toUpperCase() : section.name;

    // If changing name or class, verify uniqueness
    if ((name && newName !== section.name) || (classId && String(classId) !== String(section.class))) {
      const duplicate = await Section.findOne({
        _id: { $ne: id },
        class: newClassId,
        name: newName,
      });

      if (duplicate) {
        return sendError(res, `Section '${newName}' already exists under that class`, 409);
      }
    }

    if (name) section.name = newName;
    if (classId) section.class = newClassId;
    if (capacity !== undefined) section.capacity = Number(capacity);
    if (status) section.status = status;

    await section.save();
    await section.populate('class', 'name code');

    return sendSuccess(res, 'Section updated successfully', { section });
  } catch (error) {
    next(error);
  }
};

export const deleteSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const section = await Section.findById(id);

    if (!section) {
      return sendError(res, 'Section not found', 404);
    }

    await section.deleteOne();

    return sendSuccess(res, `Section '${section.name}' deleted successfully`);
  } catch (error) {
    next(error);
  }
};
