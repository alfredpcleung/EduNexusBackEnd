/**
 * Centralized error response utility
 * Ensures consistent JSON error format across all endpoints
 * 
 * Usage: errorResponse(res, 400, "Missing required fields")
 */

module.exports = (res, statusCode, message) => {
  res.status(statusCode).json({
    success: false,
    message: message
  });
};
