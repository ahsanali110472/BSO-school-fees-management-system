import Class from '../models/Class.js';
import Section from '../models/Section.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

export const getClasses = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const classes = await Class.find(filter)
      .sort({ order: 1, name: 1 })
      .populate('sections');

    return sendSuccess(res, 'Classes retrieved successfully', { classes, count: classes.length });
  } catch (error) {
    next(error);
  }
};

export const getClassById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const classItem = await Class.findById(id).populate('sections');

    if (!classItem) {
      return sendError(res, 'Class not found', 404);
    }

    return sendSuccess(res, 'Class details retrieved', { class: classItem });
  } catch (error) {
    next(error);
  }
};

export const createClass = async (req, res, next) => {
  try {
    const { name, code, order, status, description } = req.body;

    if (!name) {
      return sendError(res, 'Class name is required', 400);
    }

    const existing = await Class.findOne({ name: name.trim() });
    if (existing) {
      return sendError(res, `Class '${name}' already exists`, 409);
    }

    // Determine default order if not provided
    let orderIndex = order;
    if (orderIndex === undefined || orderIndex === null) {
      const highestOrder = await Class.findOne().sort({ order: -1 });
      orderIndex = highestOrder ? highestOrder.order + 1 : 1;
    }

    const newClass = await Class.create({
      name: name.trim(),
      code: code ? code.trim().toUpperCase() : undefined,
      order: orderIndex,
      status: status || 'active',
      description,
    });

    return sendSuccess(res, 'Class created successfully', { class: newClass }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const classItem = await Class.findById(id);

    if (!classItem) {
      return sendError(res, 'Class not found', 404);
    }

    const { name, code, order, status, description } = req.body;

    if (name) classItem.name = name.trim();
    if (code !== undefined) classItem.code = code ? code.trim().toUpperCase() : '';
    if (order !== undefined) classItem.order = Number(order);
    if (status) classItem.status = status;
    if (description !== undefined) classItem.description = description;

    await classItem.save();

    return sendSuccess(res, 'Class updated successfully', { class: classItem });
  } catch (error) {
    next(error);
  }
};

export const deleteClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const classItem = await Class.findById(id);

    if (!classItem) {
      return sendError(res, 'Class not found', 404);
    }

    // Verify no sections are linked before allowing deletion
    const sectionsCount = await Section.countDocuments({ class: id });
    if (sectionsCount > 0) {
      return sendError(
        res,
        `Cannot delete class '${classItem.name}' because it contains ${sectionsCount} active section(s). Remove or reassign sections first.`,
        400
      );
    }

    await classItem.deleteOne();

    return sendSuccess(res, `Class '${classItem.name}' deleted successfully`);
  } catch (error) {
    next(error);
  }
};
