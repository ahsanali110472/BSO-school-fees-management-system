/**
 * Standard API Response Envelope Utilities
 * Follows Section 38 of project specifications.
 */

export const sendSuccess = (res, message = 'Success', data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res, message = 'An error occurred', statusCode = 500, data = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data,
  });
};
