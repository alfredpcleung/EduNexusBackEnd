const jwt = require('jsonwebtoken');
const UserModel = require('../Models/user');

// Sign Up - Create a new user
module.exports.signup = async function (req, res, next) {
    try {
        const { uid, displayName, email, password, role } = req.body;

        // Validate required fields (uid is now optional - auto-generated)
        if (!displayName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: displayName, email, password"
            });
        }

        // Check if user already exists (only by email if uid is not provided)
        const existingUser = await UserModel.findOne({ 
            $or: uid ? [{ uid }, { email }] : [{ email }]
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        // Create new user (uid will be auto-generated if not provided)
        const newUser = new UserModel({
            uid: uid || undefined, // Let the model generate it if not provided
            displayName,
            email,
            password,
            role: role || "student",
            admin: false
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
            message: "User created successfully",
            token,
            user: {
                displayName: newUser.displayName,
                email: newUser.email,
                role: newUser.role,
                uid: newUser.uid
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
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user by email
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Compare passwords
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
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
            message: "Sign in successful",
            token,
            user: {
                displayName: user.displayName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.log(error);
        next(error);
    }
};
