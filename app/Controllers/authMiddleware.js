const jwt = require('jsonwebtoken');
const User = require('../Models/user');
const errorResponse = require('../Utils/errorResponse');

// Middleware to verify JWT token and fetch user role
module.exports.requireAuth = async (req, res, next) => {
    // Get token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return errorResponse(res, 401, "No token provided. Please authenticate.");
    }


    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        // JWT errors (expired, invalid, etc.)
        console.error('[requireAuth] JWT verification error:', err);
        return errorResponse(res, 401, "Invalid or expired token. Please authenticate again.");
    }

    try {
        // Fetch user from database to get role
        const user = await User.findOne({ uid: decoded.uid }, 'uid role');
        if (!user) {
            return errorResponse(res, 401, "User not found. Please authenticate again.");
        }

        // Set req.user with both JWT payload and database role
        req.user = {
            userId: decoded.userId,
            uid: decoded.uid,
            email: decoded.email,
            role: user.role  // ← NOW includes role from database
        };
        next();
    } catch (err) {
        console.error('[requireAuth] Internal error:', err);
        return errorResponse(res, 500, "Internal authentication error");
    }

};

// Middleware to check for admin role
module.exports.requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return errorResponse(res, 403, 'Admin access required');
    }
    next();
};
