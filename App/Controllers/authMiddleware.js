const jwt = require('jsonwebtoken');
const User = require('../Models/user');
const errorResponse = require('../Utils/errorResponse');

// Middleware to verify JWT token and fetch user role
module.exports.requireAuth = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return errorResponse(res, 401, "No token provided. Please authenticate.");
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
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
