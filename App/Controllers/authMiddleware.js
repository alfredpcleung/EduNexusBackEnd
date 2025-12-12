const jwt = require('jsonwebtoken');
const errorResponse = require('../Utils/errorResponse');

// Middleware to verify JWT token
module.exports.requireAuth = (req, res, next) => {
    try {
        // Get token from Authorization header
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return errorResponse(res, 401, "No token provided. Please authenticate.");
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return errorResponse(res, 401, "Token has expired. Please sign in again.");
        }
        if (error.name === 'JsonWebTokenError') {
            return errorResponse(res, 401, "Invalid token. Please authenticate.");
        }
        return errorResponse(res, 401, "Authentication failed.");
    }
};
