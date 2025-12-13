const { generateToken } = require('../Utils/tokenManager');
const UserModel = require('../Models/user');
const errorResponse = require('../Utils/errorResponse');

/**
 * POST /api/auth/signup
 * Register a new user and return JWT token
 * Required: firstName, lastName, email, password
 * For students: schoolName, programName also required
 */
module.exports.signup = async function (req, res, next) {
    try {
        const { uid, firstName, lastName, email, password, role, schoolName, programName, github, personalWebsite, linkedin, bio, profilePic } = req.body;

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
            if (!schoolName || !programName) {
                return errorResponse(res, 400, "School Name and Program Name are required for student users");
            }
        }

        // Create new user (uid will be auto-generated if not provided)
        const newUser = new UserModel({
            uid: uid || undefined,
            firstName,
            lastName,
            email,
            password,
            role: userRole,
            schoolName: userRole === 'student' ? schoolName : undefined,
            programName: userRole === 'student' ? programName : undefined,
            github,
            personalWebsite,
            linkedin,
            bio,
            profilePic
        });

        // Save user (password will be hashed automatically)
        await newUser.save();

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
