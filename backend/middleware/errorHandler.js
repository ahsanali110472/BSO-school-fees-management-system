import { sendError } from '../utils/apiResponse.js';

export const notFoundHandler = (req, res, _next) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

export const globalErrorHandler = (err, _req, res, _next) => {
  console.error('[GlobalErrorHandler]', err);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const message = err.message || 'Internal Server Error';

  return sendError(res, message, statusCode, process.env.NODE_ENV === 'development' ? { stack: err.stack } : null);
};
