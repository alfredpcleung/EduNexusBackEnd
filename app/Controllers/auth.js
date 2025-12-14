const { generateToken } = require('../Utils/tokenManager');
const UserModel = require('../Models/user');
const errorResponse = require('../Utils/errorResponse');
const { validationResult } = require('express-validator');

/**
 * POST /api/auth/signup
 * Register a new user and return JWT token
 * Required: firstName, lastName, email, password
 * For students: school and fieldOfStudy also required
 */
const fs = require('fs');
module.exports.signup = async function (req, res, next) {
    try {
        // Handle validation errors from express-validator
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, 400, errors.array().map(e => e.msg).join(', '));
        }
        // Support both legacy and new field names for school and fieldOfStudy
        req.body.school = req.body.school || req.body.schoolName;
        req.body.fieldOfStudy = req.body.fieldOfStudy || req.body.programName;
        const { uid, firstName, lastName, email, password, role, school, fieldOfStudy, github, personalWebsite, linkedin, bio, profilePic } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !password) {
            return errorResponse(res, 400, "Missing required fields: firstName, lastName, email, password");
        }

        // Check if user already exists (only by email if uid is not provided)
        const existingUser = await UserModel.findOne({ 
            $or: uid ? [{ uid }, { email }] : [{ email }]
        });
        if (existingUser) {
            return errorResponse(res, 409, "User with this email already exists");
        }

        const userRole = role || "student";

        // Validate role-specific required fields
        if (userRole === 'student') {
            if (!school || !fieldOfStudy) {
                return errorResponse(res, 400, "School and field of study are required for student users");
            }
        }

        // Debug: log user creation attempt
        const userPayload = {
            uid: uid || undefined,
            firstName,
            lastName,
            email,
            password,
            role: userRole,
            school,
            fieldOfStudy,
            github,
            personalWebsite,
            linkedin,
            bio,
            profilePic
        };
        //
        // Create new user (uid will be auto-generated if not provided)
        const newUser = new UserModel(userPayload);

        // Save user (password will be hashed automatically)
        try {
            await newUser.save();
        } catch (err) {
            throw err;
        }

        // Generate JWT token
        const token = generateToken({ 
            userId: newUser._id,
            uid: newUser.uid,
            email: newUser.email
        });

        res.status(201).json({
            success: true,
            data: {
                token,
                user: {
                    _id: newUser._id,
                    firstName: newUser.firstName,
                    lastName: newUser.lastName,
                    email: newUser.email,
                    role: newUser.role,
                    uid: newUser.uid
                }
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/signin
 * Authenticate user and return JWT token
 * Required: email, password
 */
module.exports.signin = async function (req, res, next) {
    try {
        // Handle validation errors from express-validator
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, 400, errors.array().map(e => e.msg).join(', '));
        }
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return errorResponse(res, 400, "Email and password are required");
        }

        // Find user by email
        const user = await UserModel.findOne({ email });
        if (!user) {
            return errorResponse(res, 401, "Invalid email or password");
        }

        // Compare passwords
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return errorResponse(res, 401, "Invalid email or password");
        }

        // Update lastLogin timestamp
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = generateToken({ 
            userId: user._id,
            uid: user.uid,
            email: user.email
        });

        res.json({
            success: true,
            data: {
                token,
                user: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    uid: user.uid
                }
            }
        });

    } catch (error) {
        next(error);
    }
};
