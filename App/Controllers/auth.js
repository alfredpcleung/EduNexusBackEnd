const jwt = require('jsonwebtoken');
const UserModel = require('../Models/user');
const errorResponse = require('../Utils/errorResponse');

// Debug: Check if JWT_SECRET is loaded
if (!process.env.JWT_SECRET) {
    console.error('⚠️  WARNING: JWT_SECRET is not defined in environment!');
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('JWT') || k.includes('ATLAS')));
} else {
    console.log('✅ JWT_SECRET is loaded successfully');
}

// Sign Up - Create a new user
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
            uid: uid || undefined, // Let the model generate it if not provided
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
        const token = jwt.sign(
            { 
                userId: newUser._id,
                uid: newUser.uid,
                email: newUser.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

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
        console.log(error);
        next(error);
    }
};

// Sign In - Authenticate user
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

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id,
                uid: user.uid,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

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
        console.log(error);
        next(error);
    }
};
