import FeeHead from '../models/FeeHead.js';
import FeeStructure from '../models/FeeStructure.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

export const getFeeHeads = async (req, res, next) => {
  try {
    const { frequency, status, type } = req.query;
    const filter = {};

    if (frequency) filter.frequency = frequency;
    if (status) filter.status = status;
    if (type) filter.type = type;

    const feeHeads = await FeeHead.find(filter).sort({ name: 1 });

    return sendSuccess(res, 'Fee heads retrieved', { feeHeads, count: feeHeads.length });
  } catch (error) {
    next(error);
  }
};

export const createFeeHead = async (req, res, next) => {
  try {
    const { name, code, type, frequency, isRefundable, description } = req.body;

    if (!name || !code || !frequency) {
      return sendError(res, 'Name, Code, and Frequency are required', 400);
    }

    const existingCode = await FeeHead.findOne({ code: code.trim().toUpperCase() });
    if (existingCode) {
      return sendError(res, `Fee head code '${code.trim().toUpperCase()}' is already in use`, 409);
    }

    const feeHead = await FeeHead.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type: type || 'other',
      frequency,
      isRefundable: Boolean(isRefundable),
      description: description ? description.trim() : undefined,
      status: 'active',
    });

    return sendSuccess(res, 'Fee head created successfully', { feeHead }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateFeeHead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, frequency, isRefundable, description, status } = req.body;

    const feeHead = await FeeHead.findById(id);
    if (!feeHead) {
      return sendError(res, 'Fee head not found', 404);
    }

    if (name) feeHead.name = name.trim();
    if (type) feeHead.type = type;
    if (frequency) feeHead.frequency = frequency;
    if (isRefundable !== undefined) feeHead.isRefundable = Boolean(isRefundable);
    if (description !== undefined) feeHead.description = description.trim();
    if (status) feeHead.status = status;

    await feeHead.save();

    return sendSuccess(res, 'Fee head updated successfully', { feeHead });
  } catch (error) {
    next(error);
  }
};

export const deleteFeeHead = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if used in any fee structure
    const inUse = await FeeStructure.findOne({ 'feeItems.feeHead': id });
    if (inUse) {
      return sendError(res, 'Cannot delete this fee head because it is referenced in class fee structures. Deactivate it instead.', 400);
    }

    const feeHead = await FeeHead.findByIdAndDelete(id);
    if (!feeHead) {
      return sendError(res, 'Fee head not found', 404);
    }

    return sendSuccess(res, `Fee head '${feeHead.name}' deleted successfully`);
  } catch (error) {
    next(error);
  }
};
