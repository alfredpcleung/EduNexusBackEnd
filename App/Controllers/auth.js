const jwt = require('jsonwebtoken');
const UserModel = require('../Models/user');

// Sign Up - Create a new user
module.exports.signup = async function (req, res, next) {
    try {
        const { uid, displayName, email, password, role } = req.body;

        // Validate required fields
        if (!uid || !displayName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: uid, displayName, email, password"
            });
        }

        // Check if user already exists
        const existingUser = await UserModel.findOne({ $or: [{ uid }, { email }] });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this uid or email already exists"
            });
        }

        // Create new user
        const newUser = new UserModel({
            uid,
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
                role: newUser.role
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
