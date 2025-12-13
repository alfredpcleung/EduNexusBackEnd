const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for authenticated user
 * @param {Object} payload - Token payload (userId, uid, email)
 * @returns {string} Signed JWT token
 * @throws {Error} If JWT_SECRET is not configured
 */
const generateToken = (payload) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
